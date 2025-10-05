
import { GoogleGenAI, Type } from "@google/genai";
import type { QuizQuestion } from '../types';

const quizSchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      description: "An array of 10 unique multiple-choice quiz questions.",
      items: {
        type: Type.OBJECT,
        properties: {
          questionText: {
            type: Type.STRING,
            description: "The text of the question. If it contains code, it should be formatted as a markdown code block with the language specified (e.g., ```cpp ... ```)."
          },
          answerOptions: {
            type: Type.ARRAY,
            description: "An array of 4 possible string answers. One of them must be the correct answer.",
            items: { type: Type.STRING }
          },
          correctAnswer: {
            type: Type.STRING,
            description: "The correct answer, which must exactly match one of the `answerOptions`."
          },
          explanationText: {
            type: Type.STRING,
            description: "A detailed but concise explanation of why the correct answer is right, relating to the topic."
          }
        },
        required: ["questionText", "answerOptions", "correctAnswer", "explanationText"],
      }
    }
  },
  required: ["questions"],
};


export const generateQuizQuestions = async (topic: string): Promise<QuizQuestion[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `You are an expert computer science professor creating an educational quiz.
    Your task is to generate a set of 10 unique and new multiple-choice questions for the topic: "${topic}".
    
    Guidelines:
    1.  **Variety**: Include a mix of theoretical questions, syntax questions, and code-output prediction questions.
    2.  **Difficulty**: The questions should range from easy to medium difficulty, suitable for university students.
    3.  **Accuracy**: All questions, answers, and explanations must be 100% technically accurate.
    4.  **Distractors**: The incorrect answers should be plausible and common mistakes to challenge the student's understanding.
    5.  **Uniqueness**: Do not repeat questions. Each set of 10 should be fresh.
    6.  **Code Blocks**: When a question involves a code snippet, format it correctly within the 'questionText' using markdown (e.g., \`\`\`cpp ... \`\`\`).
    
    Generate the 10 questions now.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
        temperature: 0.8, // Add some creativity to get different questions each time
      },
    });

    const jsonText = response.text.trim();
    const quizData = JSON.parse(jsonText);
    
    if (quizData.questions && Array.isArray(quizData.questions) && quizData.questions.length > 0) {
        return quizData.questions;
    } else {
        throw new Error("Failed to generate valid quiz questions. The received format is incorrect.");
    }
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    // Provide a more user-friendly error message
    if (error instanceof Error && error.message.includes('json')) {
        throw new Error(`There was an issue with the AI's response format. Please try again.`);
    }
    throw new Error("Could not generate the quiz. Please check the topic or try again later.");
  }
};
