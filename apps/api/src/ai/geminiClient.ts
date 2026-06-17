import { GoogleGenAI } from "@google/genai";
import type { z } from "zod";
import { env } from "../config/env.js";

export interface GenerateJsonInput<TSchema extends z.ZodType> {
  task: string;
  system: string;
  prompt: string;
  schema: TSchema;
  temperature?: number;
}

export interface GenerateJsonResult<T> {
  data: T;
  model: string;
  rawText: string;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(unfenced);
  } catch {
    const firstBrace = unfenced.indexOf("{");
    const lastBrace = unfenced.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(unfenced.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("Model did not return valid JSON.");
  }
}

export async function generateJson<TSchema extends z.ZodType>(
  input: GenerateJsonInput<TSchema>,
): Promise<GenerateJsonResult<z.infer<TSchema>>> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: env.GEMINI_PIPELINE_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${input.system}\n\nTask: ${input.task}\n\n${input.prompt}`,
          },
        ],
      },
    ],
    config: {
      temperature: input.temperature ?? 0.2,
      responseMimeType: "application/json",
    },
  });

  const rawText = response.text ?? "";
  if (!rawText) throw new Error("Model returned an empty response.");

  const json = extractJson(rawText);
  return {
    data: input.schema.parse(json),
    model: env.GEMINI_PIPELINE_MODEL,
    rawText,
  };
}
