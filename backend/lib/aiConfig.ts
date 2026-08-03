import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Google Gemini API configuration settings
export const MODEL_NAME = 'gemini-3.5-flash-lite';
export const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
export const MAX_TOKENS = 2048;
export const TEMPERATURE = 0.7;

// System prompt guiding Gemini's persona and styling rules
export const SYSTEM_PROMPT = `You are a helpful, professional, and friendly AI assistant for the user's capstone project. 
Feel free to provide clear explanations, well-documented code snippets using Markdown, and structured layout formatting where appropriate.`;

/**
 * Retrieves the Google Gemini API key from the environment.
 * Throws a helpful error if the API key is not defined.
 */
export function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_key_here')) {
    throw new Error('Missing or invalid GEMINI_API_KEY in environment variables. Please check the backend .env file.');
  }
  return apiKey;
}
