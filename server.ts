import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parser with larger limits for audio files or large text inputs
app.use(express.json({ limit: "10mb" }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper for AI responses
async function generateAiContent(prompt: string, config: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: config,
    });
    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate AI response");
  }
}

// 1. Interactive Conversation API
app.post("/api/coach/chat", async (req, res) => {
  try {
    const { messages, character, level, focus } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages history is required." });
    }

    const currentCharacter = character || {
      name: "Emma",
      role: "Casual Friend",
      personality: "Warm, empathetic, and enthusiastic conversationalist. Uses natural expressions, moderate speed, and supports learning.",
      context: "A cozy local coffee shop, discussing weekend plans.",
      exampleDialog: "Hey there! I just grabbed a table by the window. What are you up to this weekend?"
    };

    const currentLevel = level || "intermediate";
    const currentFocus = focus || "comprehensive";

    // Format chat history for prompt
    let chatHistoryText = "";
    messages.forEach((msg: any) => {
      chatHistoryText += `${msg.role === "user" ? "Learner" : "Tutor"}: ${msg.content}\n`;
    });

    const userLatestMessage = messages[messages.length - 1].content;

    const systemPrompt = `You are an expert English communication tutor and the user's roleplay conversation partner.
You will act as the character: "${currentCharacter.name}" or role: "${currentCharacter.role}".
Character Personality: ${currentCharacter.personality}
Current Setting/Context of interaction: ${currentCharacter.context}

The user's English level is: ${currentLevel} (adjust your vocabulary, complexity, and sentence structures accordingly).
Focal feedback area: ${currentFocus}.

YOUR DUAL MISSION:
1. Generate a natural, engaging, and in-character reply to the learner's last message. Keep the reply around 2-4 sentences to facilitate a balanced conversation. Do not break character in this reply!
2. Provide constructive, high-fidelity linguistic feedback on the learner's LATEST message ("${userLatestMessage}"). Analyze it for:
   - Grammar: Pinpoint grammar slips, spelling errors, or awkward phrasing. Provide correct forms and simple, clear explanations.
   - Vocabulary boost: Recommend 1-3 advanced alternatives, synonyms, or natural idiom replacements that native speakers would use, providing clear examples and definitions.
   - General communication tips: Offer friendly feedback on tone, politeness, cultural context, or conversational flow.
   - Pronunciation advice: Pinpoint words inside the learner's text that could be tricky to pronounce, providing their spelling, basic phonetic guides, or key phonetic elements (e.g., distinguishing "th" sound, silent letters).
   - Score: Provide a holistic English score (from 0 to 100) representing grammar correctness and conversational naturalness.

IMPORTANT FORMAT INSTRUCTION:
You MUST respond with a strict, parseable JSON object matching this schema:
{
  "reply": "The response in character as ${currentCharacter.name}",
  "feedback": {
    "originalText": "The learner's input verbatim",
    "correctedText": "The grammatically corrected and highly natural version of the learner's input. Leave null if the user's text was flawless.",
    "grammarScore": 85, // Number 0-100 indicating grammatical correctness and structural quality
    "corrections": [
      {
        "error": "The exact mistake found",
        "correction": "The corrected wording or grammatical construct",
        "explanation": "Brief, beginner-friendly explanation of why it was wrong and the rule behind it."
      }
    ],
    "vocabularyBoosters": [
      {
        "originalWord": "The word or phrase the user wrote",
        "betterWord": "A more advanced, natural, or idiomatic replacement",
        "meaning": "Brief, clean definition of the better word",
        "example": "A clear, contextual example sentence using the better word"
      }
    ],
    "pronunciationTips": [
      {
        "word": "The tricky word from user's message",
        "phonetic": "A simple phonetic guide (e.g., reh-stuh-rahnt for restaurant)",
        "tip": "Short explanation of how to articulate it (e.g., 'Ensure the r is soft, and the second syllable is almost quiet.')"
      }
    ],
    "communicationTips": "General feedback on appropriateness of tone, politeness level, or tips to sound more natural in this context."
  }
}

Do not include any Markdown blocks such as \`\`\`json or trailing commas that violate JSON standards. Output ONLY the raw JSON string.`;

    const result = await generateAiContent(
      `Here is the conversation history:\n${chatHistoryText}\n\nLast Learner Message to evaluate and respond to: "${userLatestMessage}"`,
      {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            feedback: {
              type: Type.OBJECT,
              properties: {
                originalText: { type: Type.STRING },
                correctedText: { type: Type.STRING },
                grammarScore: { type: Type.INTEGER },
                corrections: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      error: { type: Type.STRING },
                      correction: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                    },
                    required: ["error", "correction", "explanation"],
                  },
                },
                vocabularyBoosters: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      originalWord: { type: Type.STRING },
                      betterWord: { type: Type.STRING },
                      meaning: { type: Type.STRING },
                      example: { type: Type.STRING },
                    },
                    required: ["originalWord", "betterWord", "meaning", "example"],
                  },
                },
                pronunciationTips: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: { type: Type.STRING },
                      phonetic: { type: Type.STRING },
                      tip: { type: Type.STRING },
                    },
                    required: ["word", "phonetic", "tip"],
                  },
                },
                communicationTips: { type: Type.STRING },
              },
              required: ["originalText", "grammarScore", "corrections", "vocabularyBoosters", "pronunciationTips", "communicationTips"],
            },
          },
          required: ["reply", "feedback"],
        },
      }
    );

    if (!result) {
      throw new Error("Empty response from AI");
    }

    const data = JSON.parse(result);
    res.json(data);
  } catch (error: any) {
    console.error("Route /api/coach/chat Error:", error);
    res.status(500).json({ error: error.message || "An error occurred with the AI Coach." });
  }
});

// 2. Grammar & Structure Lab Analyzer API
app.post("/api/coach/analyze", async (req, res) => {
  try {
    const { text, focus } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required to perform analysis." });
    }

    const currentFocus = focus || "general";

    const systemPrompt = `You are an expert English Language Professor.
Analyze the user's provided English paragraph or text to give comprehensive educational feedback, sentence restructure proposals, and explanations.

Provide a strict, parseable JSON response matching the following schema:
{
  "readabilityScore": 78, // Number 0-100 indicating ease of comprehension
  "sentenceCount": 3,
  "issueCount": 2,
  "restructuredText": "A fully polished, elegant version of the user text.",
  "breakdown": [
    {
      "originalSentence": "The user's original sentence",
      "status": "correct" | "needs_improvement" | "incorrect",
      "suggestion": "Better wording or correct format",
      "details": "Explanation of vocabulary choices, syntax guidelines, or grammar rules."
    }
  ],
  "structuralHighlights": [
    {
      "topic": "e.g., Subject-Verb Agreement, Phrasal Verbs, Tenses",
      "feedback": "Observations of how the user applied this topic, including praises and guidelines."
    }
  ]
}

Ensure the output is raw, valid JSON only.`;

    const result = await generateAiContent(
      `Focus Mode: ${currentFocus}\nText to Analyze:\n"${text}"`,
      {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            readabilityScore: { type: Type.INTEGER },
            sentenceCount: { type: Type.INTEGER },
            issueCount: { type: Type.INTEGER },
            restructuredText: { type: Type.STRING },
            breakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalSentence: { type: Type.STRING },
                  status: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  details: { type: Type.STRING },
                },
                required: ["originalSentence", "status", "suggestion", "details"],
              },
            },
            structuralHighlights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  feedback: { type: Type.STRING },
                },
                required: ["topic", "feedback"],
              },
            },
          },
          required: ["readabilityScore", "sentenceCount", "issueCount", "restructuredText", "breakdown", "structuralHighlights"],
        },
      }
    );

    if (!result) {
      throw new Error("No response from analysis tool.");
    }

    const data = JSON.parse(result);
    res.json(data);
  } catch (error: any) {
    console.error("Route /api/coach/analyze Error:", error);
    res.status(500).json({ error: error.message || "An error occurred with the Grammar Lab AI." });
  }
});

// 3. Idiom & Vocabulary Challenges System API
app.get("/api/coach/challenges", async (req, res) => {
  try {
    const systemPrompt = `You are an English language curriculum designer.
Generate 4 unique, diverse English communication challenges for today across multiple themes:
1. "Idiom of the Day": A specific English idiom with detailed context.
2. "Phonetic Pronunciation Twister": A tricky tongue twister or phrase containing complex sounds.
3. "Phrasal Verb Challenge": A vital everyday phrasal verb.
4. "Modern Workplace Accent": A vital professional communication expression.

Provide a strict, parseable JSON response matching the following schema:
{
  "challenges": [
    {
      "id": "idiom_of_day", // Must be unique
      "category": "Idiom of the Day",
      "title": "e.g., Break a leg",
      "meaning": "e.g., A way to wish someone good luck, primarily in theaters and performances.",
      "dialogExample": "e.g., 'You're going to present your startup deck today? Break a leg!'",
      "instruction": "Explain how you would use this idiom in a sentence or talk about a time you cheered on a friend.",
      "phonetic": "brayk uh leg"
    },
    ...
  ]
}

Generate exactly 4 objects in the challenges array, matching the 4 themes described above. Adjust types and categories cleanly. Output raw, valid JSON.`;

    const result = await generateAiContent("Please generate the daily challenges package.", {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          challenges: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                category: { type: Type.STRING },
                title: { type: Type.STRING },
                meaning: { type: Type.STRING },
                dialogExample: { type: Type.STRING },
                instruction: { type: Type.STRING },
                phonetic: { type: Type.STRING },
              },
              required: ["id", "category", "title", "meaning", "dialogExample", "instruction", "phonetic"],
            },
          },
        },
        required: ["challenges"],
      },
    });

    if (!result) {
      throw new Error("No response back from curriculum system.");
    }

    const data = JSON.parse(result);
    res.json(data);
  } catch (error: any) {
    console.error("Route /api/coach/challenges Error:", error);
    res.status(500).json({ error: error.message || "An error occurred fetching English challenges." });
  }
});

// 4. Evaluate Challenge Response
app.post("/api/coach/challenge/evaluate", async (req, res) => {
  try {
    const { challenge, userResponse } = req.body;

    if (!challenge || !userResponse) {
      return res.status(400).json({ error: "Challenge model and userResponse are required." });
    }

    const systemPrompt = `You are a warm, encouraging ESL English Tutor checking a student's response to an exercise challenge.
Challenge Details:
- Category: ${challenge.category}
- Challenge Item: ${challenge.title}
- Target Challenge Prompt/Instruction: ${challenge.instruction}

Student Answer: "${userResponse}"

Evaluate the student's response for:
1. Semantic Correctness: Did they apply the phrase, idiom, phrasal verb, or twister correctly in their context?
2. Grammatical and vocabulary accuracy.
3. Naturalness and flow.

Produce a strict, parseable JSON response matching this schema:
{
  "passed": true, // Boolean, true if they successfully completed or attempted the challenge correctly
  "score": 90, // Number 0-100 indicating performance
  "verdict": "e.g., Perfect formulation!",
  "analysis": "Provide a descriptive 3-4 sentence warm review. If there are minor spelling or preposition slips, explain how they can perfect it, or explain why their sentence structure is natural."
}

Do not output any introductory or concluding text. Output raw JSON only.`;

    const result = await generateAiContent("Evaluate the user response.", {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          passed: { type: Type.BOOLEAN },
          score: { type: Type.INTEGER },
          verdict: { type: Type.STRING },
          analysis: { type: Type.STRING },
        },
        required: ["passed", "score", "verdict", "analysis"],
      },
    });

    if (!result) {
      throw new Error("No review yielded from AI checker.");
    }

    const data = JSON.parse(result);
    res.json(data);
  } catch (error: any) {
    console.error("Route /api/coach/challenge/evaluate Error:", error);
    res.status(500).json({ error: "Failed to evaluate response." });
  }
});

// 5. Setup Vite Middleware & SPA serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`English Communication Coach Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
