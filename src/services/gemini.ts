import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface DiagnosisResult {
  crop: string;
  disease: string;
  confidence: number;
  symptoms: string[];
  treatment: string[];
  prevention: string[];
}

export async function diagnoseCrop(base64Image: string, mimeType: string): Promise<DiagnosisResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Analyze this image of a crop or plant. Identify the crop and any diseases or pests present. 
  If the plant is healthy, state 'Healthy' for the disease.
  Provide the diagnosis in a structured JSON format.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Image.split(',')[1] || base64Image,
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          crop: { type: Type.STRING, description: "The type of crop identified" },
          disease: { type: Type.STRING, description: "The name of the disease or 'Healthy'" },
          confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" },
          symptoms: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of observed symptoms"
          },
          treatment: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Recommended treatment steps"
          },
          prevention: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Prevention strategies for the future"
          },
        },
        required: ["crop", "disease", "confidence", "symptoms", "treatment", "prevention"],
      },
    },
  });

  const text = response.text;
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini response:", text);
    throw new Error("Invalid response from AI model");
  }
}
