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

// --- CASINO SUPPORT AGENT SIMULATION API ---

// --- ACCURATE & FAST FAQ PRE-MATCHING ENGINE ---

const CASINO_STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being", "do", "does", "did", "doing", 
  "how", "what", "why", "where", "when", "who", "which", "i", "me", "my", "myself", "we", "our", "ours", 
  "us", "you", "your", "yours", "he", "she", "it", "they", "them", "to", "of", "for", "in", "on", "at", 
  "by", "with", "about", "can", "should", "would", "could", "will", "shall", "must", "please", "kindly"
]);

function cleanAndTokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, " ")
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 1 && !CASINO_STOP_WORDS.has(w));
}

function findHighlyAccurateMatch(userMessage: string, faqs: any[]) {
  if (!userMessage || !Array.isArray(faqs) || faqs.length === 0) return null;

  const userClean = (userMessage || "").trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
  const userTokens = cleanAndTokenize(userMessage);

  if (userTokens.length === 0) return null;

  let bestMatch = null;
  let highestScore = 0;
  let matchType: "exact" | "substring" | "fuzzy" = "fuzzy";

  for (const faq of faqs) {
    if (!faq.question || !faq.answer) continue;

    const qClean = (faq.question || "").trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    
    // 1. Exact or very close match check
    if (userClean === qClean) {
      return {
        faq,
        confidence: 100,
        matchType: "exact" as const
      };
    }

    // 2. Substring containment check
    if (userClean.length > 6 && qClean.length > 6) {
      if (userClean.includes(qClean) || qClean.includes(userClean)) {
        return {
          faq,
          confidence: 100,
          matchType: "substring" as const
        };
      }
    }

    // 3. Keyword / Token overlap calculation
    const qTokens = cleanAndTokenize(faq.question);
    if (qTokens.length === 0) continue;

    let intersectionCount = 0;
    for (const token of userTokens) {
      if (qTokens.includes(token)) {
        intersectionCount++;
      }
    }

    // Jaccard-like ratio specifically weighted for player query coverage
    const userCoverage = intersectionCount / userTokens.length;
    const questionCoverage = intersectionCount / qTokens.length;
    
    // Balanced harmonic mean score
    const harmonicScore = (userCoverage + questionCoverage) / 2;

    if (harmonicScore > highestScore) {
      highestScore = harmonicScore;
      bestMatch = faq;
    }
  }

  // High confidence threshold (at least 40% clean token alignment, with minimum 1 token matched)
  if (bestMatch && highestScore >= 0.38) {
    return {
      faq: bestMatch,
      confidence: Math.round(highestScore * 100),
      matchType: "fuzzy" as const
    };
  }

  return null;
}

function getCasinoFallback(userLatestMessage: string, faqs: any[], personality: string, casinoName: string) {
  const cleanInput = (userLatestMessage || "").trim().toLowerCase();
  let bestMatch = null;
  let highestScore = 0;

  // Keyword match custom FAQ list
  if (Array.isArray(faqs)) {
    for (const faq of faqs) {
      if (!faq.question || !faq.answer) continue;
      const qLower = faq.question.toLowerCase();
      let score = 0;
      const words = cleanInput.split(/\s+/);
      for (const word of words) {
        if (word.length > 3 && qLower.includes(word)) {
          score++;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = faq;
      }
    }
  }

  let reply = "";
  let csat = 85;
  let status = "Resolved";
  let tips = "Addressed query with general casino support rules.";

  if (bestMatch && highestScore > 0) {
    reply = `${bestMatch.answer}`;
    csat = 98;
    status = "Resolved";
    tips = `Direct hit! Answered the player's question using your custom-uploaded Casino Q&A: "${bestMatch.question}".`;
  } else {
    // Elegant scenario rules based on keywords
    if (cleanInput.includes("withdraw") || cleanInput.includes("cashout") || cleanInput.includes("payout") || cleanInput.includes("money") || cleanInput.includes("bank")) {
      reply = `Thank you for contacting ${casinoName} Player Help. All cashier withdrawals are processed in priority order: standard accounts complete in 24 hours, while our registered VIP and high-tier loyalty members receive instant fast-tracked cashouts! Please ensure your account documents are active under 'My Account > KYC Check'. How else can I assist with your transaction details?`;
      csat = 90;
      status = "Resolved";
      tips = "Guided the player on secure cashier withdrawal procedures and KYC status.";
    } else if (cleanInput.includes("bonus") || cleanInput.includes("promo") || cleanInput.includes("free spin") || cleanInput.includes("wager") || cleanInput.includes("rollover")) {
      reply = `We appreciate your interest in our standard gameplay incentives here at ${casinoName}! To ensure highly satisfying outcomes, please remember that our deposit match bonuses carry a standard 30x wagering qualification before funds transition to cash balance. You may view active progress bar tracker on your 'Bonus Desk' dashboard. Can I assist in checking an active promo code for you?`;
      csat = 92;
      status = "Resolved";
      tips = "Explained the wagering mechanics clearly to guarantee player satisfaction with active promotion rules.";
    } else if (cleanInput.includes("hello") || cleanInput.includes("hi") || cleanInput.includes("hey") || cleanInput.includes("support")) {
      reply = `Hello and welcome to ${casinoName} Player Concierge support! My name is Alex, your dedicated virtual support agent for today. I am here to make sure you have an exceptionally pleasant and smooth gaming experience. What can I help you check or unlock right now?`;
      csat = 95;
      status = "Resolved";
      tips = "Greeted player cordially, established helpful support presence.";
    } else if (cleanInput.includes("game") || cleanInput.includes("crash") || cleanInput.includes("lag") || cleanInput.includes("slot") || cleanInput.includes("disconnected")) {
      reply = `I am very sorry to hear of any technical interruption during your slot spin or table play! Rest assured that our secure gaming core features 'Disconnected Game Recovery' — if a round is interrupted, your potential payout is safely collected, and the session status is recorded on our backend. Could you please provide the approximate round ID or timestamp so I can double-check the server logs for your peace of mind?`;
      csat = 88;
      status = "Pending";
      tips = "Technical slot/game discrepancy query. Handled with built-in Disconnect protection reassurance and requested details.";
    } else if (cleanInput.includes("limit") || cleanInput.includes("self") || cleanInput.includes("exclude") || cleanInput.includes("responsible")) {
      reply = `At ${casinoName}, we take Responsible Gaming with absolute priority and focus. We are committed to making sure your experience is safe and satisfying. You have the immediate ability to configure daily deposit limits, cool-off time-outs, or formal self-exclusion under 'Responsible Play Settings' within your dashboard. We're here to help if you would like me to set a cooldown immediately.`;
      csat = 96;
      status = "Resolved";
      tips = "Responsible Gaming guidelines served immediately in strict conformance with player safety standards.";
    } else {
      reply = `Thank you for reaching out to us here at ${casinoName}! I want to guarantee you receive the most helpful and accurate answer for your query. Could you please provide your standard player username or account email along with minor details? I will search our player support desk right away so we can resolve this to your complete satisfaction.`;
      csat = 80;
      status = "Pending";
      tips = "General player inquiry un-mapped. Prompted for user ID and custom issue details.";
    }
  }

  return {
    reply,
    isFallback: true,
    evaluation: {
      csat,
      status,
      confidence: 90,
      escalationRequired: status === "Pending",
      operatorActionTips: tips,
      suggestedFollowUp: [
        "Would you like me to prompt our Live VIP cashier manager?",
        "Can I help look up your active transaction statuses?",
        "Let me know if there's any game explanation you need!"
      ]
    }
  };
}

// Helper to detect message topic fingerprint / signature for consecutive queries
function getMessageTopicSignature(text: string, activeFaqs: any[]): string {
  if (!text) return "topic-general";
  const localMatch = findHighlyAccurateMatch(text, activeFaqs);
  if (localMatch) {
    return `faq-${localMatch.faq.id}`;
  }
  
  const lower = text.toLowerCase();
  if (lower.includes("login") || lower.includes("sign up") || lower.includes("register") || lower.includes("account") || lower.includes("suspended") || lower.includes("blocked")) {
    return "topic-account";
  }
  if (lower.includes("password") || lower.includes("reset") || lower.includes("forgot")) {
    return "topic-password";
  }
  if (lower.includes("kyc") || lower.includes("verify") || lower.includes("documents") || lower.includes("id card") || lower.includes("rejection")) {
    return "topic-kyc";
  }
  if (lower.includes("token") || lower.includes("coin") || lower.includes("balance") || lower.includes("sweep") || lower.includes("game")) {
    return "topic-balance";
  }
  if (lower.includes("crash") || lower.includes("loading") || lower.includes("frozen") || lower.includes("slots") || lower.includes("spin")) {
    return "topic-game-crash";
  }
  if (lower.includes("bonus") || lower.includes("promotion") || lower.includes("coupon") || lower.includes("free spin") || lower.includes("referral")) {
    return "topic-bonus";
  }
  if (lower.includes("maintenance") || lower.includes("maintain") || lower.includes("server down")) {
    return "topic-maintenance";
  }
  
  return "topic-general";
}

app.post("/api/casino/chat", async (req, res) => {
  try {
    const { messages, userLatestMessage, faqs, personality, casinoName } = req.body;
    
    const activeCasino = casinoName || "Galaxy Roll Casino";
    const activePersonality = personality || "Friendly Customer Advocate";
    const activeFaqs = faqs || [];

    if (!userLatestMessage) {
      return res.status(400).json({ error: "userLatestMessage is a required field." });
    }

    // Determine consecutive topic occurrence count in messages history
    const userMsgs = Array.isArray(messages) ? messages.filter((m: any) => m.role === "user") : [];
    let occurrenceCount = 1;

    if (userMsgs.length > 1) {
      const currentSignature = getMessageTopicSignature(userLatestMessage, activeFaqs);
      if (currentSignature !== "topic-general") {
        for (let i = userMsgs.length - 2; i >= 0; i--) {
          const prevSig = getMessageTopicSignature(userMsgs[i].content, activeFaqs);
          if (prevSig === currentSignature) {
            occurrenceCount++;
          } else {
            break;
          }
        }
      } else {
        const userClean = userLatestMessage.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
        for (let i = userMsgs.length - 2; i >= 0; i--) {
          const prevClean = (userMsgs[i].content || "").trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
          const wordsCurrent = userClean.split(/\s+/);
          const wordsPrev = prevClean.split(/\s+/);
          let matchCount = 0;
          for (const w of wordsCurrent) {
            if (w.length > 3 && wordsPrev.includes(w)) {
              matchCount++;
            }
          }
          if (matchCount >= 2 || userClean.includes(prevClean) || prevClean.includes(userClean)) {
            occurrenceCount++;
          } else {
            break;
          }
        }
      }
    }

    console.log(`[Support Chat Engine] User requested topic signature "${getMessageTopicSignature(userLatestMessage, activeFaqs)}" for the ${occurrenceCount} time consecutively.`);

    // RULE 3: 3rd consecutive query on the same issue gets escalated to a Support Ticket
    if (occurrenceCount >= 3) {
      const ticketId = `TK-${Math.floor(100000 + Math.random() * 900000)}`;
      return res.json({
        reply: `I apologize for the continued inconvenience. Recognizing that this issue remains unresolved for you, we have raised an official support ticket (Ticket ID: ${ticketId}) in our player care console. I have flagged this as highly urgent, and our senior desk managers will get back to you directly at your registered email address very shortly to solve this completely!`,
        evaluation: {
          csat: 100,
          status: "Ticket Raised",
          confidence: 100,
          escalationRequired: true,
          operatorActionTips: `Ticket ${ticketId} created automatically. Player has queried this topic 3 or more consecutive times without resolution.`,
          suggestedFollowUp: [
            "What is the status of my ticket?",
            "Can I add another issue to my ticket?",
            "Return to main menu"
          ]
        }
      });
    }

    // --- ACCURACY AND SPEED BOOST: FAST PATH LOCAL MATCH CHECK ---
    const localMatch = findHighlyAccurateMatch(userLatestMessage, activeFaqs);
    if (localMatch) {
      const { faq, confidence, matchType } = localMatch;
      
      // Determine response based on whether it is the 1st or 2nd time
      let replyMessage = faq.answer;
      let extraTips = `Blazing-fast precision match! Bypassed API latency and instantly satisfied user intent via local rule matching (${matchType} match).`;
      
      // RULE 2: If occurrenceCount === 2, provide the second, alternative answer
      if (occurrenceCount === 2) {
        replyMessage = `I understand that the initial steps did not fully resolve this for you yet, and we want to ensure you are 100% satisfied. Let's try secondary troubleshooting: please clear your browser cookies/cache, make sure no active VPN or proxy is enabled on your device, and try opening a private incognito session. (As a reminder: ${faq.answer}). If you are still facing any trouble, simply chat back one more time and we'll instantly open a priority support ticket for you!`;
        extraTips = `2nd consecutive attempt matched! Served more detailed, empathetic secondary steps and prepared ticket escalation options.`;
      }

      // Compute intelligent context-sensitive suggestions based on query category
      const qText = (faq.question || "").toLowerCase();
      let suggestedFollowUp = [
        "How do I withdraw my winnings?",
        "Why is my Total Balance different?",
        "Where can I see my transaction history?"
      ];

      if (qText.includes("withdraw") || qText.includes("payout") || qText.includes("reject") || qText.includes("kyc") || qText.includes("pending")) {
        suggestedFollowUp = [
          "Can I withdraw without completing KYC?",
          "What is the minimum withdrawal amount?",
          "How do I purchase a package / recharge my account?"
        ];
      } else if (qText.includes("purchase") || qText.includes("recharge") || qText.includes("failed") || qText.includes("charged") || qText.includes("payment")) {
        suggestedFollowUp = [
          "Which payment methods are accepted?",
          "Can I get a refund on my purchase?",
          "My wallet balance is not updating after a purchase."
        ];
      } else if (qText.includes("refer") || qText.includes("bonus") || qText.includes("friend")) {
        suggestedFollowUp = [
          "I referred a friend but didn't get my referral bonus.",
          "How does the referral program work?",
          "Why is my Total Balance different from my Sweep Token balance?"
        ];
      }

      return res.json({
        reply: replyMessage,
        evaluation: {
          csat: occurrenceCount === 2 ? 92 : 100,
          status: occurrenceCount === 2 ? "Pending" : "Resolved",
          confidence: confidence,
          escalationRequired: occurrenceCount === 2,
          operatorActionTips: extraTips,
          suggestedFollowUp
        }
      });
    }

    // Convert past chat messages for history
    let historyText = "";
    if (Array.isArray(messages)) {
      historyText = messages
        .slice(-6)
        .map((m: any) => `${m.role === "user" ? "Player" : "Support Agent"}: ${m.content}`)
        .join("\n");
    }

    // Format FAQ knowledge base
    let faqText = "";
    if (activeFaqs.length > 0) {
      faqText = activeFaqs.map((f: any, i: number) => `FAQ #${i+1}\nQ: ${f.question}\nA: ${f.answer}`).join("\n\n");
    } else {
      faqText = "No custom FAQs uploaded yet. Answer based on general, high-quality, friendly casino guidelines (deposits, payouts, verification).";
    }

    const rule2Instruction = occurrenceCount === 2 
      ? `\n\n--- CRITICAL SUPPORT LEVEL 2 TRIGGER ---\nThe player is asking about this same topic/issue for the SECOND (2nd) consecutive time, which means they are NOT satisfied with our previous explanation. You MUST start with a polite, empathetic apology for the ongoing issue. Then, you MUST provide an alternative, more comprehensive, or deeper explanation (your SECOND/ALTERNATIVE answer) with additional suggestions, to guarantee their absolute satisfaction. Do NOT repeat the previous answer verbatim; suggest checking technical settings, caches, different browsers, or region restrictions. Keep it to 1 to 3 compact, natural sentences.`
      : "";

    const systemPrompt = `You are an expert, highly professional, polite casino customer support chatbot.
Casino Brand: ${activeCasino}
Your Customer Agent Persona: ${activePersonality} (Tailor your tone, warmth, and phrasing to this persona).

--- CASINO FAQS / UPLOADED KNOWLEDGE BASE ---
Use the following custom rules and sample Q&As to precisely answer the player. If they ask about something defined here, output the answer exactly as specified to satisfy them:
${faqText}
${rule2Instruction}

--- SUPPORT PROTOCOLS ---
1. Provide highly satisfying, clear, resolved answers.
2. If the user asks a question not explicitly answered in the FAQs, use your excellent training to formulate a reassuring, helpful answer. Remain positive, do not make promises you cannot fulfill (e.g., do not randomly credit money), but outline secure, safe steps the visitor can take.
3. Be professional. Never break character.

Produce a strict, parseable JSON response containing:
{
  "reply": "Your friendly, personalized casino support agent message to the user.",
  "evaluation": {
    "csat": 95, // Predicted Customer Satisfaction score (0 to 100) based on how well this message resolves the issue
    "status": "Resolved", // String: "Resolved" if answered fully, or "Pending" if player details/screenshots are needed, or "Escalated"
    "confidence": 98, // Percent confidence in matching FAQs or casino guidelines (0 to 100)
    "escalationRequired": false, // True if a human operator/VIP Host must join immediately to resolve
    "operatorActionTips": "A helper tooltip describing why this answer was formulated, specifically highlighting if customized FAQs were matched.",
    "suggestedFollowUp": [
      "2-3 short, context-appropriate buttons or questions the player might ask next"
    ]
  }
}

Do not include markdown or backticks like \`\`\`json. Return only the raw JSON.`;

    let data;
    try {
      const result = await generateAiContent(
        `Conversation History So Far:\n${historyText}\n\nLatest Player Message: "${userLatestMessage}"`,
        {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              evaluation: {
                type: Type.OBJECT,
                properties: {
                  csat: { type: Type.INTEGER },
                  status: { type: Type.STRING },
                  confidence: { type: Type.INTEGER },
                  escalationRequired: { type: Type.BOOLEAN },
                  operatorActionTips: { type: Type.STRING },
                  suggestedFollowUp: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["csat", "status", "confidence", "escalationRequired", "operatorActionTips", "suggestedFollowUp"]
              }
            },
            required: ["reply", "evaluation"]
          }
        }
      );

      if (!result) {
        throw new Error("Returned empty response from support brain.");
      }

      data = JSON.parse(result);
    } catch (apiError: any) {
      console.warn("⚠️ [RECOVERY fallback triggered] Route /api/casino/chat serving recovery simulation response:", apiError.message);
      data = getCasinoFallback(userLatestMessage, activeFaqs, activePersonality, activeCasino);
    }

    res.json(data);
  } catch (err: any) {
    console.error("Route /api/casino/chat General Error:", err);
    res.status(500).json({ error: err.message || "Player support engine experienced an error." });
  }
});

app.post("/api/casino/roleplay-player", async (req, res) => {
  try {
    const { messages, playerPersona, casinoName } = req.body;
    
    const activePersona = playerPersona || "Liam (Impavid High-Roller awaiting a pending withdrawal)";
    const activeCasino = casinoName || "Grand Roll Casino";

    let historyText = "Conversation Log:\n";
    if (Array.isArray(messages)) {
      historyText += messages
        .slice(-8)
        .map((m: any) => `${m.role === "user" ? "Player" : "Support Agent"}: ${m.content}`)
        .join("\n");
    }

    const systemPrompt = `You are a realistic, in-character human customer/player playing at a Social Sweeps/Casino platform named "${activeCasino}".
You are currently chatting in real-time in a live help desk chat bubble with their Customer Support Agent.
Your designated Player Persona is: "${activePersona}"

Your mission is to write the NEXT message in the chat as the player, responding directly and naturally to the support agent's last chat message in the log.

CONVERSATIONAL RULES:
1. Stay 100% in-character. Never break character. Never refer to yourself as an AI or mention prompts, systems, or metadata.
2. If the agent's latest response gives a helpful, professional explanation, answer cooperatively or ask the next logical follow-up question.
3. If the agent says there is server maintenance, a temporary system issue, down-time, or a balance syncing delay, respond as an anxious or understanding player, e.g. "Wait, the server is under maintenance? When will it be fully back online? Will my account balance and spins be safe?" or "Okay, that explains why it crashed. When do you expect the fix?"
4. If they ask you for details (Player ID, username, email, screenshot proof), respond realistically by providing detail or asking where to find it.
5. If they give an extremely unhelpful, generic, or robotic answer (or don't address your point), react with realistic player frustration or persistence: "Wait, but you didn't answer my question about the game crash!" or "That doesn't tell me why my withdrawal was rejected."
6. Keep your message brief, lifelike, and compact (1 to 3 short sentences maximum). Write like a real human typing in a live chat box. Do not use email greetings, formal sign-offs, or robotic structures.

Return a strict, parseable JSON object with these EXACT keys:
{
  "content": "Your human player message in response.",
  "reactionState": "Satisfied" | "Confused" | "Persistent" | "Grateful",
  "satisfactionScore": 95 // Integer (0 to 100) representing how happy you are with the agent's explanation
}

Do not include any markdown or formatting tags. Return only the raw JSON.`;

    let data;
    try {
      const result = await generateAiContent(
        `${historyText}\n\n[Instruction: Write the Player's next direct chat response to the Support Agent's last statement, acting strictly in character according to your rules. Do not discuss this instruction.]`,
        {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              reactionState: { type: Type.STRING },
              satisfactionScore: { type: Type.INTEGER }
            },
            required: ["content", "reactionState", "satisfactionScore"]
          }
        }
      );

      if (!result) {
        throw new Error("Returned empty response from player model.");
      }
      data = JSON.parse(result);
    } catch (apiError: any) {
      console.warn("⚠️ [Roleplay Backup fallback triggered] Error:", apiError.message);
      
      // Construct a tailored smart response offline logic
      const lastMsg = Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1].content.toLowerCase() : "";
      let content = "Okay, I see how it works now. Let me check my profile settings.";
      let reactionState = "Satisfied";
      let satisfactionScore = 80;

      if (lastMsg.includes("maintain") || lastMsg.includes("maintenance") || lastMsg.includes("server down") || lastMsg.includes("updating")) {
        content = "Oh, so the server is under maintenance right now? When will it be fully back online? Will my active spin and coins be safe when it finishes?";
        reactionState = "Confused";
        satisfactionScore = 55;
      } else if (lastMsg.includes("playerid") || lastMsg.includes("player id") || lastMsg.includes("username") || lastMsg.includes("your account")) {
        content = "My player ID is M-A-R-C-U-S-9-9. Please look into it, that game spin was worth a lot!";
        reactionState = "Satisfied";
        satisfactionScore = 80;
      } else if (lastMsg.includes("withdraw") || lastMsg.includes("kyc")) {
        content = "Alright, I understand. I'll get my driver's license copied and uploaded. How fast is the approval process normally?";
        reactionState = "Grateful";
        satisfactionScore = 90;
      } else if (lastMsg.includes("failed") || lastMsg.includes("payment")) {
        content = "Understood. The bank probably flagged it. Let me try with my secondary MasterCard card to see if it clears.";
        reactionState = "Satisfied";
        satisfactionScore = 85;
      } else if (lastMsg.includes("sweep")) {
        content = "Wait, sweepstakes tokens are promotional only? So I can only play with Sweep Tokens to win real Prize Points?";
        reactionState = "Confused";
        satisfactionScore = 70;
      } else if (lastMsg.includes("refer")) {
        content = "Okay, let me send the link to my coworker. Hopefully, their purchase registers on my system balance.";
        reactionState = "Satisfied";
        satisfactionScore = 95;
      }

      data = { content, reactionState, satisfactionScore };
    }

    res.json(data);
  } catch (err: any) {
    console.error("Route /api/casino/roleplay-player Error:", err);
    res.status(500).json({ error: "The Roleplay engine encountered a server error." });
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
