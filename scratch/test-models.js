import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

// Simple .env parser
const envContent = fs.readFileSync('.env', 'utf8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!apiKey) {
  console.error('API Key not found in .env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro', 'gemini-1.5-pro'];
  for (const modelName of models) {
    console.log(`Testing ${modelName}...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello");
      console.log(`Success with ${modelName}: ${result.response.text().substring(0, 20)}...`);
      process.exit(0);
    } catch (err) {
      console.log(`Failed with ${modelName}: ${err.message}`);
    }
  }
}

run();
