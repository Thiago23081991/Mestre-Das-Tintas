import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { EvaluationResult } from "../types";

class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor() {
    // Check if API key is present
    if (!process.env.API_KEY) {
      console.error("API_KEY environment variable is missing.");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public startChat(): void {
    this.chat = this.ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
  }

  public async sendMessage(message: string): Promise<{ text: string; evaluation?: EvaluationResult }> {
    if (!this.chat) {
      this.startChat();
    }

    if (!this.chat) {
        throw new Error("Failed to initialize chat.");
    }

    try {
      const response = await this.chat.sendMessage({ message });
      const fullText = response.text || "";
      
      // Attempt to extract the JSON block for evaluation
      const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
      let evaluation: EvaluationResult | undefined;
      let cleanText = fullText;

      if (jsonMatch) {
        try {
          evaluation = JSON.parse(jsonMatch[1]);
          // Remove the JSON block from the text shown to user to keep it clean
          cleanText = fullText.replace(jsonMatch[0], "").trim();
        } catch (e) {
          console.error("Failed to parse evaluation JSON", e);
        }
      }

      return { text: cleanText, evaluation };

    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();