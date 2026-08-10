const { GoogleGenAI } = require('@google/genai');

// Initialize Google GenAI with API key from environment variables
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Helper function to return the model instance
const getGeminiModel = (modelName = 'gemini-2.5-flash') => {
  return ai.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });
};

module.exports = { getGeminiModel };