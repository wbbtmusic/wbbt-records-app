import { GoogleGenAI } from "@google/genai";

// NOTE: In a real production app, never expose API keys on the client.
const apiKey = process.env.API_KEY || ''; 
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const analyzeLyrics = async (lyrics: string): Promise<string> => {
  if (!ai) return "AI Service Unavailable (Missing Key)";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these song lyrics and provide a 2-sentence summary of the mood and potential genre suitability: "${lyrics}"`,
    });
    return response.text || "Could not analyze.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI Analysis Failed";
  }
};

export const suggestMarketingTagline = async (trackTitle: string, genre: string): Promise<string> => {
   if (!ai) return "Music for the future.";

   try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a catchy, short, 10-word marketing tagline/pitch for a ${genre} track titled "${trackTitle}".`,
    });
    return response.text || "Listen now on WBBT.";
   } catch (error) {
     return "Listen now on WBBT.";
   }
}

export const generateLyrics = async (topic: string, genre: string): Promise<string> => {
    if (!ai) return "Service Unavailable";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write a verse and a chorus for a ${genre} song about ${topic}. Keep it modern and edgy.`
        });
        return response.text || "";
    } catch (e) { return "Error generating lyrics."; }
}

export const generateArtPrompt = async (songTitle: string, mood: string): Promise<string> => {
    if (!ai) return "Service Unavailable";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Create a detailed stable diffusion or midjourney prompt to generate a cover art for a song titled "${songTitle}" with a "${mood}" mood. Abstract, high quality, 4k.`
        });
        return response.text || "";
    } catch (e) { return "Error generating prompt."; }
}
