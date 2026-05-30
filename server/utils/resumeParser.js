const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Extracts text from a PDF buffer and uses Gemini to extract structured profile data.
 * @param {Buffer} pdfBuffer - The uploaded PDF file buffer
 * @returns {Promise<Object>} - The extracted JSON profile data
 */
const parseResumeToProfile = async (pdfBuffer) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // 1. Extract raw text from the PDF
  const data = await pdfParse(pdfBuffer);
  const rawText = data.text;

  if (!rawText || rawText.trim().length === 0) {
    throw new Error('Could not extract text from the provided PDF.');
  }

  // 2. Pass text to Gemini to get structured JSON
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
    You are an expert technical recruiter and resume parser.
    Extract the following information from the provided resume text and return it EXCLUSIVELY as a valid JSON object.
    Do not include markdown blocks, just the JSON string.

    Required JSON structure:
    {
      "title": "A short, professional job title based on their experience (e.g. Senior Frontend Developer)",
      "skills": ["skill1", "skill2", "skill3"], // Array of strings, max 10 skills
      "experience": 5, // Integer representing total years of professional experience
      "bio": "A professional summary or bio (max 300 characters) written in the first person."
    }

    Resume Text:
    ${rawText.substring(0, 15000)} // Limit text to avoid token limits
  `;

  const result = await model.generateContent(prompt);
  let responseText = result.response.text();

  // Clean up potential markdown formatting from the response
  if (responseText.startsWith('\`\`\`json')) {
    responseText = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
  } else if (responseText.startsWith('\`\`\`')) {
    responseText = responseText.replace(/\`\`\`/g, '');
  }

  try {
    const profileData = JSON.parse(responseText.trim());
    return profileData;
  } catch (parseError) {
    console.error('Failed to parse Gemini JSON response:', responseText);
    throw new Error('Failed to generate structured profile from resume.');
  }
};

module.exports = { parseResumeToProfile };
