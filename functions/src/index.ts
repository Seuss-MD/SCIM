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



import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import OpenAI from "openai";

const openAiKey = defineSecret("OPENAI_API_KEY");

export const generateDescription = onCall(
  { secrets: [openAiKey] },
  async (request) => {
    const { imageUrl } = request.data as { imageUrl?: string };
    if (!imageUrl) throw new Error("imageUrl is required");

    const openai = new OpenAI({ apiKey: openAiKey.value() });

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this object clearly for inventory tracking." },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 200,
    });

    return { description: resp.choices[0]?.message?.content ?? "" };
  }
);

// embedding function stays the same
export const generateEmbedding = onCall(
  { secrets: [openAiKey] },
  async (request) => {
    const { text } = request.data as { text?: string };
    if (!text) throw new Error("text is required");

    const openai = new OpenAI({ apiKey: openAiKey.value() });

    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return { embedding: emb.data[0].embedding };
  }
);