/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {setGlobalOptions} from "firebase-functions";
// import {onRequest} from "firebase-functions/https";
// import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
//setGlobalOptions({ maxInstances: 10 });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });


import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import OpenAI from "openai";

const openAiKey = defineSecret("OPENAI_API_KEY");

export const generateDescription = onCall(
  { secrets: [openAiKey] },
  async (request) => {
    const { imageUrl } = request.data as { imageUrl?: string };

    if (!imageUrl || typeof imageUrl !== "string") {
      throw new HttpsError("invalid-argument", "imageUrl is required");
    }

    const openai = new OpenAI({ apiKey: openAiKey.value() });

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
  { secrets: [openAiKey] },
  async (request) => {
    const { text } = request.data as { text?: string };

    if (!text || typeof text !== "string") {
      throw new HttpsError("invalid-argument", "text is required");
    }

    const openai = new OpenAI({ apiKey: openAiKey.value() });

    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return { embedding: emb.data[0].embedding };
  }
);

export const generateImageEmbedding = onCall(
  { secrets: [openAiKey] },
  async (request) => {
    const { imageUrl } = request.data as { imageUrl?: string };

    if (!imageUrl || typeof imageUrl !== "string") {
      throw new HttpsError("invalid-argument", "imageUrl is required");
    }

    const openai = new OpenAI({ apiKey: openAiKey.value() });

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