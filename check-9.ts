import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("No API key");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function getSubject(num: number): Promise<string> {
  const imgPath = path.join(process.cwd(), "public", "choijiwon", `${num}.png`);
  if (!fs.existsSync(imgPath)) {
    return "NOT_FOUND";
  }
  const b64 = fs.readFileSync(imgPath).toString("base64");
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: "What is physically in this picture? Describe the main subject in 2-3 words in Korean (e.g., 원숭이 인형, 초콜릿 케이크, 소금빵, 말차 라떼)." },
        { inlineData: { mimeType: "image/png", data: b64 } }
      ]
    });
    return response.text ? response.text.trim() : "EMPTY";
  } catch (err: any) {
    return "ERROR: " + err.message;
  }
}

async function main() {
  console.log("Checking subject of image 9 on disk using gemini-3.5-flash...");
  const sub = await getSubject(9);
  console.log(`Image 9: ${sub}`);
}

main().catch(console.error);
