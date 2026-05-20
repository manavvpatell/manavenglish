import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  PenTool, 
  Award, 
  BookOpen, 
  TrendingUp, 
  Globe, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Loader2, 
  ChevronRight, 
  ArrowRight, 
  BookMarked,
  Languages,
  Check,
  Star,
  Info
} from "lucide-react";
import ChatLounge from "./components/ChatLounge";
import { LabAnalysisResult, DailyChallenge, ScoreHistoryItem } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"chat" | "lab" | "challenges" | "handbook" | "scores">("chat");
  
  // Grammar Lab State
  const [labText, setLabText] = useState("");
  const [labFocus, setLabFocus] = useState<"general" | "business" | "academic">("general");
  const [labResult, setLabResult] = useState<LabAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [labError, setLabError] = useState("");

  // Daily Challenge State
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<DailyChallenge | null>(null);
  const [userChallengeText, setUserChallengeText] = useState("");
  const [isEvaluatingChallenge, setIsEvaluatingChallenge] = useState(false);
  const [challengesLoading, setChallengesLoading] = useState(false);

  // Local storage persistent score keeper
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryItem[]>(() => {
    const saved = localStorage.getItem("ENGLISH_COACH_SCORES_V2_DATA");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: "seed-1", timestamp: "Today, 10:48 AM", source: "chat", score: 85, label: "Conversation Partner: Emma", feedbackSnippet: "Analyzed short greeting. Offered friendly correction about prepositions." },
      { id: "seed-2", timestamp: "Today, 10:52 AM", source: "challenge", score: 92, label: "Phrasal Verb Challenge", feedbackSnippet: "Completed phrasal verb application task with accurate professional style." },
      { id: "seed-3", timestamp: "Today, 10:55 AM", source: "lab", score: 78, label: "Grammar Diagnostic Lab", feedbackSnippet: "Analyzed draft document. Restructured a compound clause with better readability." }
    ];
  });

  // Statistics State
  const [stats, setStats] = useState({
    conversationsCompleted: 2,
    wordsPracticed: 342,
    challengesPassed: 1,
    averageGrammarScore: 88
  });

  // Sync state stats and localStorage
  useEffect(() => {
    localStorage.setItem("ENGLISH_COACH_SCORES_V2_DATA", JSON.stringify(scoreHistory));
    
    if (scoreHistory.length > 0) {
      const sum = scoreHistory.reduce((acc, curr) => acc + curr.score, 0);
      const avg = Math.round(sum / scoreHistory.length);
      const chatsCount = scoreHistory.filter(i => i.source === "chat").length;
      const challengesCount = scoreHistory.filter(i => i.source === "challenge" && i.score >= 70).length;

      setStats(prev => ({
        ...prev,
        conversationsCompleted: chatsCount || 1,
        challengesPassed: challengesCount || 1,
        averageGrammarScore: avg
      }));
    }
  }, [scoreHistory]);

  const recordNewScore = (newScore: Omit<ScoreHistoryItem, "id" | "timestamp">) => {
    const item: ScoreHistoryItem = {
      ...newScore,
      id: "score-" + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ", " + new Date().toLocaleDateString([], { month: "short", day: "numeric" })
    };
    setScoreHistory(prev => [item, ...prev]);
  };

  // Fetch challenges on load
  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    setChallengesLoading(true);
    try {
      const res = await fetch("/api/coach/challenges");
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges || []);
        if (data.challenges && data.challenges.length > 0) {
          setSelectedChallenge(data.challenges[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load daily curriculum", err);
    } finally {
      setChallengesLoading(false);
    }
  };

  // Lab analysis agent call
  const handleAnalyzeText = async () => {
    if (!labText.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setLabError("");
    try {
      const response = await fetch("/api/coach/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: labText, focus: labFocus }),
      });

      if (!response.ok) {
        throw new Error("Unable to analyze text structure. Please try shorter paragraphs.");
      }

      const data = await response.json();
      setLabResult(data);
      
      // Update local statistics safely
      setStats(prev => ({
        ...prev,
        wordsPracticed: prev.wordsPracticed + labText.trim().split(/\s+/).length
      }));

      // Record score from grammar analyzer
      recordNewScore({
        source: "lab",
        score: data.readabilityScore || 80,
        label: `Grammar check: "${labText.trim().substring(0, 30)}..."`,
        feedbackSnippet: `Processed writing check. Clarity level assessed at ${data.readabilityScore || 80}%.`
      });
    } catch (err: any) {
      setLabError(err.message || "An unexpected issue happened during grammar check.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Interactive challenge assessment agent call
  const handleEvaluateChallenge = async () => {
    if (!selectedChallenge || !userChallengeText.trim() || isEvaluatingChallenge) return;
    setIsEvaluatingChallenge(true);
    try {
      const response = await fetch("/api/coach/challenge/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge: selectedChallenge,
          userResponse: userChallengeText
        })
      });

      if (!response.ok) {
        throw new Error("Evaluation engine failed. Please try formulating your response again.");
      }

      const data = await response.json();
      
      // Update list status
      setChallenges(prev => prev.map(c => {
        if (c.id === selectedChallenge.id) {
          return {
            ...c,
            userCompleted: true,
            score: data.score,
            aiReview: data.analysis
          };
        }
        return c;
      }));

      // Update active challenge preview status
      setSelectedChallenge(prev => prev ? {
        ...prev,
        userCompleted: true,
        score: data.score,
        aiReview: data.analysis
      } : null);

      // Add to statistics
      if (data.passed) {
        setStats(prev => ({
          ...prev,
          challengesPassed: prev.challengesPassed + 1
        }));
      }

      // Record score from daily challenge
      recordNewScore({
        source: "challenge",
        score: data.score || 80,
        label: `Daily Workout Task: ${selectedChallenge.title}`,
        feedbackSnippet: `Linguistic accuracy check: Passed with ${data.score || 80}% score.`
      });

    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluatingChallenge(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* 1. TOP HERO BAR */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand / Humanistic Labeling */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg shadow-md shadow-indigo-200">
              en
            </div>
            <div>
              <h1 className="font-display font-bold text-slate-900 text-lg tracking-tight flex items-center gap-1.5">
                <span>English Coach AI</span>
                <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">Smart Lab v1.5</span>
              </h1>
              <p className="text-xs text-slate-500">Perfect your syntax, speak with native-styled AI characters, and track daily progress</p>
            </div>
          </div>

          {/* Core App Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "chat" 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Roleplay Lounge</span>
            </button>

            <button
              onClick={() => setActiveTab("lab")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "lab" 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Grammar & Restructuring Lab</span>
            </button>

            <button
              onClick={() => setActiveTab("challenges")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "challenges" 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Interactive Challenges</span>
              {challenges.length > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("handbook")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "handbook" 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Pronunciation Handbook</span>
            </button>

            <button
              onClick={() => setActiveTab("scores")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "scores" 
                  ? "bg-white text-indigo-600 shadow-sm font-bold" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Scoreboard & Progress</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-mono font-bold leading-none">
                {scoreHistory.length}
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* 2. STATS OVERVIEW DECK */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-indigo-200 uppercase tracking-widest block">Active Session Level</span>
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold text-slate-100">B2 / Upper-Intermediate</span>
            </div>
            <p className="text-[11px] text-slate-400">Adaptive AI matching enabled</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-indigo-200 uppercase tracking-widest block">Accumulated Words</span>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-display font-bold text-slate-100">{stats.wordsPracticed} words</span>
            </div>
            <p className="text-[11px] text-slate-400">From conversational roleplays</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-indigo-200 uppercase tracking-widest block">Daily Challenges Completed</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-display font-semibold text-slate-100">{stats.challengesPassed} / 4 tasks</span>
            </div>
            <p className="text-[11px] text-slate-400">Refreshes every 24 hours</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-indigo-200 uppercase tracking-widest block">Current Speech Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-display font-bold text-indigo-400">{stats.averageGrammarScore}%</span>
              <span className="text-[11px] text-slate-400">average correctness</span>
            </div>
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${stats.averageGrammarScore}%` }}></div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. DYNAMIC WORKSPACE ROUTING */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "chat" && (
            <motion.div
              key="chat-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              <div className="mb-4">
                <h2 className="text-xl font-display font-semibold text-slate-900">Conversational Roleplay Lounge</h2>
                <p className="text-xs text-slate-500 mt-1">Practice spontaneous English speech in simulated high-stakes or daily environments. Click words below for voice replay guides.</p>
              </div>
              <ChatLounge onScoreEarned={recordNewScore} />
            </motion.div>
          )}

          {activeTab === "lab" && (
            <motion.div
              key="lab-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-display font-semibold text-slate-900">Grammar & Structure Diagnostic Lab</h2>
                <p className="text-xs text-slate-500 mt-1">Compose paragraphs, work reports, or draft email items and receive deep syntactic restructuring ideas broken down sentence-by-sentence.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Text entry field column */}
                <div className="lg:col-span-6 bg-white border border-slate-100 rounded-2xl p-4 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-medium uppercase tracking-wider text-slate-505 block">Input Document Draft</label>
                    
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-medium">Style bias:</span>
                      <select
                        value={labFocus}
                        onChange={(e: any) => setLabFocus(e.target.value)}
                        className="text-xs font-semibold bg-slate-50 text-indigo-600 border border-slate-200 rounded px-2 py-1 focus:outline-hidden"
                      >
                        <option value="general">Casual Everyday</option>
                        <option value="business">Professional Business</option>
                        <option value="academic">Academic & Essay</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    value={labText}
                    onChange={(e) => setLabText(e.target.value)}
                    rows={8}
                    className="w-full text-xs font-sans text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:border-indigo-500 focus:bg-white resize-none leading-relaxed"
                    placeholder="E.g., I would like to telling you that I has been working on this feature since two weeks, but we still didn't finish it because of some bugs."
                  />

                  {labError && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs border border-red-200 rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span>{labError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {labText.trim().split(/\s+/).filter(Boolean).length} words parsed
                    </span>
                    <button
                      onClick={handleAnalyzeText}
                      disabled={isAnalyzing || !labText.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium tracking-tight shadow-sm flex items-center gap-1.5 transition disabled:opacity-55"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Parsing Grammar...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Deconstruct Syntax</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Analysis response panel */}
                <div className="lg:col-span-6 space-y-4">
                  {labResult ? (
                    <div className="space-y-4">
                      
                      {/* Metric widgets block */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-xs text-center">
                          <span className="text-[10px] font-mono text-slate-505 uppercase block">Readability</span>
                          <span className="text-xl font-display font-semibold text-slate-800">{labResult.readabilityScore}%</span>
                          <p className="text-[9px] text-slate-400 mt-0.5">comprehensibility</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-xs text-center">
                          <span className="text-[10px] font-mono text-slate-505 uppercase block font-medium">Issue Count</span>
                          <span className="text-xl font-display font-semibold text-rose-500">{labResult.issueCount}</span>
                          <p className="text-[9px] text-slate-400 mt-0.5">slips or awkward tenses</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-xs text-center">
                          <span className="text-[10px] font-mono text-slate-505 uppercase block">Sentence Vol</span>
                          <span className="text-xl font-display font-semibold text-slate-800">{labResult.sentenceCount}</span>
                          <p className="text-[9px] text-slate-400 mt-0.5">analyzed clauses</p>
                        </div>
                      </div>

                      {/* Fully polished revision comparative panel */}
                      <div className="bg-indigo-900 text-white rounded-2xl p-4 shadow-xs space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wide block text-indigo-300">Fluent Professional Draft</span>
                        <p className="text-xs leading-relaxed font-sans italic">"{labResult.restructuredText}"</p>
                      </div>

                      {/* Precise breakdown of each individual sentence */}
                      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-4">
                        <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider">Breakdown Matrix</h4>
                        
                        <div className="space-y-4">
                          {labResult.breakdown.map((item, idx) => (
                            <div key={idx} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0 space-y-1.5">
                              <p className="text-xs font-medium text-slate-800">
                                <span className="font-mono text-indigo-500 mr-1.5">#{idx + 1}</span>
                                "{item.originalSentence}"
                              </p>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                                  item.status === "correct" 
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                    : item.status === "needs_improvement" 
                                      ? "bg-amber-50 text-amber-600 border border-amber-100" 
                                      : "bg-red-50 text-red-600 border border-red-100"
                                }`}>
                                  {item.status.replace("_", " ")}
                                </span>
                                {item.suggestion && (
                                  <span className="text-xs text-indigo-600 font-semibold font-sans">
                                    → Try: "{item.suggestion}"
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">{item.details}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Structural themes extracted */}
                      {labResult.structuralHighlights && labResult.structuralHighlights.length > 0 && (
                        <div className="bg-emerald-50/50 border border-emerald-100/30 rounded-2xl p-4 space-y-3">
                          <label className="text-[10px] uppercase font-bold text-emerald-600 block">Linguistic Observations</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {labResult.structuralHighlights.map((highlight, idx) => (
                              <div key={idx} className="space-y-1">
                                <h5 className="font-sans font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>{highlight.topic}</span>
                                </h5>
                                <p className="text-[11px] text-slate-500 leading-normal">{highlight.feedback}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs text-center flex flex-col items-center justify-center min-h-[300px] text-slate-400 space-y-3">
                      <PenTool className="w-10 h-10 text-slate-300 stroke-1" />
                      <div>
                        <p className="text-sm font-semibold text-slate-500">Awaiting your draft document</p>
                        <p className="text-xs mt-1 max-w-xs mx-auto text-slate-400 leading-relaxed">Paste work paragraphs or letters on the left. The compiler parses them using Gemini language vectors for grammar rules, vocabulary, and articulation logic.</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === "challenges" && (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-display font-semibold text-slate-900">English Language Daily Curriculum</h2>
                <p className="text-xs text-slate-500 mt-1">Four quick interactive workouts mapping to core linguistic elements. Write a sentence demonstrating your understanding to receive instant checkmarks.</p>
              </div>

              {challengesLoading ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-white border rounded-2xl">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-xs text-slate-500">Creating customized syllabus challenges from the cloud...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left challenge selection list */}
                  <div className="lg:col-span-5 space-y-3">
                    <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider">Curriculum Tasks</h3>
                    {challenges.map((challenge) => (
                      <button
                        key={challenge.id}
                        onClick={() => {
                          setSelectedChallenge(challenge);
                          setUserChallengeText("");
                        }}
                        className={`w-full text-left p-3.5 rounded-xl transition-all border block relative overflow-hidden ${
                          selectedChallenge?.id === challenge.id 
                            ? "bg-white border-indigo-600 shadow-sm ring-1 ring-indigo-50" 
                            : "bg-white border-slate-150 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 font-medium">
                            {challenge.category}
                          </span>
                          {challenge.userCompleted && (
                            <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-1 font-semibold">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Done ({challenge.score}%)</span>
                            </span>
                          )}
                        </div>

                        <h4 className="font-sans font-semibold text-slate-800 text-xs mt-2.5">{challenge.title}</h4>
                        <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-1 mt-1">{challenge.meaning}</p>
                      </button>
                    ))}
                  </div>

                  {/* Right interactive solver box */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-5">
                    {selectedChallenge ? (
                      <div className="space-y-4">
                        
                        <div className="border-b border-slate-100 pb-3">
                          <span className="text-[10px] text-slate-400 font-mono block">Active Challenge Task</span>
                          <h3 className="text-md font-sans font-bold text-slate-900 mt-1">{selectedChallenge.title}</h3>
                          <p className="text-slate-500 text-xs mt-0.5 leading-snug">{selectedChallenge.meaning}</p>
                        </div>

                        {selectedChallenge.dialogExample && (
                          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Conversational Example</span>
                            <p className="text-slate-700 italic text-xs leading-relaxed">"{selectedChallenge.dialogExample}"</p>
                            {selectedChallenge.phonetic && (
                              <p className="text-[11px] text-indigo-500 font-mono mt-1">Phonetic Sound: /{selectedChallenge.phonetic}/</p>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700 block">Your Exercise Answer Task:</label>
                          <p className="text-[11.5px] text-slate-500 leading-normal">{selectedChallenge.instruction}</p>
                          
                          <textarea
                            value={userChallengeText}
                            onChange={(e) => setUserChallengeText(e.target.value)}
                            disabled={selectedChallenge.userCompleted || isEvaluatingChallenge}
                            placeholder="E.g., I'll call you as soon as I break a leg at the interview!"
                            rows={3}
                            className="w-full text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl p-3 focus:outline-hidden resize-none leading-relaxed"
                          />
                        </div>

                        {!selectedChallenge.userCompleted ? (
                          <div className="flex justify-end">
                            <button
                              onClick={handleEvaluateChallenge}
                              disabled={!userChallengeText.trim() || isEvaluatingChallenge}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition shadow"
                            >
                              {isEvaluatingChallenge ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Tutor is reading...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Submit for Review</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 mt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs uppercase font-extrabold text-indigo-700 tracking-wider">Tutor Review Grade</span>
                              <span className="text-sm font-display font-bold text-slate-800">{selectedChallenge.score}% correctness</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">{selectedChallenge.aiReview}</p>
                            
                            <div className="flex justify-end pt-2">
                              <button
                                onClick={() => {
                                  // Clear completed state for retry
                                  setChallenges(prev => prev.map(c => {
                                    if (c.id === selectedChallenge.id) {
                                      return { ...c, userCompleted: false, aiReview: undefined, score: undefined };
                                    }
                                    return c;
                                  }));
                                  setSelectedChallenge(prev => prev ? { ...prev, userCompleted: false, aiReview: undefined, score: undefined } : null);
                                  setUserChallengeText("");
                                }}
                                className="text-[11px] text-indigo-600 font-semibold hover:underline"
                              >
                                Try Exercise Again
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className="text-center text-slate-400 p-8">
                        <Award className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                        <p className="text-xs font-medium mt-2">Select a daily curriculum challenge from the list to test your skills.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </motion.div>
          )}

          {activeTab === "handbook" && (
            <motion.div
              key="handbook"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-display font-semibold text-slate-900">Pronunciation & Articulation Handbook</h2>
                <p className="text-xs text-slate-500 mt-1">A cheat sheet collection targeting classic phonetic pronunciation slips, diphthongs, and physical mechanics of sounding fluent in English speech.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                    th
                  </div>
                  <h4 className="font-sans font-bold text-slate-800 text-sm">Targeting "th" (/θ/ and /ð/)</h4>
                  <p className="text-[11.5px] text-slate-500 leading-relaxed">Many learners pronounce "the" as "de" or "think" as "sink". To make the real sound, the tip of your tongue must rest gently between your upper and lower teeth, allowing friction air to skip past.</p>
                  <p className="text-[11px] font-mono text-indigo-500 bg-slate-50 p-2 rounded border border-slate-100">Practice: "Three thin thermos flasks on Thursday"</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">
                    r
                  </div>
                  <h4 className="font-sans font-bold text-slate-800 text-sm">The American Retroflex /r/</h4>
                  <p className="text-[11.5px] text-slate-500 leading-relaxed">Unlike rolling r's, the American "r" sound is made deep in the mouth without the tongue touching the roof at all. Curl the tip of your tongue backwards and pull it slightly back into the center of the cavity.</p>
                  <p className="text-[11px] font-mono text-indigo-500 bg-slate-50 p-2 rounded border border-slate-100">Practice: "The Red River runs rough on rural rocks"</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-605 flex items-center justify-center text-xs font-bold animate-pulse">
                    ə
                  </div>
                  <h4 className="font-sans font-bold text-slate-800 text-sm">Mastering the "Schwa" Sound</h4>
                  <p className="text-[11.5px] text-slate-500 leading-relaxed">The most common un-stressed sound in English. Represented as short "uh". For example, "about" is pronounced /uh-bout/, not /ay-bout/. Stressing the wrong vowel ruins conversational rhythm.</p>
                  <p className="text-[11px] font-mono text-indigo-500 bg-slate-50 p-2 rounded border border-slate-100">Practice: "Please support the balloon around today"</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-bold">
                    sh
                  </div>
                  <h4 className="font-sans font-bold text-slate-800 text-sm">Sibilant Clarity (/ʃ/ vs /s/)</h4>
                  <p className="text-[11.5px] text-slate-500 leading-relaxed">Distinguish clearly between "ship" and "sip". If you place your teeth together and force air, "s" is high pitch because your tongue tip is close to your front teeth. For "sh", pull your tongue back deeper.</p>
                  <p className="text-[11px] font-mono text-indigo-500 bg-slate-50 p-2 rounded border border-slate-100">Practice: "She sells seashells by the calm seashore"</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                    v
                  </div>
                  <h4 className="font-sans font-bold text-slate-800 text-sm">Labiodental Friction (/v/ vs /w/)</h4>
                  <p className="text-[11.5px] text-slate-500 leading-relaxed">Do not pronounce "very" as "wery". To sound "v", your upper teeth must gently press the inner cushion of your bottom lip. For "w", simply round your lips into a tight circle without tooth contact.</p>
                  <p className="text-[11px] font-mono text-indigo-500 bg-slate-50 p-2 rounded border border-slate-100">Practice: "We were very willing to visit our windy valley"</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-2.5 shadow-sm space-y-3 bg-gradient-to-br from-indigo-50 to-white border-indigo-100/60 flex flex-col justify-between">
                  <div className="space-y-2 p-1.5">
                    <span className="text-[9px] font-mono uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-black">Interactive Feature</span>
                    <h4 className="font-sans font-extrabold text-slate-900 text-sm">Voice Practicing Lounge</h4>
                    <p className="text-[11.5px] text-slate-600 leading-normal">Ready to try articulating these sounds in live contexts? Go back to the **Conversational Lounge** tab, turn on the Microphone, and make contact with Chloe or Daniel today.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("chat")}
                    className="w-full text-center py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition flex items-center justify-center gap-1.5"
                  >
                    <span>Launch Roleplay Lounge</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === "scores" && (
            <motion.div
              key="scores-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-display font-semibold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <span>Communication Scoreboard & Progress</span>
                  </h2>
                  <p className="text-xs text-slate-505 mt-1">
                    Your real-time continuous speech validation log. Every roleplay turn, challenge accuracy test, and grammar laboratory text score is recorded below.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to reset your score history? This will clear all tracked progress.")) {
                        setScoreHistory([]);
                      }
                    }}
                    className="px-3 py-1.5 border border-slate-200 hover:border-red-205 hover:bg-red-50 text-slate-500 hover:text-red-650 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Reset Progress Data</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      const exercises = [
                        { label: "Active Conversation with Tutor Raj", source: "chat" as const, score: Math.floor(Math.random() * 25) + 75, feedbackSnippet: "Good flow of corporate tech vocabulary, but missed particle verbs." },
                        { label: "Business Email Grammar Synthesis", source: "lab" as const, score: Math.floor(Math.random() * 20) + 78, feedbackSnippet: "Identified and corrected passive voice components. Perfect formatting." },
                        { label: "Daily Challenge Workout: Idiom Mastery", source: "challenge" as const, score: Math.floor(Math.random() * 15) + 85, feedbackSnippet: "Accurately verified sentence patterns. High correctness rating!" }
                      ];
                      const randomEx = exercises[Math.floor(Math.random() * exercises.length)];
                      recordNewScore(randomEx);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Simulate Workout Score</span>
                  </button>
                </div>
              </div>

              {/* Badges overview bento block */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left block: Current Level Badge & Score Dial */}
                <div className="md:col-span-4 bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Accredited Skill Milestone</span>
                    <h3 className="text-md font-sans font-extrabold text-slate-800">
                      {stats.averageGrammarScore >= 95 ? (
                        <span className="text-indigo-650 flex items-center gap-1.5">
                          <Star className="w-4 h-4 fill-indigo-400 text-indigo-500" />
                          <span>Native Speaker Elite</span>
                        </span>
                      ) : stats.averageGrammarScore >= 85 ? (
                        <span className="text-amber-600 flex items-center gap-1.5">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                          <span>Advanced Fluent Speaker</span>
                        </span>
                      ) : stats.averageGrammarScore >= 75 ? (
                        <span className="text-emerald-650 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-555" />
                          <span>Professional Communicator</span>
                        </span>
                      ) : (
                        <span className="text-indigo-500 flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-indigo-400" />
                          <span>Core Linguistic Learner</span>
                        </span>
                      )}
                    </h3>
                  </div>

                  {/* Circular Dial Visual in Pure CSS */}
                  <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-2xl relative border border-slate-100/50">
                    <div className="relative h-28 w-28 flex items-center justify-center rounded-full bg-white shadow-xs border border-slate-100">
                      <div className="absolute inset-2.5 rounded-full border border-indigo-100/50"></div>
                      <div className="text-center z-10">
                        <span className="text-3xl font-display font-black text-slate-800">{stats.averageGrammarScore}</span>
                        <span className="text-xs font-mono font-bold text-indigo-500 block">SCORE</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-semibold mt-3 text-center">
                      Average of {scoreHistory.length} continuous evaluations
                    </p>
                  </div>

                  <div className="text-xs text-slate-500 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-700">Level Advice:</span>{" "}
                    {stats.averageGrammarScore >= 90 
                      ? "Your accuracy ranks in the top 5% of global speakers. Focus on complex business idioms and fine-tuning passive vocal speech triggers."
                      : stats.averageGrammarScore >= 80
                        ? "Terrific syntax confidence! Try shifting into the Daily Challenges tab to work on low-frequency vocabulary modifiers."
                        : "Focus on structured prepositions and perfect clause arrangement inside our Diagnostic Lab to bump your average score over 85%."}
                  </div>
                </div>

                {/* Right block: Dynamic Performance Progress Timeline Graph */}
                <div className="md:col-span-8 bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs uppercase font-mono text-slate-400 font-bold block">Linguistic Accuracy Trend</h3>
                      <p className="text-[11px] text-slate-400">Visualization of recent score variations</p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100/50">
                      Sync Status: Persistent Live
                    </span>
                  </div>

                  {/* Dynamic Custom Flex Histogram Chart */}
                  {scoreHistory.length > 0 ? (
                    <div className="h-44 flex items-end gap-2 border-b border-l border-slate-200 pb-2 pl-2">
                      {scoreHistory.slice(0, 10).reverse().map((item, idx) => (
                        <div key={item.id} className="flex-1 flex flex-col items-center group relative cursor-pointer h-full justify-end">
                          
                          {/* Hover Speech Popup */}
                          <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 shadow-md">
                            <p className="font-bold">{item.label}</p>
                            <p className="text-indigo-300 text-indigo-300">Grade: {item.score}% | Source: {item.source}</p>
                          </div>

                          {/* Interactive Bar */}
                          <div 
                            className={`w-full rounded-t-lg transition-all duration-300 group-hover:brightness-105 ${
                              item.score >= 90
                                ? "bg-indigo-650 bg-indigo-600 shadow-xs shadow-indigo-100"
                                : item.score >= 80
                                  ? "bg-indigo-500"
                                  : item.score >= 70
                                    ? "bg-amber-400"
                                    : "bg-rose-450 bg-rose-400"
                            }`}
                            style={{ height: `${item.score}%` }}
                          />

                          {/* X-Axis Indicator */}
                          <span className="text-[9px] font-mono text-slate-400 mt-1 uppercase scale-90">
                            #{scoreHistory.length - 9 + idx > 0 ? scoreHistory.length - 9 + idx : idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-44 bg-slate-50 rounded-xl flex items-center justify-center border border-dashed border-slate-200 text-slate-400 text-xs">
                      No tracked scores yet. Complete dialogues or challenge tasks to draw progress trends.
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <div className="p-2 border border-slate-100 rounded-lg text-center">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Total Workouts</span>
                      <span className="text-md font-bold text-slate-800">{scoreHistory.length} Sessions</span>
                    </div>
                    <div className="p-2 border border-slate-100 rounded-lg text-center">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">High Watermark</span>
                      <span className="text-md font-bold text-emerald-600">
                        {scoreHistory.length > 0 ? Math.max(...scoreHistory.map(i => i.score)) : 0}%
                      </span>
                    </div>
                    <div className="p-2 border border-slate-100 rounded-lg text-center">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Laps Over 90%</span>
                      <span className="text-md font-bold text-indigo-700">
                        {scoreHistory.filter(i => i.score >= 90).length} Finished
                      </span>
                    </div>
                    <div className="p-2 border border-slate-100 rounded-lg text-center">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Accuracy Rank</span>
                      <span className="text-md font-bold text-indigo-655 text-indigo-600">
                        {stats.averageGrammarScore >= 80 ? "Class A" : "Class B"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Feed: Detailed Historic Timeline List */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs uppercase font-extrabold text-indigo-600 tracking-wider font-mono">
                    Evaluation Timeline Feed
                  </h3>
                  <span className="text-[11px] text-slate-400">Showing all records in chronological sequence</span>
                </div>

                {scoreHistory.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {scoreHistory.map((item) => (
                      <div key={item.id} className="py-3.5 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          
                          {/* Graphic Type Indicator Badge */}
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                            item.source === "chat" 
                              ? "bg-indigo-50 text-indigo-600 border border-indigo-100/50" 
                              : item.source === "challenge" 
                                ? "bg-amber-50 text-amber-600 border border-amber-100/50" 
                                : "bg-teal-50 text-teal-650 border border-teal-100/50"
                          }`}>
                            {item.source === "chat" ? (
                              <MessageSquare className="w-4 h-4" />
                            ) : item.source === "challenge" ? (
                              <Award className="w-4 h-4" />
                            ) : (
                              <PenTool className="w-4 h-4" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-sans font-bold text-slate-800 text-xs">{item.label}</h4>
                              <span className="text-[9px] uppercase tracking-wider bg-slate-50 text-slate-500 px-1.5 py-0.2 rounded border border-slate-100 font-mono">
                                {item.source}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed italic">
                              "{item.feedbackSnippet}"
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                              Logged: {item.timestamp}
                            </span>
                          </div>

                        </div>

                        {/* Large Score Pill Display */}
                        <div className="text-right shrink-0">
                          <span className={`inline-flex items-center justify-center h-8 px-2.5 rounded-full text-xs font-display font-semibold border ${
                            item.score >= 90
                              ? "bg-indigo-50 text-indigo-700 border-indigo-150"
                              : item.score >= 80
                                ? "bg-indigo-50/50 text-indigo-600 border-indigo-100 font-semibold"
                                : item.score >= 70
                                  ? "bg-amber-50 text-amber-600 border-amber-100"
                                  : "bg-rose-50 text-rose-600 border-rose-100"
                          }`}>
                            {item.score}%
                          </span>
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 text-slate-400">
                    <TrendingUp className="w-10 h-10 mx-auto text-slate-205 stroke-1" />
                    <p className="text-xs font-medium mt-3">Accuracy ledger is blank. Launch a workout to populate scores.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 mt-16 py-6 text-center text-xs text-slate-400 font-mono">
        <p className="max-w-2xl mx-auto px-4">Manav Patel © 2026. Empowered by Gemini AI for adaptive speech tutoring, phonetics review, and structured text comparative analysis.</p>
      </footer>

    </div>
  );
}
