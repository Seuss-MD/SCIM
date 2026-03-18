import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import OpenAI from "openai";

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

function getClient() {
  return new OpenAI({ apiKey: OPENAI_API_KEY.value() });
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