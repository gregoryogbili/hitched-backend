// test-ollama.js
import { extractWithLLM } from "./ollama.js";

const transcript =
  "I want a serious relationship long term. I value honesty and loyalty. I live in Birmingham. I prefer direct communication and I am calm.";

const result = await extractWithLLM(transcript);
console.log("LLM extraction result:");
console.log(result);
