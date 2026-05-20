import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  HelpCircle, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  RotateCcw, 
  MessageSquare, 
  ChevronRight,
  User,
  Crown,
  BookOpen
} from "lucide-react";
import { Character, ChatMessage, LinguisticFeedback } from "../types";
import { CHARACTERS } from "../data/characters";

// Web Speech APIs
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface ChatLoungeProps {
  onScoreEarned?: (score: { source: "chat" | "lab" | "challenge"; score: number; label: string; feedbackSnippet: string }) => void;
}

export default function ChatLounge({ onScoreEarned }: ChatLoungeProps) {
  const [selectedChar, setSelectedChar] = useState<Character>(CHARACTERS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoverSpeech, setIsLoverSpeech] = useState(true); // Autoplay voice state
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<LinguisticFeedback | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [selectedFocus, setSelectedFocus] = useState<"grammar" | "vocabulary" | "pronunciation" | "comprehensive">("comprehensive");
  const [recognition, setRecognition] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setInputValue((prev) => (prev ? prev + " " + resultText : resultText));
      };

      rec.onerror = (err: any) => {
        console.error("Speech recognition error", err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  // Set up welcome message whenever character changes
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: selectedChar.exampleDialog,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
    ]);
    setActiveFeedback(null);
  }, [selectedChar]);

  // Handle auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Speak AI text using Speech Synthesis with the character's accent code
  const speak = (text: string) => {
    if (!window.speechSynthesis || !isLoverSpeech) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose voice based on character accent
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.startsWith(selectedChar.accent)) || voices.find((v) => v.lang.startsWith("en"));
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = selectedDifficulty === "beginner" ? 0.8 : selectedDifficulty === "intermediate" ? 0.95 : 1.1;
    window.speechSynthesis.speak(utterance);
  };

  // Toggle voice synthesizer manually
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Toggle Microphone recognition
  const toggleListening = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome/Edge or type manually.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      stopSpeaking();
      recognition.start();
    }
  };

  // Send content to Express server proxy for Gemini evaluation and response
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue("");
    stopSpeaking();

    const userMessage: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          character: selectedChar,
          level: selectedDifficulty,
          focus: selectedFocus
        }),
      });

      if (!response.ok) {
        throw new Error("Tutor had an issue processing thoughts. Please try again.");
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: "ai-" + Date.now(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        feedback: data.feedback // Attach English correction feedback details directly
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Auto-set the active feedback panel to let the user review instantly
      if (data.feedback) {
        setActiveFeedback(data.feedback);
        if (onScoreEarned) {
          onScoreEarned({
            source: "chat",
            score: data.feedback.grammarScore,
            label: `Conversation Partner: ${selectedChar.name}`,
            feedbackSnippet: data.feedback.correctedText 
              ? `Suggestion: "${data.feedback.correctedText.substring(0, 60)}..."`
              : "Constructed flawless, highly natural phrasing."
          });
        }
      }

      // Speak back the response
      if (isLoverSpeech) {
        speak(data.reply);
      }

    } catch (err: any) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: "err-" + Date.now(),
        role: "assistant",
        content: "Oops! I encountered an error. Please double-check your connection or configuration. Details: " + err.message,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: selectedChar.exampleDialog,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
    ]);
    setActiveFeedback(null);
    stopSpeaking();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT PANEL: Character & Settings Selector */}
      <div className="lg:col-span-4 space-y-4">
        <h3 className="text-lg font-display font-medium text-slate-900 flex items-center gap-2">
          <span>Choose Your Tutor Role</span>
          <span className="text-xs font-mono px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">Live Practice</span>
        </h3>
        
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
          {CHARACTERS.map((char) => (
            <button
              key={char.id}
              onClick={() => setSelectedChar(char)}
              className={`w-full text-left p-3.5 rounded-xl transition-all flex items-start gap-3.5 border ${
                selectedChar.id === char.id 
                  ? "border-indigo-600 bg-indigo-50/50 shadow-sm" 
                  : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="text-2xl p-2 bg-white rounded-lg border border-slate-100 shadow-xs flex-shrink-0">
                {char.avatar}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-sans font-medium text-slate-800 text-sm leading-tight">{char.name}</h4>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {char.accent.split("-")[1] || "INT"}
                  </span>
                </div>
                <p className="text-xs text-indigo-600 font-medium mt-0.5">{char.role}</p>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-snug">{char.personality}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Dynamic Speech Tuning Constraints */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-4">
          <h4 className="font-sans font-medium text-slate-800 text-sm border-b border-slate-100 pb-2">Session Tuning</h4>
          
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1.5 flex justify-between">
                <span>English Level</span>
                <span className="text-indigo-600 capitalize font-medium">{selectedDifficulty}</span>
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                {(["beginner", "intermediate", "advanced"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedDifficulty(level)}
                    className={`text-xs text-center py-1.5 rounded-md font-medium transition ${
                      selectedDifficulty === level 
                        ? "bg-white text-slate-900 shadow-xs" 
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {level === "beginner" ? "A2-B1" : level === "intermediate" ? "B2" : "C1-C2"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1.5 flex justify-between">
                <span>Feedback Focal Area</span>
                <span className="text-indigo-600 capitalize font-medium">{selectedFocus}</span>
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg text-[11px]">
                {(["grammar", "vocabulary", "pronunciation", "comprehensive"] as const).map((focus) => (
                  <button
                    key={focus}
                    onClick={() => setSelectedFocus(focus)}
                    className={`text-center py-1.5 rounded-md font-medium capitalize transition ${
                      selectedFocus === focus 
                        ? "bg-white text-slate-900 shadow-xs" 
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {focus === "comprehensive" ? "All-Round" : focus}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-slate-50 pt-3">
              <span className="text-xs text-slate-600 font-medium">Text-to-Speech Autoplay</span>
              <button
                onClick={() => {
                  setIsLoverSpeech(!isLoverSpeech);
                  stopSpeaking();
                }}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                  isLoverSpeech 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                {isLoverSpeech ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Enabled</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Muted</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER PANEL: Chat Terminal */}
      <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Chat window panel */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[580px] overflow-hidden">
          
          {/* Channel Header */}
          <div className="bg-slate-50 border-b border-slate-100 px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl p-1 bg-white rounded-md border border-slate-100">{selectedChar.avatar}</span>
              <div>
                <h4 className="text-sm font-sans font-semibold text-slate-800 flex items-center gap-1">
                  <span>{selectedChar.name}</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </h4>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">Roleplay Setting: {selectedChar.accent.toUpperCase()} Accent</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded bg-white border border-slate-100 hover:bg-slate-50 transition"
              title="Reset Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Scenario Box */}
          <div className="bg-indigo-50/40 p-3 border-b border-slate-100/50 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-indigo-600 uppercase font-bold tracking-wider block">Roleplay Scenario</span>
              <p className="text-[11.5px] text-slate-600 mt-0.5 leading-snug">{selectedChar.context}</p>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              // Only user messages that precede an assistant reply with feedback can have analysis review logs
              const isFeedbackMsg = !isUser && msg.feedback;

              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    
                    {/* Character Avatar Indicator */}
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 bg-slate-100 border border-slate-200">
                      {isUser ? <User className="w-3 h-3 text-slate-500" /> : selectedChar.avatar}
                    </div>

                    {/* Chat Bubble Core */}
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      isUser 
                        ? "bg-slate-900 text-white rounded-br-none" 
                        : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/50"
                    }`}>
                      <p>{msg.content}</p>
                    </div>

                    {/* Audio Playback for Tutor responses */}
                    {!isUser && (
                      <button 
                        onClick={() => speak(msg.content)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"
                        title="Listen to this phrase"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Timestamp and Evaluation Badges */}
                  <div className={`flex items-center gap-2 mt-1 px-8 text-[9px] text-slate-400 font-mono ${isUser ? "justify-end" : "justify-start"}`}>
                    <span>{msg.timestamp}</span>

                    {/* View Instant Grammar & Vocabulary evaluation results */}
                    {isFeedbackMsg && (
                      <button
                        onClick={() => setActiveFeedback(msg.feedback!)}
                        className={`font-sans font-medium hover:underline flex items-center gap-1 ${
                          msg.feedback!.grammarScore >= 85 
                            ? "text-emerald-600" 
                            : msg.feedback!.grammarScore >= 65 
                              ? "text-amber-600" 
                              : "text-rose-600"
                        }`}
                      >
                        <span>• Review Feedback (Score: {msg.feedback!.grammarScore}%)</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-end gap-2">
                <div className="h-6 w-6 rounded-full flex items-center justify-center bg-slate-100 border text-xs">
                  {selectedChar.avatar}
                </div>
                <div className="p-3 bg-slate-100 text-slate-500 rounded-2xl rounded-bl-none border border-slate-200/50 text-xs flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  <span className="ml-1 font-mono text-[10px]">Evaluating grammar...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form Console */}
          <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-3 bg-slate-50/50 flex items-center gap-2">
            
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl border flex-shrink-0 transition-all ${
                isListening 
                  ? "bg-red-500 text-white border-red-500 animate-pulse" 
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
              title={isListening ? "Listening... click to pause" : "Record voice natively"}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isListening ? "Listening to your voice..." : `Reply as yourself to ${selectedChar.name}...`}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex-shrink-0 disabled:opacity-50 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* RIGHT SIDEBAR: AI Real-Time Feedback Panel */}
        <div className="md:col-span-5 flex flex-col h-[580px] space-y-4">
          
          <div className="bg-indigo-900 text-white rounded-2xl p-4 shadow-sm space-y-3.5 relative overflow-hidden flex-shrink-0">
            {/* Background design accents */}
            <div className="absolute right-0 bottom-0 text-white/5 font-display text-8xl select-none translate-x-6 translate-y-6">EN</div>
            
            <h4 className="text-xs font-mono font-medium tracking-wide text-indigo-200 uppercase flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" />
              <span>Session Scoreboard</span>
            </h4>
            
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-display font-medium tracking-tight">
                {activeFeedback ? activeFeedback.grammarScore : "—"}
              </span>
              <span className="text-xs text-indigo-200">/ 100 max score</span>
            </div>

            <p className="text-xs text-indigo-150 leading-relaxed font-sans">
              {activeFeedback 
                ? "Excellent analysis captured! See spelling, idiom replacements, and pronunciation guidelines below."
                : "Talk to Emma, Arthur or Aiden. Every sentence you transmit undergoes rigorous parsing by the Gemini AI Coach to generate metrics here."
              }
            </p>
          </div>

          {/* Detailed analysis review ledger */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex-1 overflow-y-auto space-y-4">
            
            <h4 className="text-xs font-mono text-slate-500 uppercase tracking-widest border-b border-sm border-slate-100 pb-2.5 flex items-center justify-between">
              <span>Correction breakdown</span>
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            </h4>

            {activeFeedback ? (
              <div className="space-y-4 text-xs">
                
                {/* 1. Restructured sentence comparison */}
                {activeFeedback.correctedText ? (
                  <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Polished Suggestion</span>
                    <p className="text-slate-800 leading-snug font-medium italic">"{activeFeedback.correctedText}"</p>
                    <p className="text-[10.5px] text-slate-500 mt-1">Comparing to yours: <span className="line-through">"{activeFeedback.originalText}"</span></p>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border-emerald-100 rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="font-semibold">Flawless Phrasing!</p>
                      <p className="text-[10.5px] opacity-90">No urgent grammar slips found. Well set!</p>
                    </div>
                  </div>
                )}

                {/* 2. Specific itemized corrections */}
                {activeFeedback.corrections && activeFeedback.corrections.length > 0 && (
                  <div className="space-y-2.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Key Grammatical Adjustments</label>
                    {activeFeedback.corrections.map((corr, idx) => (
                      <div key={idx} className="border-l-2 border-indigo-400 pl-2.5 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-rose-500 line-through font-mono text-[10.5px]">{corr.error}</span>
                          <span className="text-slate-400">→</span>
                          <span className="text-emerald-600 font-medium text-[10.5px]">{corr.correction}</span>
                        </div>
                        <p className="text-slate-500 leading-relaxed text-[11px]">{corr.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Vocabulary boost/idioms alternatives */}
                {activeFeedback.vocabularyBoosters && activeFeedback.vocabularyBoosters.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>Vocabulary Boosters</span>
                    </label>
                    <div className="space-y-2">
                      {activeFeedback.vocabularyBoosters.map((boost, idx) => (
                        <div key={idx} className="bg-indigo-50/20 border border-indigo-100/40 p-2.5 rounded-xl space-y-1">
                          <p className="font-medium text-[11px] text-slate-800">
                            Instead of "{boost.originalWord}", try: <span className="text-indigo-600 underline font-semibold">{boost.betterWord}</span>
                          </p>
                          <p className="text-slate-500/90 text-[10.5px] leading-snug"><span className="italic font-medium text-slate-600">Def:</span> {boost.meaning}</p>
                          <p className="text-[10.5px] font-mono text-indigo-500 leading-snug bg-white rounded p-1 border border-indigo-50/50"><span className="font-bold">Usage:</span> {boost.example}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Phonetic articulation pronunciation triggers */}
                {activeFeedback.pronunciationTips && activeFeedback.pronunciationTips.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-emerald-500" />
                      <span>Articulation & Phonetics</span>
                    </label>
                    <div className="space-y-1.5">
                      {activeFeedback.pronunciationTips.map((tip, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 rounded-lg">
                          <p className="font-medium text-slate-800 text-[11.5px] flex items-center gap-1.5">
                            <span>{tip.word}</span>
                            <span className="text-rose-500 text-[10px] font-mono bg-white border px-1 rounded">/{tip.phonetic}/</span>
                          </p>
                          <p className="text-slate-500 text-[10px] leading-snug mt-1">{tip.tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. General Tone & Politeness */}
                {activeFeedback.communicationTips && (
                  <div className="pt-2 border-t border-slate-100">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block mb-1">Tone & Pragmatics Adviser</label>
                    <p className="text-slate-600 italic leading-snug text-[11px]">{activeFeedback.communicationTips}</p>
                  </div>
                )}

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4 space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-300 stroke-1" />
                <div>
                  <p className="text-xs font-semibold text-slate-500">No active turn evaluated yet</p>
                  <p className="text-[11px] opacity-80 mt-1 max-w-[200px]">Type or use the Mic to send a phrase, and we'll populate this dashboard with real-time corrections.</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
