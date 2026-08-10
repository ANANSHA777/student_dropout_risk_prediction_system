require('dotenv').config(); // MUST BE AT THE VERY TOP
const { GoogleGenAI } = require('@google/genai');

// Pass apiKey explicitly to override Vertex AI default auth
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

exports.evaluateStudentRisk = async (studentData) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this student data for dropout risk and return JSON: ${JSON.stringify(studentData)}`,
    });

    return response.text;
  } catch (error) {
    console.error('Gemini AI Assessment Error:', error);
    throw error;
  }
};