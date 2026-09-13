const { GoogleGenAI } = require('@google/genai');

// Initialize Google GenAI with API key from environment variables
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Executes a Gemini prompt with structured JSON response configuration.
 * 
 * @param {string} prompt - The prompt string to be evaluated.
 * @param {string} [modelName='gemini-2.5-flash'] - Model identifier.
 * @param {Object} [schema=null] - Optional OpenAPI JSON response schema for strict validation.
 * @returns {Promise<Object>} The parsed JSON object returned by Gemini.
 */
const generateJSONContent = async (
  prompt,
  modelName = 'gemini-2.5-flash',
  schema = null
) => {
  const config = {
    responseMimeType: 'application/json',
  };

  if (schema) {
    config.responseSchema = schema;
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config,
  });

  const rawText = (response.text || '').trim();
  const cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

  return JSON.parse(cleanedText);
};

module.exports = {
  ai,
  generateJSONContent,
};