import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable JSON parser with larger limits for audio files or large text inputs
app.use(express.json({ limit: "10mb" }));

// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️ Warning: GEMINI_API_KEY environment variable is not set on the server.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "DUMMY_KEY_UNCONFIGURED",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper for AI responses
async function generateAiContent(prompt: string, config: any) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set on the server's environment variables. Please configure GEMINI_API_KEY in Render's Environment Variables settings.");
    }
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: config,
    });
    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error caught inside helper:", error);
    throw new Error(error.message || "Failed to generate AI response");
  }
}

// --- INTELLIGENT COMPREHENSIVE RECOVERY FALLBACK GENERATORS (QUOTA & API KEY FAILURE SAFEGUARDS) ---

function getChatFallback(userLatestMessage: string, character: any, level: string, focus: string) {
  const cleanInput = (userLatestMessage || "").trim().toLowerCase();
  const contextName = character?.context || "coffee shop";
  
  let reply = "That is so fascinating! I really appreciate you sharing that with me. What do you think is the most interesting part of that experience?";
  
  if (cleanInput.includes("hello") || cleanInput.includes("hey") || cleanInput.includes("hi")) {
    reply = `Hello there! It's absolutely wonderful to connect with you here in our ${contextName}. How are you doing today?`;
  } else if (cleanInput.includes("how are you")) {
    reply = "I am doing excellently, thank you for asking! I'm really enjoying this moment and looking forward to our practice session. How is your day going?";
  } else if (cleanInput.includes("thank")) {
    reply = "Oh, you are very welcome! It is a true pleasure practicing English with you. Feel free to bring up any topic you'd like.";
  } else if (cleanInput.includes("weather") || cleanInput.includes("rain") || cleanInput.includes("sun")) {
    reply = "The weather has a strange way of affecting our plans and mood, doesn't it? How is the weather over on your side right now?";
  } else if (cleanInput.length < 10) {
    reply = "Ah, I see! Could you elaborate on that a tiny bit more? I would love to hear more of your thoughts.";
  }

  const originalText = userLatestMessage || "";
  let grammarScore = 95;
  const corrections: any[] = [];
  const vocabularyBoosters: any[] = [];
  const pronunciationTips: any[] = [];
  const communicationTips = "Your tone is warm, polite, and perfectly suitable for this conversational roleplay. Keep it up!";

  // Capitalization of "I"
  if (/\bi\b/.test(originalText)) {
    corrections.push({
      error: "'i' in lowercase form",
      correction: "'I' (always capitalized)",
      explanation: "In standard English writing, the first-person singular pronoun 'I' must always be capitalized."
    });
    grammarScore -= 10;
  }
  
  // Basic verb agreements
  if (cleanInput.includes("how is you") || cleanInput.includes("you is")) {
    corrections.push({
      error: "Incorrect pronoun-verb agreement with 'you'",
      correction: "'how are you' / 'you are'",
      explanation: "The pronoun 'you' requires the plural form of the present tense verb 'are'."
    });
    grammarScore -= 15;
  }

  if (cleanInput.includes("i am agree") || cleanInput.includes("i'm agree")) {
    corrections.push({
      error: "'I am agree'",
      correction: "'I agree'",
      explanation: "In English, 'agree' is a primary action verb. We express agreement directly as 'I agree' rather than 'I am agree'."
    });
    grammarScore -= 15;
  }

  if (cleanInput.includes("dont ") || cleanInput.includes("cant ") || cleanInput.includes("im ")) {
    const term = cleanInput.includes("dont ") ? "don't" : cleanInput.includes("cant ") ? "can't" : "I'm";
    corrections.push({
      error: "Missing contraction punctuation",
      correction: term,
      explanation: "A contraction like don't or can't requires an apostrophe to construct standard written English."
    });
    grammarScore -= 5;
  }

  // Smart vocabulary recommendations
  if (cleanInput.includes("good")) {
    vocabularyBoosters.push({
      originalWord: "good",
      betterWord: "exquisite / superb",
      meaning: "Extremely pleasing, beautiful, or of elevated quality.",
      example: "Our conversational practice is a superb opportunity to enhance your comfort with English."
    });
  } else if (cleanInput.includes("happy")) {
    vocabularyBoosters.push({
      originalWord: "happy",
      betterWord: "delighted / thrilled",
      meaning: "Extremely pleased, full of joyful excitement.",
      example: "I am absolutely thrilled to accompany you on your learning journey."
    });
  } else {
    vocabularyBoosters.push({
      originalWord: "important",
      betterWord: "paramount / indispensable",
      meaning: "Of supreme significance; absolutely necessary and irreplaceable.",
      example: "Consistent, daily speech practice is paramount to attaining long-term English fluency."
    });
  }

  // Phonetic/pronunciation tricky letters
  const words = originalText.split(/\s+/);
  const pronDict = [
    { word: "comfortable", phonetic: "kum-f-tuh-buhl", tip: "The letter 'o' in the second syllable is completely silent. Skip saying com-for-ta-ble." },
    { word: "schedule", phonetic: "skej-ool", tip: "In North American English, pronounce the starting 'sch' as a hard 'sk' sound." },
    { word: "accent", phonetic: "ak-sent", tip: "Emphasize and place the focal stress heavily on the first 'ak' syllable." },
    { word: "pronunciation", phonetic: "pro-nun-see-ay-shun", tip: "Watch the middle syllable sound: it is 'nun' rather than 'noun'." },
    { word: "the", phonetic: "thuh", tip: "Gently position your tongue between your lower and upper teeth for a clean voiced 'th' airflow." }
  ];

  let addedTip = false;
  for (const w of words) {
    const cleanWordStr = w.toLowerCase().replace(/[^a-z]/g, "");
    const matchingTip = pronDict.find(t => t.word === cleanWordStr);
    if (matchingTip) {
      pronunciationTips.push(matchingTip);
      addedTip = true;
      break;
    }
  }

  if (!addedTip) {
    pronunciationTips.push({
      word: words[0] || "fluency",
      phonetic: "floo-uhn-see",
      tip: "Ensure the initial 'floo' vowel glide is sustained and relaxed, transitioning cleanly into 'see'."
    });
  }

  return {
    reply,
    isFallback: true,
    feedback: {
      originalText,
      correctedText: corrections.length > 0 ? null : originalText,
      grammarScore: Math.max(50, grammarScore),
      corrections,
      vocabularyBoosters,
      pronunciationTips,
      communicationTips
    }
  };
}

function getAnalyzeFallback(text: string, focus: string) {
  const sentenceCount = text.split(/[.!?]+/).filter(Boolean).length || 1;
  const wordCount = text.split(/\s+/).filter(Boolean).length || 1;
  const readabilityScore = Math.min(100, Math.max(30, 100 - (wordCount / sentenceCount) * 1.5 - (text.length > 200 ? 10 : 0)));
  
  const originalSentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const breakdown = originalSentences.map((sent) => {
    const sentLower = sent.toLowerCase();
    let status = "correct";
    let suggestion = sent;
    let details = "This sentence is grammatically sound, complete, and highly natural.";

    if (sentLower.includes(" i ")) {
      status = "needs_improvement";
      suggestion = sent.replace(/\bi\b/g, "I");
      details = "Capitalize the first-person singular pronoun 'I' to align with formal writing standards.";
    } else if (sentLower.includes("dont") || sentLower.includes("cant") || sentLower.includes("im")) {
      status = "needs_improvement";
      suggestion = sent.replace(/\bdont\b/g, "don't").replace(/\bcant\b/g, "can't").replace(/\bim\b/g, "I'm");
      details = "Insert appropriate apostrophes in contractions (don't, can't, I'm) to satisfy default orthographic rules.";
    }

    return {
      originalSentence: sent,
      status,
      suggestion,
      details
    };
  });

  const issueCount = breakdown.filter(b => b.status !== "correct").length;

  return {
    isFallback: true,
    readabilityScore: Math.round(readabilityScore),
    sentenceCount,
    issueCount,
    restructuredText: breakdown.map(b => b.suggestion).join(" "),
    breakdown,
    structuralHighlights: [
      {
        topic: "Sentence Flow and Connection",
        feedback: "Your sentences offer a straightforward expression of core thoughts. Connecting consecutive statements using words like 'accordingly', 'consequently', or 'furthermore' can elevate structural cohesion."
      },
      {
        topic: "Punctuation Standards",
        feedback: "Excellent practice wrapping declarative details with standard full-stops. This maintains clean logical boundaries for readability."
      }
    ]
  };
}

function getChallengesFallback() {
  return {
    isFallback: true,
    challenges: [
      {
        id: "idiom_of_day",
        category: "Idiom of the Day",
        title: "Hit the nail on the head",
        meaning: "To describe exactly what is causing a situation or problem; to be precisely correct in diagnosis.",
        dialogExample: "'You hit the nail on the head when you realized that reading practice is central to speech skills.'",
        instruction: "Write a short sentence using the idiom 'hit the nail on the head' to praise an accurate statement.",
        phonetic: "hit thuh nayl on thuh hed"
      },
      {
        id: "phonetic_twister",
        category: "Phonetic Pronunciation Twister",
        title: "She sells seashells by the seashore",
        meaning: "A timeless, challenging tongue twister designed to train rapid alternating sibilant 'S' and sibilant-sh 'SH' positions.",
        dialogExample: "Try repeating it three times fast to refine speech coordination and clear pronunciation.",
        instruction: "Recite the phrase aloud, making a conscious effort to move tongue positions cleanly between 'S' and 'SH'.",
        phonetic: "shee selz see-shelz by thuh see-shor"
      },
      {
        id: "phrasal_verb",
        category: "Phrasal Verb Challenge",
        title: "Look forward to",
        meaning: "To feel happy, positive, or eager expectancy towards an upcoming event or action.",
        dialogExample: "'I really look forward to sharing our test results!'",
        instruction: "Describe one hobby or activity you are looking forward to this weekend using this phrasal verb.",
        phonetic: "luk for-werd too"
      },
      {
        id: "workplace_accent",
        category: "Modern Workplace Accent",
        title: "Touch base",
        meaning: "To briefly establish contact or meet to update one another on milestones and goals.",
        dialogExample: "'Let's touch base on Monday morning to confirm our deployment milestones.'",
        instruction: "Construct a polite message to coordinate a quick status update with a colleague using the expression 'touch base'.",
        phonetic: "tuch bays"
      }
    ]
  };
}

function getEvaluateChallengeFallback(challenge: any, userResponse: string) {
  const score = Math.max(75, Math.min(100, 75 + Math.round((userResponse || "").length * 0.5)));
  const keywords = (challenge?.title || "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  let passed = true;
  let verdict = "Splendid Job!";
  let analysis = "A fabulous, highly readable try! Your formulation shows full comprehensibility, and your sentence structures feel very natural inside daily English interactions.";

  let matchedKeyword = false;
  for (const kw of keywords) {
    const cleanKw = kw.replace(/[^a-z]/g, "");
    if ((userResponse || "").toLowerCase().includes(cleanKw)) {
      matchedKeyword = true;
    }
  }

  if (keywords.length > 0 && !matchedKeyword) {
    verdict = "Intermediary Attempt!";
    analysis = `You wrote a very fine sentence! To fully secure maximum practice, try to explicitly include the targeted block "${challenge?.title || "prompt"}" directly in your text so that you can verify comfortable tenses usage.`;
  }

  return {
    isFallback: true,
    passed,
    score,
    verdict,
    analysis
  };
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

    let data;
    try {
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

      data = JSON.parse(result);
    } catch (apiError: any) {
      console.warn("⚠️ [RECOVERY fallback triggered] Route /api/coach/chat serving simulated response:", apiError.message);
      data = getChatFallback(userLatestMessage, currentCharacter, currentLevel, currentFocus);
    }

    res.json(data);
  } catch (error: any) {
    console.error("Route /api/coach/chat General Error:", error);
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

    let data;
    try {
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

      data = JSON.parse(result);
    } catch (apiError: any) {
      console.warn("⚠️ [RECOVERY fallback triggered] Route /api/coach/analyze serving simulated response:", apiError.message);
      data = getAnalyzeFallback(text, currentFocus);
    }

    res.json(data);
  } catch (error: any) {
    console.error("Route /api/coach/analyze General Error:", error);
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

    let data;
    try {
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

      data = JSON.parse(result);
    } catch (apiError: any) {
      console.warn("⚠️ [RECOVERY fallback triggered] Route /api/coach/challenges serving simulated response:", apiError.message);
      data = getChallengesFallback();
    }

    res.json(data);
  } catch (error: any) {
    console.error("Route /api/coach/challenges General Error:", error);
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

    let data;
    try {
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

      data = JSON.parse(result);
    } catch (apiError: any) {
      console.warn("⚠️ [RECOVERY fallback triggered] Route /api/coach/challenge/evaluate serving simulated response:", apiError.message);
      data = getEvaluateChallengeFallback(challenge, userResponse);
    }

    res.json(data);
  } catch (error: any) {
    console.error("Route /api/coach/challenge/evaluate General Error:", error);
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
