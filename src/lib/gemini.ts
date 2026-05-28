import { GoogleGenerativeAI } from "@google/generative-ai"

export const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set")
  }

  return new GoogleGenerativeAI(apiKey)
}

export const getVisionModel = () =>
  getGeminiClient().getGenerativeModel({ model: "gemini-2.0-flash" })
