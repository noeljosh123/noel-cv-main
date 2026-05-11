import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  try {
    const models = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`).then(res => res.json());
    console.log(JSON.stringify(models, null, 2));
  } catch (err) {
    console.error(err);
  }
}
run();
