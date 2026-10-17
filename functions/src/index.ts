/**
 * SCIM Cloud Functions.
 *
 * - AI callables (description + embeddings) proxy OpenAI so the API key
 *   never ships in the mobile app. Every callable requires a signed-in user.
 * - Firestore triggers send Expo push notifications to the members of the
 *   workspace where an item or container was created.
 */
import {onCall, HttpsError, CallableRequest} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {defineSecret} from "firebase-functions/params";
import {logger} from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import OpenAI from "openai";

initializeApp();

const db = getFirestore();
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

const VISION_MODEL = "gpt-4.1-mini";
const EMBEDDING_MODEL = "text-embedding-3-small";
const MAX_TEXT_LENGTH = 2000;
const DESCRIBE_PROMPT =
  "Describe this inventory object clearly for semantic search. " +
  "Include object type, color, material, brand if visible, and " +
  "distinguishing features. Return one concise paragraph.";

const callableOptions = {secrets: [OPENAI_API_KEY], maxInstances: 10};

type UserNotificationPrefs = {
  expoPushToken?: string | null;
  notificationsEnabled?: boolean;
  notifyOnNewItems?: boolean;
  notifyOnNewContainers?: boolean;
};

type PushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

/**
 * Creates an OpenAI client using the secret bound to the function.
 * @return {OpenAI} configured client
 */
function getClient(): OpenAI {
  return new OpenAI({apiKey: OPENAI_API_KEY.value()});
}

/**
 * Rejects unauthenticated calls so the endpoints can't be used to spend
 * OpenAI credits by anyone who finds the project ID.
 * @param {CallableRequest} request incoming callable request
 * @return {string} the caller's uid
 */
function requireAuth(request: CallableRequest): string {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to use AI features.");
  }
  return uid;
}

/**
 * Validates that a value is a non-empty https URL.
 * @param {unknown} value raw input
 * @return {string} the validated URL
 */
function requireImageUrl(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("https://")) {
    throw new HttpsError("invalid-argument", "imageUrl must be an https URL");
  }
  return value;
}

/**
 * Asks the vision model for a search-friendly description of a photo.
 * @param {OpenAI} openai client
 * @param {string} imageUrl public URL of the photo
 * @return {Promise<string>} one-paragraph description
 */
async function describeImage(
  openai: OpenAI,
  imageUrl: string
): Promise<string> {
  const resp = await openai.responses.create({
    model: VISION_MODEL,
    input: [
      {
        role: "user",
        content: [
          {type: "input_text", text: DESCRIBE_PROMPT},
          {type: "input_image", image_url: imageUrl, detail: "high"},
        ],
      },
    ],
  });

  const description = resp.output_text?.trim() ?? "";
  if (!description) {
    throw new HttpsError("internal", "Failed to generate description");
  }
  return description;
}

/**
 * Embeds text for cosine-similarity search.
 * @param {OpenAI} openai client
 * @param {string} text input text
 * @return {Promise<number[]>} embedding vector
 */
async function embedText(openai: OpenAI, text: string): Promise<number[]> {
  const emb = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return emb.data[0].embedding;
}

export const generateDescription = onCall(
  callableOptions,
  async (request) => {
    requireAuth(request);
    const imageUrl = requireImageUrl(request.data?.imageUrl);
    const description = await describeImage(getClient(), imageUrl);
    return {description};
  }
);

export const generateEmbedding = onCall(
  callableOptions,
  async (request) => {
    requireAuth(request);
    const text = request.data?.text;

    if (typeof text !== "string" || !text.trim()) {
      throw new HttpsError("invalid-argument", "text is required");
    }
    if (text.length > MAX_TEXT_LENGTH) {
      throw new HttpsError("invalid-argument", "text is too long");
    }

    const embedding = await embedText(getClient(), text);
    return {embedding};
  }
);

export const generateImageEmbedding = onCall(
  callableOptions,
  async (request) => {
    requireAuth(request);
    const imageUrl = requireImageUrl(request.data?.imageUrl);

    const openai = getClient();
    const description = await describeImage(openai, imageUrl);
    const embedding = await embedText(openai, description);

    return {description, embedding};
  }
);

/**
 * Sends a batch of messages through the Expo push service.
 * @param {PushMessage[]} messages messages to send
 */
async function sendExpoPushMessages(messages: PushMessage[]) {
  if (!messages.length) return;

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    logger.error("Expo push failed", {status: response.status});
    return;
  }

  logger.info("Expo push sent", {count: messages.length});
}

/**
 * Lists the uids that belong to a workspace. A personal workspace's id is
 * its owner's uid; a group workspace's members live under groups/{id}.
 * @param {string} workspaceId workspace document id
 * @return {Promise<string[]>} member uids
 */
async function getWorkspaceMemberIds(workspaceId: string): Promise<string[]> {
  const groupMembers = await db
    .collection("groups")
    .doc(workspaceId)
    .collection("members")
    .get();

  if (!groupMembers.empty) {
    return groupMembers.docs.map((doc) => doc.id);
  }

  return [workspaceId];
}

/**
 * Finds workspace members who opted in to a notification type.
 * Only members of the workspace are considered, never the whole user base.
 * @param {string} workspaceId workspace where the change happened
 * @param {string} preferenceKey which opt-in flag to check
 * @return {Promise<string[]>} Expo push tokens to notify
 */
async function getTokensToNotify(
  workspaceId: string,
  preferenceKey: "notifyOnNewItems" | "notifyOnNewContainers"
): Promise<string[]> {
  const memberIds = await getWorkspaceMemberIds(workspaceId);
  if (!memberIds.length) return [];

  const userDocs = await db.getAll(
    ...memberIds.map((uid) => db.collection("users").doc(uid))
  );

  return userDocs
    .map((doc) => doc.data() as UserNotificationPrefs | undefined)
    .filter(
      (user): user is UserNotificationPrefs & {expoPushToken: string} =>
        !!user &&
        user.notificationsEnabled === true &&
        user[preferenceKey] === true &&
        typeof user.expoPushToken === "string" &&
        user.expoPushToken.startsWith("ExponentPushToken[")
    )
    .map((user) => user.expoPushToken);
}

export const notifyOnItemCreated = onDocumentCreated(
  "workspaces/{workspaceId}/items/{itemId}",
  async (event) => {
    const item = event.data?.data();
    if (!item) return;

    const {workspaceId, itemId} = event.params;
    const tokens = await getTokensToNotify(workspaceId, "notifyOnNewItems");

    const name = typeof item.name === "string" ? item.name.trim() : "";
    await sendExpoPushMessages(
      tokens.map((to) => ({
        to,
        title: "New item added",
        body: name ? `"${name}" was added.` : "A new item was added.",
        data: {screen: "item", id: itemId, workspaceId},
      }))
    );
  }
);

export const notifyOnContainerCreated = onDocumentCreated(
  "workspaces/{workspaceId}/containers/{containerId}",
  async (event) => {
    const container = event.data?.data();
    if (!container) return;

    const {workspaceId, containerId} = event.params;
    const tokens = await getTokensToNotify(
      workspaceId,
      "notifyOnNewContainers"
    );

    const name =
      typeof container.name === "string" ? container.name.trim() : "";
    await sendExpoPushMessages(
      tokens.map((to) => ({
        to,
        title: "New container created",
        body: name ? `"${name}" was created.` : "A new container was created.",
        data: {screen: "container", id: containerId, workspaceId},
      }))
    );
  }
);
