import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateTaskDescription(title: string, category: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a short, engaging, and professional task description for an HR productivity tool. 
      Task Title: ${title}
      Category: ${category}
      Keep it under 100 words.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate description.";
  }
}

export async function getAIInsights(tasks: any[], profile: any) {
  console.log("Fetching AI Insights for:", profile.displayName);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As an AI HR assistant, provide 3 short, personalized productivity tips for this user.
      User: ${profile.displayName}
      Current Points: ${profile.points}
      Current Streak: ${profile.streak}
      Recent Tasks: ${tasks.length > 0 ? JSON.stringify(tasks.slice(0, 5)) : "No tasks yet. Encourage them to start their first mission."}
      
      Requirements:
      - 3 tips total
      - Each tip under 15 words
      - Tone: Encouraging and professional
      - Format: A JSON array of strings only. Example: ["Tip 1", "Tip 2", "Tip 3"]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: { type: "string" }
        }
      }
    });
    
    const text = response.text;
    console.log("AI Response Text:", text);
    
    if (!text) throw new Error("Empty AI response");

    const cleanJson = text.replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);
    
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    throw new Error("Invalid AI response format");
  } catch (error) {
    console.error("Gemini Error:", error);
    return [
      "Start your first mission to build momentum!",
      "Consistency is key—try to complete one task today.",
      "Explore the social feed to see what others are achieving."
    ];
  }
}
