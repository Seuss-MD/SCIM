// functions/src/index.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import OpenAI from "openai";

initializeApp();

const db = getFirestore();
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

function getClient() {
  return new OpenAI({ apiKey: OPENAI_API_KEY.value() });
}

type UserNotificationPrefs = {
  expoPushToken?: string | null;
  notificationsEnabled?: boolean;
  notifyOnNewItems?: boolean;
  notifyOnNewContainers?: boolean;
};

async function sendExpoPushMessages(
  messages: {
    to: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }[]
) {
  if (!messages.length) return;

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  const result = await response.json();
  console.log("Expo push result:", result);
}

async function getUsersToNotify(
  preferenceKey: "notifyOnNewItems" | "notifyOnNewContainers"
) {
  const usersSnap = await db.collection("users").get();

  return usersSnap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as UserNotificationPrefs) }))
    .filter(
      (user) =>
        user.notificationsEnabled === true &&
        user[preferenceKey] === true &&
        typeof user.expoPushToken === "string" &&
        user.expoPushToken.startsWith("ExponentPushToken[")
    );
}

export const generateDescription = onCall(
  { secrets: [OPENAI_API_KEY] },
  async (request) => {
    const { imageUrl } = request.data as { imageUrl?: string };

    if (!imageUrl || typeof imageUrl !== "string") {
      throw new HttpsError("invalid-argument", "imageUrl is required");
    }

    const openai = getClient();

    const resp = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Describe this inventory object clearly for semantic search. " +
                "Include object type, color, material, brand if visible, and distinguishing features. " +
                "Return one concise paragraph.",
            },
            {
              type: "input_image",
              image_url: imageUrl,
              detail: "high",
            },
          ],
        },
      ],
    });

    const description = resp.output_text?.trim() ?? "";
    if (!description) {
      throw new HttpsError("internal", "Failed to generate description");
    }

    return { description };
  }
);

export const generateEmbedding = onCall(
  { secrets: [OPENAI_API_KEY] },
  async (request) => {
    const { text } = request.data as { text?: string };

    if (!text || typeof text !== "string") {
      throw new HttpsError("invalid-argument", "text is required");
    }

    const openai = getClient();

    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return { embedding: emb.data[0].embedding };
  }
);

export const generateImageEmbedding = onCall(
  { secrets: [OPENAI_API_KEY] },
  async (request) => {
    const { imageUrl } = request.data as { imageUrl?: string };

    if (!imageUrl || typeof imageUrl !== "string") {
      throw new HttpsError("invalid-argument", "imageUrl is required");
    }

    const openai = getClient();

    const vision = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Describe this inventory object clearly for semantic search. " +
                "Include object type, color, material, brand if visible, and distinguishing features. " +
                "Return one concise paragraph.",
            },
            {
              type: "input_image",
              image_url: imageUrl,
              detail: "high",
            },
          ],
        },
      ],
    });

    const description = vision.output_text?.trim() ?? "";
    if (!description) {
      throw new HttpsError("internal", "Failed to generate description");
    }

    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: description,
    });

    return {
      description,
      embedding: emb.data[0].embedding,
    };
  }
);

export const notifyOnItemCreated = onDocumentCreated(
  "items/{itemId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const item = snapshot.data();
    const itemId = event.params.itemId;

    const users = await getUsersToNotify("notifyOnNewItems");

    const messages = users.map((user) => ({
      to: user.expoPushToken as string,
      title: "New item added",
      body:
        typeof item?.name === "string" && item.name.trim()
          ? `"${item.name}" was added.`
          : "A new item was added.",
      data: {
        screen: "item",
        id: itemId,
      },
    }));

    await sendExpoPushMessages(messages);
  }
);

export const notifyOnContainerCreated = onDocumentCreated(
  "containers/{containerId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const container = snapshot.data();
    const containerId = event.params.containerId;

    const users = await getUsersToNotify("notifyOnNewContainers");

    const messages = users.map((user) => ({
      to: user.expoPushToken as string,
      title: "New container created",
      body:
        typeof container?.name === "string" && container.name.trim()
          ? `"${container.name}" was created.`
          : "A new container was created.",
      data: {
        screen: "container",
        id: containerId,
      },
    }));

    await sendExpoPushMessages(messages);
  }
);