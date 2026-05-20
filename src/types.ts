export interface Character {
  id: string;
  name: string;
  role: string;
  personality: string;
  context: string;
  exampleDialog: string;
  avatar: string; // Emoji or visual icon representation
  accent: string; // Accent tag for SpeechSynthesis (e.g., 'en-US', 'en-GB')
}

export interface Correction {
  error: string;
  correction: string;
  explanation: string;
}

export interface VocabularyBooster {
  originalWord: string;
  betterWord: string;
  meaning: string;
  example: string;
}

export interface PronunciationTip {
  word: string;
  phonetic: string;
  tip: string;
}

export interface LinguisticFeedback {
  originalText: string;
  correctedText: string | null;
  grammarScore: number;
  corrections: Correction[];
  vocabularyBoosters: VocabularyBooster[];
  pronunciationTips: PronunciationTip[];
  communicationTips: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  feedback?: LinguisticFeedback;
}

export interface DailyChallenge {
  id: string;
  category: string;
  title: string;
  meaning: string;
  dialogExample: string;
  instruction: string;
  phonetic: string;
  userCompleted?: boolean;
  score?: number;
  aiReview?: string;
}

export interface LabSentenceBreakdown {
  originalSentence: string;
  status: "correct" | "needs_improvement" | "incorrect";
  suggestion: string;
  details: string;
}

export interface LabStructuralHighlight {
  topic: string;
  feedback: string;
}

export interface LabAnalysisResult {
  readabilityScore: number;
  sentenceCount: number;
  issueCount: number;
  restructuredText: string;
  breakdown: LabSentenceBreakdown[];
  structuralHighlights: LabStructuralHighlight[];
}

export interface ScoreHistoryItem {
  id: string;
  timestamp: string;
  source: "chat" | "lab" | "challenge";
  score: number;
  label: string;
  feedbackSnippet: string;
}

