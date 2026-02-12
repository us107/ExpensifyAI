
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ExtractionResult, ExpenseCategory } from "../types";

export const extractExpenseFromImage = async (base64Image: string): Promise<ExtractionResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
        {
          text: `Extract travel expense details from this receipt image. 
          Return the data in a structured JSON format. 
          Categorize the expense into one of: Hotel, Transport, Meal, or Other.
          Include the specific location if mentioned (city/country).
          Describe the details briefly (e.g., "Dinner at Italian restaurant", "Flight to London").`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: "The date of the expense (YYYY-MM-DD)" },
          vendor: { type: Type.STRING, description: "Name of the business/hotel/provider" },
          amount: { type: Type.NUMBER, description: "Numerical amount of the expense" },
          currency: { type: Type.STRING, description: "The currency code (e.g., USD, EUR, INR)" },
          category: { 
            type: Type.STRING, 
            description: "Category: Hotel, Transport, Meal, or Other" 
          },
          location: { type: Type.STRING, description: "City or specific location" },
          details: { type: Type.STRING, description: "Short summary of what was purchased" },
        },
        required: ["date", "vendor", "amount", "currency", "category", "location", "details"],
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to extract data from image");
  }

  return JSON.parse(response.text.trim()) as ExtractionResult;
};
