// ollama.js
import fetch from "node-fetch";
import { PROFILE_EXTRACTION_PROMPT } from "./prompts.js";

export async function extractWithLLM(transcript) {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3",
      prompt: `${PROFILE_EXTRACTION_PROMPT}\n\nTranscript:\n${transcript}`,
      format: "json",           // 🔒 THIS IS THE KEY
      stream: false
    })
  });

  const data = await response.json();

  // In JSON mode, Ollama returns the object directly
  return data.response;
}
