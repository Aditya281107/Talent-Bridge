const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Google Generative AI client
// The user MUST provide GEMINI_API_KEY in their .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generate a dense vector embedding for a given text string.
 * @param {string} text - The input text to embed
 * @returns {Promise<number[]>} - The vector array
 */
const generateEmbedding = async (text) => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not set. Skipping embedding generation.');
    return [];
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    const result = await model.embedContent(text);
    return result.embedding.values; // Returns an array of numbers
  } catch (err) {
    console.error('Error generating Google embedding:', err);
    return [];
  }
};

/**
 * Calculates the cosine similarity between two vectors.
 * Since the embeddings are normalized (L2 norm = 1), 
 * the cosine similarity is just the dot product!
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number} Score between -1 and 1
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
};

module.exports = {
  generateEmbedding,
  cosineSimilarity,
};
