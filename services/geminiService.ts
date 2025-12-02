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
      
      let evaluation: EvaluationResult | undefined;
      let cleanText = fullText;

      // --- STRATEGY 1: Standard Markdown Code Block ---
      // Looks for ```json { ... } ``` or just ``` { ... } ```
      const codeBlockMatch = fullText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      
      if (codeBlockMatch) {
        try {
          evaluation = JSON.parse(codeBlockMatch[1]);
          // Remove the code block from the UI text
          cleanText = fullText.replace(codeBlockMatch[0], "").trim();
        } catch (e) {
          console.warn("Strategy 1 (Code Block) failed:", e);
        }
      }

      // --- STRATEGY 2: Greedy JSON Search (Fallback) ---
      // If Strategy 1 failed, look for the last occurrence of "}" and the matching "{"
      if (!evaluation) {
        try {
            const firstOpen = fullText.indexOf('{');
            const lastClose = fullText.lastIndexOf('}');
            
            if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
                const potentialJson = fullText.substring(firstOpen, lastClose + 1);
                evaluation = JSON.parse(potentialJson);
                
                // If the JSON was found at the end of the message, remove it from display text
                // Check if the JSON constitutes a significant portion of the end of the string
                if (lastClose > fullText.length - 20) {
                     cleanText = fullText.substring(0, firstOpen).trim();
                }
            }
        } catch (e) {
             console.warn("Strategy 2 (Greedy Search) failed:", e);
        }
      }

      // Safety check for options array
      if (evaluation && evaluation.options && !Array.isArray(evaluation.options)) {
          evaluation.options = [];
      }

      return { text: cleanText, evaluation };

    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
