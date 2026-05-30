require('dotenv').config({ path: '../.env' });
if (!process.env.MONGO_URI) {
  require('dotenv').config();
}
const mongoose = require('mongoose');
const User = require('../models/User');
const { generateEmbedding } = require('../utils/embeddings');

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const backfill = async () => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('Error: GEMINI_API_KEY is not set in .env');
      process.exit(1);
    }

    console.log('Connecting to database...');
    const users = await User.find({ role: 'seeker' });
    console.log(`Found ${users.length} job seekers. Generating embeddings...`);

    let updatedCount = 0;

    for (const user of users) {
      const profileText = `Title: ${user.title || ''}. Experience: ${user.experience || 0} years. Skills: ${user.skills ? user.skills.join(', ') : ''}. Bio: ${user.bio || ''}`;
      
      console.log(`Generating embedding for ${user.name}...`);
      const embedding = await generateEmbedding(profileText);
      
      if (embedding && embedding.length > 0) {
        user.profileEmbedding = embedding;
        await user.save();
        updatedCount++;
      } else {
        console.log(`Failed to generate embedding for ${user.name}`);
      }
      
      // Sleep a bit to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Successfully generated and saved embeddings for ${updatedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

backfill();
