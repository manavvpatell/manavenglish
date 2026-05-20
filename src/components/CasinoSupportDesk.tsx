import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  FileText, 
  Sliders, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  User, 
  HelpCircle, 
  Sparkles, 
  RotateCcw, 
  Loader2,
  BookmarkCheck,
  ChevronRight,
  ShieldAlert,
  Download,
  Info,
  Users
} from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface PlayerPersona {
  id: string;
  name: string;
  description: string;
  avatar: string;
  initialQuestion: string;
  avatarBg: string;
}

export const RUNTIME_PLAYER_PERSONAS: PlayerPersona[] = [
  {
    id: "persona-1",
    name: "John (Impatient Winner)",
    description: "Impatient player who withdrew $2,500 yesterday. Thinks pending status is too slow.",
    avatar: "JP",
    avatarBg: "bg-amber-100 text-amber-800 border-amber-200",
    initialQuestion: "Hey, my withdrawal of $2,500 has been pending since yesterday afternoon! When will I get my money? This is taking too long."
  },
  {
    id: "persona-2",
    name: "Sarah (Confused Sweeper)",
    description: "Complete beginner. Doesn't understand the difference between sweeps tokens and prize points.",
    avatar: "SC",
    avatarBg: "bg-blue-100 text-blue-800 border-blue-200",
    initialQuestion: "Hi, I just started. Why is my Game Token balance different from my Sweeps Token balance? Which ones do I redeem for real money?"
  },
  {
    id: "persona-3",
    name: "Liam (Frustrated Reject)",
    description: "Lives in Washington state (or another excluded area) and had their cash-out request denied.",
    avatar: "LR",
    avatarBg: "bg-rose-100 text-rose-800 border-rose-200",
    initialQuestion: "My withdrawal was rejected without explanation! I reside in Washington state. What is wrong with your system? Fix it!"
  },
  {
    id: "persona-4",
    name: "Mike (Referral Buddy)",
    description: "Invited friend 'Dave99' who bought tokens, but neither got the referral rewards.",
    avatar: "MB",
    avatarBg: "bg-indigo-100 text-indigo-800 border-indigo-200",
    initialQuestion: "I referred my buddy 'Dave99'. He registered the link and purchased a package, but neither of us received the referral bonus yet."
  }
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  evaluation?: {
    csat: number;
    status: string;
    confidence: number;
    escalationRequired: boolean;
    operatorActionTips: string;
    suggestedFollowUp: string[];
  };
}

const DEFAULT_CASINO_FAQS: FAQItem[] = [
  {
    id: "faq-ref-1",
    question: "How do I purchase a package / recharge my account?",
    answer: "You can purchase Game Token packages inside the virtual Store. Simply click the 'Buy/Recharge' button on your dashboard. Every purchase may award companion bonus loyalty Sweeps Tokens. Please note: Sweeps Tokens are strictly promotional and can never be bought directly."
  },
  {
    id: "faq-ref-2",
    question: "My payment failed. What should I do?",
    answer: "First, ensure your credit card or e-wallet has international/online transactions enabled and sufficient funds. Next, double-check that your billing postal code matches your bank record exactly. If the issue persists, kindly test another card or contact player support with the error code."
  },
  {
    id: "faq-ref-3",
    question: "I was charged but didn't receive my tokens.",
    answer: "Don't worry! This occasionally happens due to micro-communication delays. Refresh your browser or tap the sync balance indicator of your account. If the balance doesn't update in 5 minutes, message support with your transaction reference number and we will credit your account manually!"
  },
  {
    id: "faq-ref-4",
    question: "Which payment methods are accepted?",
    answer: "We accept major Visa, MasterCard, and Discover debit & credit cards, instant bank transfers, and secure online digital wallets depending on your registered state/province location."
  },
  {
    id: "faq-ref-5",
    question: "Can I get a refund on my purchase?",
    answer: "According to our policy agreement, all purchases of digital Game Tokens are final and non-refundable. If you were billed without receiving your tokens, we prioritize manual verification and quick direct credit to your wallet balance."
  },
  {
    id: "faq-ref-6",
    question: "How do I withdraw/redeem my winnings?",
    answer: "Game Tokens and promotional Sweeps Tokens can never be redeemed for real prizes. Only Sweep Tokens won during sweepstakes can be redeemed. Click the 'Redeem' window to request cash payments (calculated at 1 Prize Point = US$1.00) or check digital avatar credits. Cash payouts are sent in your native CAD/USD currency to your original purchasing account."
  },
  {
    id: "faq-ref-7",
    question: "What is the minimum withdrawal amount?",
    answer: "The minimum threshold for prize redemption is 100 Sweep Tokens (equivalent to US$100.00 value). Requests below this amount cannot be processed."
  },
  {
    id: "faq-ref-8",
    question: "My withdrawal is pending for too long. When will I receive it?",
    answer: "Prize redemptions are processed diligently in order. Standard reviews take between 24 and 48 hours to complete. Fast-track withdrawals are available to our loyal high-tier VIP players once standard compliance audits are finalized!"
  },
  {
    id: "faq-ref-9",
    question: "My withdrawal was rejected. Why?",
    answer: "Most rejections are due to: (1) trying to redeem Sweeps Tokens before they've been played at least once through, (2) residing in restricted states (like WA, ID, NY, MI, etc.), or (3) missing valid KYC documents. Please check your email or contact support to rectify!"
  },
  {
    id: "faq-ref-10",
    question: "Can I withdraw without completing KYC?",
    answer: "No. Compliance regulations mandate that every player must submit a government-issued photo ID (driving license or passport) and proof of address (utility bill within the last 90 days) to successfully verify their identity prior to their first prize point redemption."
  },
  {
    id: "faq-ref-11",
    question: "Which currencies / methods are available for withdrawal?",
    answer: "Redemption payments are disbursed in the native currency of your registered place of residence (either Canadian Dollars CAD or U.S. Dollars USD) directly back to the matching bank account, digital wallet, or email-address-linked gift coupon."
  },
  {
    id: "faq-ref-12",
    question: "Why is my Total Balance different from my Sweep Token balance?",
    answer: "Your player account displays: Game Tokens (for social play with no prize value), promotional Sweeps Tokens (which must be played at least once before transitioning to sweep stakes eligibility), and redeemable Sweep Tokens / Prize Points (earned from sweepstakes play with a 1:1 redemption value of 1 point = $1.00 USD)."
  },
  {
    id: "faq-ref-13",
    question: "I see a Tip Tokens field on the withdrawal screen. What is that?",
    answer: "Tip Tokens allow players to leave a voluntary, discretionary appreciation tip to their virtual support agent or VIP concierge when redeeming prizes. This is 100% voluntary and does not impact your processing speeds."
  },
  {
    id: "faq-ref-14",
    question: "My wallet balance is not updating after a purchase or win.",
    answer: "This is usually just a client-side display lag. Simply reload the browser or click 'Sync Account Balance' on your player dashboard to refresh. Rest assured all transaction statuses are securely logged and safe on our servers!"
  },
  {
    id: "faq-ref-15",
    question: "Where can I see my transaction history?",
    answer: "You can view your complete purchase, gameplay entries, and prize redemption history by clicking on the 'Transaction History / Ledger' tab under your Player Profile settings."
  },
  {
    id: "faq-ref-16",
    question: "How does the referral program work?",
    answer: "Invite friends using your unique referral code. When your friend registers and makes their first successful Game Token package buy, both of you are immediately awarded a bonus package of free Game Tokens and extra loyalty Sweeps Tokens!"
  },
  {
    id: "faq-ref-17",
    question: "I referred a friend but didn't get my referral bonus.",
    answer: "Make sure they registered directly with your personal referral link and successfully purchased a package. If they completed these steps and you didn't receive the package rewards, send us your friend's username so we can credit your balance immediately!"
  },
  {
    id: "faq-new-login",
    question: "I can't log in to my account. What should I do?",
    answer: "Please make sure you are entering your correct registered email address and password. Try clearing your browser cache/cookies or using an incognito window. If the trouble persists, check if Caps Lock is on, or use the 'Forgot Password' link to reset your password. Our team is available to manually check your account status if you remain locked out!"
  },
  {
    id: "faq-new-forgot-pass",
    question: "I forgot my password. How do I reset it?",
    answer: "To reset your password, click the Forgot Password link on the login panel. Enter your registered email address and we will immediately send you a secure reset link. If you do not receive the email within 5 minutes, please inspect your spam or social folders, or reach out to support for a manual reset link creation!"
  },
  {
    id: "faq-new-suspended",
    question: "My account is showing as suspended or blocked. Why?",
    answer: "Account blocks usually occur due to multiple failed login attempts, multiple duplicate accounts, logging in from an unsupported restricted state (such as WA, ID, NV, DE, NY, MT, CT, NJ, CA, TN, MI), or incomplete/invalid KYC verifications. Rest assured our risk team is available to help! Please contact support directly for active resolution."
  },
  {
    id: "faq-new-register",
    question: "I can't register / the sign-up form is not working.",
    answer: "If registration isn't working, please ensure you are not using a VPN or proxy provider, as our system blocks them for security. Also, double-check that your location resides in an authorized region (USA or Canada, excluding restricted states like NY or WA) and that all registration fields are filled completely with authentic details."
  },
  {
    id: "faq-new-kyc-why",
    question: "Why do I need to complete KYC verification?",
    answer: "Know Your Customer (KYC) verification is a legal and regulatory compliance requirement. It protects our platform against fraud, prevents underage gaming, and ensures that withdrawals are safely distributed to the true owner of the account."
  },
  {
    id: "faq-new-kyc-docs",
    question: "What documents are accepted for KYC?",
    answer: "We accept government-issued identity documents containing your photo, such as a valid driver's license, passport, or national ID card. For proof of address, we accept utility bills, phone bills, or bank statements containing your full name and current residence address issued in the last 90 calendar days."
  },
  {
    id: "faq-new-kyc-rejected",
    question: "My KYC was rejected. What should I do?",
    answer: "If your KYC was rejected, it is usually because the uploaded image was blurry, expired, cropped, or did not match the registration profile. Please upload high-resolution, clear, and uncropped photos of your documents containing your full legal name, date of birth, and valid expiration date. We will expedite your re-verification!"
  },
  {
    id: "faq-new-kyc-duration",
    question: "How long does KYC verification take?",
    answer: "We review KYC submissions rapidly! Verifications are typically completed within 12 to 24 hours of document submission. During high volumes, it may take up to 48 hours. Once your identity is confirmed, your status will instantly transition to Verified and your redemptions will unlock."
  },
  {
    id: "faq-new-kyc-bonus",
    question: "I completed KYC but didn't receive my bonus.",
    answer: "We apologize for this delay! Check your account notifications or try refreshing your wallet balance. If the KYC verification bonus was not credited automatically, please notify our live virtual support or open an assistance ticket, and we'll manually verify and credit your bonus immediately."
  },
  {
    id: "faq-new-game-diff",
    question: "What is the difference between Game Tokens and Sweep Tokens?",
    answer: "Game Tokens are used exclusively for casual, social play and carry zero real-world value. Sweep Tokens are promotional/sweeps play credits which can be played through 1x; any Sweep Tokens won during valid games can then be redeemed for real values at a 1:1 rate of US$1.00 per point!"
  },
  {
    id: "faq-new-balances-wrong",
    question: "My Game Tokens / Sweep Tokens are not showing correctly.",
    answer: "This is usually a momentary display latency! Try clicking the Sync Balance button or reloading your page to fetch your latest wallet state from our servers. All play data is secured on our database logs, so your balance is completely safe."
  },
  {
    id: "faq-new-game-crash",
    question: "A game is not loading or keeps crashing.",
    answer: "If a game crashes, please: (1) update your mobile or desktop device browser to the newest version, (2) clear your browser cache files, and (3) verify your internet ping connection. Our high-performance game servers are fully responsive, so a quick refresh will usually restore your active game round right where you left off!"
  },
  {
    id: "faq-new-freespins",
    question: "I didn't receive my free spins / bonus.",
    answer: "If your promotion or daily spins did not load automatically, check the 'Promotions' page to ensure the offer was actively claimed. If it's still missing, message support with the promotion code and we will willingly credit the spins to your target game title immediately."
  },
  {
    id: "faq-new-fishing-pass",
    question: "What is the Fishing Pass and how does it work?",
    answer: "The Fishing Pass is a special gaming challenge event where you earn points by playing and catching fish! As you level up your Fishing Pass tier, you unlock exclusive rewards, massive Game Token bonuses, and loyalty promotional Sweeps Tokens."
  },
  {
    id: "faq-new-free-sweeps",
    question: "How do I earn free Sweep Tokens without purchasing?",
    answer: "You can obtain free Sweep Tokens through several promotional avenues! These include: our daily loyalty login bonus wheel, participating in social media giveaway contests, referring active friends, or sending a postal mail request according to our rules of play."
  },
  {
    id: "faq-new-wrong-result",
    question: "The game result seems wrong / I think I was cheated.",
    answer: "Every game on our platform uses certified Random Number Generators (RNG) tested by leading external compliance authorities to ensure 100% fair play. If you feel a round did not compute correctly, please send us the approximate time and game name so we can trace your round in our secure ledger records."
  },
  {
    id: "faq-new-coupon-fail",
    question: "Coupon code is not working.",
    answer: "A coupon might fail if: (1) the code has expired, (2) it has already been redeemed on your account, or (3) you do not meet the criteria (e.g., minimum package price). Double-check the exact spelling, or ping our agent so we can check the coupon system live and solve it!"
  },
  {
    id: "faq-new-bonus-all",
    question: "Can I use bonuses on all games?",
    answer: "Most of our promotional bonuses and loyalty tokens are valid across all game titles! However, select slot or specialty titles might have distinct playthrough contributions or restriction terms. Please refer to our promotional terms sheet for specific games."
  },
  {
    id: "faq-new-spin-disabled",
    question: "My balance shows enough tokens but the spin button is greyed out.",
    answer: "First, check whether you are trying to play with Game Tokens or Sweep Tokens, as they use separate balances. If the spin button is greyed out, you may need to reduce your selected coin bet size to match your current active wallet sub-balance, or refresh the game tab."
  },
  {
    id: "faq-new-trigger-bonus",
    question: "How do I trigger the bonus round in a slot game?",
    answer: "In most games, triggering the exhilarating bonus round requires landing a specific set of 3 or more 'Scatter' or bonus symbols on adjacent reels! Some games also offer a 'feature buy' option where you can unlock it instantly."
  }
];

export default function CasinoSupportDesk() {
  // Casino Settings State
  const [casinoName, setCasinoName] = useState(() => {
    return localStorage.getItem("CASINO_BOT_NAME") || "Grand Roll Casino";
  });
  const [agentPersonality, setAgentPersonality] = useState(() => {
    return localStorage.getItem("CASINO_BOT_PERSONALITY") || "Professional VIP Concierge";
  });
  const [agentName, setAgentName] = useState(() => {
    return localStorage.getItem("CASINO_BOT_AGENT_NAME") || "Alex";
  });

  // Custom Sample Questions / FAQs state
  const [faqs, setFaqs] = useState<FAQItem[]>(() => {
    const saved = localStorage.getItem("CASINO_BOT_FAQS_V2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_CASINO_FAQS;
  });

  // FAQ input state
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [faqError, setFaqError] = useState("");

  // Left column active navigation mode
  const [leftTab, setLeftTab] = useState<"faqs" | "policy" | "roleplay">("faqs");

  // Interactive AI Roleplay states
  const [isRoleplayActive, setIsRoleplayActive] = useState<boolean>(false);
  const [selectedPersona, setSelectedPersona] = useState<PlayerPersona>(RUNTIME_PLAYER_PERSONAS[0]);
  const [isPlayerGenerating, setIsPlayerGenerating] = useState<boolean>(false);
  const [roleplayReaction, setRoleplayReaction] = useState<string>("Satisfied");
  const [roleplaySatisfaction, setRoleplaySatisfaction] = useState<number | null>(null);
  const [autoAdvanceMode, setAutoAdvanceMode] = useState<boolean>(false);

  // Chat simulator state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("CASINO_BOT_CHAT_V1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Non-modal sandbox-friendly confirmation states
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [confirmResetFaqs, setConfirmResetFaqs] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Sync settings & FAQs to localStorage
  useEffect(() => {
    localStorage.setItem("CASINO_BOT_NAME", casinoName);
    localStorage.setItem("CASINO_BOT_PERSONALITY", agentPersonality);
    localStorage.setItem("CASINO_BOT_AGENT_NAME", agentName);
  }, [casinoName, agentPersonality, agentName]);

  useEffect(() => {
    localStorage.setItem("CASINO_BOT_FAQS_V2", JSON.stringify(faqs));
  }, [faqs]);

  useEffect(() => {
    localStorage.setItem("CASINO_BOT_CHAT_V1", JSON.stringify(messages));
  }, [messages]);

  // Handle adding custom Q&A / FAQ to knowledge base
  const handleAddFAQ = (e: React.FormEvent) => {
    e.preventDefault();
    setFaqError("");
    if (!newQuestion.trim() || !newAnswer.trim()) {
      setFaqError("Please enter both a search/sample question and its satisfied response.");
      return;
    }

    const item: FAQItem = {
      id: "custom-" + Date.now(),
      question: newQuestion.trim(),
      answer: newAnswer.trim()
    };

    setFaqs((prev) => [...prev, item]);
    setNewQuestion("");
    setNewAnswer("");
  };

  const handleDeleteFAQ = (id: string) => {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  };

  const handleResetFAQs = () => {
    if (!confirmResetFaqs) {
      setConfirmResetFaqs(true);
      // Auto reset the confirmation state if they don't click again in 4 seconds
      setTimeout(() => setConfirmResetFaqs(false), 4000);
    } else {
      setFaqs(DEFAULT_CASINO_FAQS);
      setConfirmResetFaqs(false);
    }
  };

  // Launch simulated checkout question
  const triggerSampleTestQuestion = (question: string) => {
    setInputValue(question);
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 50);
  };

  // Handle support ticketing chat submit
  const handleSendPrompt = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    
    const userText = (customPrompt || inputValue).trim();
    if (!userText || isLoading) return;

    if (!customPrompt) {
      setInputValue("");
    }

    const userMsg: ChatMessage = {
      id: "player-msg-" + Date.now(),
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setIsLoading(true);

    try {
      const response = await fetch("/api/casino/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMsgs.map(m => ({ role: m.role, content: m.content })),
          userLatestMessage: userText,
          faqs: faqs,
          personality: `${agentName} - ${agentPersonality}`,
          casinoName: casinoName
        })
      });

      if (!response.ok) {
        throw new Error("The player support server desk returned an error.");
      }

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: "agent-msg-" + Date.now(),
        role: "assistant",
        content: data.reply || "An agent will connect in a prompt second.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        evaluation: data.evaluation || {
          csat: 90,
          status: "Resolved",
          confidence: 90,
          escalationRequired: false,
          operatorActionTips: "Handled user query cleanly via preset heuristics.",
          suggestedFollowUp: ["Would you like to speak to an active concierge manager?"]
        }
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const errAssistantMsg: ChatMessage = {
        id: "agent-msg-err-" + Date.now(),
        role: "assistant",
        content: "I apologize, but I am having trouble connecting to my central support desk logs right now. Rest assured our team is monitoring and looking out for you!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        evaluation: {
          csat: 50,
          status: "Pending Connection",
          confidence: 50,
          escalationRequired: true,
          operatorActionTips: "Network gateway limits. Advised player clearly while our tech experts look into this.",
          suggestedFollowUp: ["Try repeating my question in a few seconds.", "Speak immediately to core admin."]
        }
      };
      setMessages((prev) => [...prev, errAssistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerPlayerResponse = async (currentMessages: ChatMessage[]) => {
    if (isPlayerGenerating || isLoading) return;
    setIsPlayerGenerating(true);
    setRoleplayReaction("Player is thinking...");
    
    try {
      const response = await fetch("/api/casino/roleplay-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
          playerPersona: `${selectedPersona.name}: ${selectedPersona.description}`,
          casinoName: casinoName
        })
      });

      if (!response.ok) {
        throw new Error("Roleplay player service returned error");
      }

      const resData = await response.json();
      
      const newPlayerMsg: ChatMessage = {
        id: "player-roleplay-" + Date.now(),
        role: "user",
        content: resData.content || "Alright, thanks for that information.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setRoleplayReaction(resData.reactionState || "Satisfied");
      setRoleplaySatisfaction(resData.satisfactionScore !== undefined ? resData.satisfactionScore : 85);

      const nextMessages = [...currentMessages, newPlayerMsg];
      setMessages(nextMessages);

      // Instantly trigger support agent response to this custom simulated player text
      setIsLoading(true);
      const agentRes = await fetch("/api/casino/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
          userLatestMessage: resData.content,
          faqs: faqs,
          personality: `${agentName} - ${agentPersonality}`,
          casinoName: casinoName
        })
      });

      if (!agentRes.ok) throw new Error("Agent response api failed");

      const agentData = await agentRes.json();
      const assistantMsg: ChatMessage = {
        id: "agent-msg-" + Date.now(),
        role: "assistant",
        content: agentData.reply || "I apologize, let me check the core ledger database further.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        evaluation: agentData.evaluation || {
          csat: 90,
          status: "Resolved",
          confidence: 90,
          escalationRequired: false,
          operatorActionTips: "Resolved player concern cleanly. Preserving sweeps rules.",
          suggestedFollowUp: []
        }
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.error("Player response roleplay simulation failed:", e);
    } finally {
      setIsPlayerGenerating(false);
      setIsLoading(false);
    }
  };

  // Continuous Autoplay roleplay hook
  useEffect(() => {
    let timer: any;
    if (autoAdvanceMode && isRoleplayActive && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant" && !isLoading && !isPlayerGenerating) {
        timer = setTimeout(() => {
          handleTriggerPlayerResponse(messages);
        }, 2200);
      }
    }
    return () => clearTimeout(timer);
  }, [messages, autoAdvanceMode, isRoleplayActive, isLoading, isPlayerGenerating]);

  // Start roleplay session
  const startRoleplaySession = (persona: PlayerPersona) => {
    setSelectedPersona(persona);
    setIsRoleplayActive(true);
    setRoleplayReaction("Awaiting Agent Response...");
    setRoleplaySatisfaction(null);
    
    // Clear previous log and initialize with the selected Persona's initialQuestion
    const initPlayerMsg: ChatMessage = {
      id: "player-init-" + Date.now(),
      role: "user",
      content: persona.initialQuestion,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages([initPlayerMsg]);
    setIsLoading(true);

    fetch("/api/casino/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [initPlayerMsg].map(m => ({ role: m.role, content: m.content })),
        userLatestMessage: persona.initialQuestion,
        faqs: faqs,
        personality: `${agentName} - ${agentPersonality}`,
        casinoName: casinoName
      })
    })
    .then(async (res) => {
      if (!res.ok) throw new Error();
      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: "agent-init-" + Date.now(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        evaluation: data.evaluation
      };
      setMessages([initPlayerMsg, assistantMsg]);
    })
    .catch(() => {
      const fallbackMsg: ChatMessage = {
        id: "agent-init-err-" + Date.now(),
        role: "assistant",
        content: "Hi. I'm sorry, I had general troubles checking with the server database. Can you repeat that task?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages([initPlayerMsg, fallbackMsg]);
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  const handleClearHistory = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      // Auto reset the confirmation state if they don't click again in 4 seconds
      setTimeout(() => setConfirmClear(false), 4000);
    } else {
      setMessages([]);
      setConfirmClear(false);
    }
  };

  // Get active stats from current chat context
  const lastBotMessage = [...messages].reverse().find(m => m.role === "assistant");
  const activeRating = lastBotMessage?.evaluation?.csat || 100;
  const activeStatus = lastBotMessage?.evaluation?.status || "Ready / Awaiting Player";
  const activeConfidence = lastBotMessage?.evaluation?.confidence || 100;
  const activeTips = lastBotMessage?.evaluation?.operatorActionTips || "No query evaluated yet. Ask a question to view diagnostic insights.";
  const activeFollowUps = lastBotMessage?.evaluation?.suggestedFollowUp || [];

  return (
    <div className="space-y-6">
      
      {/* HEADER EXPLANATION CARD */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-6 shadow-md shadow-emerald-50 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl"></div>
        <div className="max-w-3xl space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-[10px] font-mono uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            Casino Player Support Workspace
          </div>
          <h2 className="text-xl font-display font-black tracking-tight sm:text-2xl">
            Satisfying Player Support Chatbot Playground
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
            Need to guarantee a highly <strong>satisfied answer</strong> for gambling players? Here, you can upload your custom sample Q&amp;As, calibrate your virtual helpdesk team, and instantly trigger conversational tests.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: FAQ MANAGER AND KNOWLEDGE BASE */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* CALIBRATION PARAMETERS CARD */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
            <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              1. Calibrate Support Presence
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Casino Platform Name</label>
                <input 
                  type="text" 
                  value={casinoName}
                  onChange={(e) => setCasinoName(e.target.value)}
                  placeholder="E.g., Grand Spin Casino" 
                  className="w-full text-xs font-medium border border-slate-200 bg-slate-50 rounded-lg p-2 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Virtual Agent Name</label>
                <input 
                  type="text" 
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="E.g., Emma / concierge" 
                  className="w-full text-xs font-medium border border-slate-200 bg-slate-50 rounded-lg p-2 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Support Persona Profile</label>
              <select 
                value={agentPersonality}
                onChange={(e) => setAgentPersonality(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-200 bg-slate-50 rounded-lg p-2 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
              >
                <option value="Professional VIP Concierge">Professional VIP Concierge (Polite, rewarding, high-end care)</option>
                <option value="Friendly Customer Advocate">Friendly Customer Advocate (Cheerful, empathetic, soft words)</option>
                <option value="Strict Technical Compliance Specialist">Strict Technical Compliance Specialist (Precise, policy-driven, clear logic)</option>
                <option value="Prompt Cashier Supervisor">Prompt Cashier Supervisor (Action-oriented, transactional, security-focused)</option>
              </select>
            </div>
          </div>

          {/* TAB switcher buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5">
            <button
              onClick={() => setLeftTab("faqs")}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                leftTab === "faqs"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>FAQ Database ({faqs.length})</span>
            </button>
            <button
              onClick={() => setLeftTab("policy")}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                leftTab === "policy"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Policy Terms</span>
            </button>
            <button
              onClick={() => setLeftTab("roleplay")}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                leftTab === "roleplay"
                  ? "bg-white text-indigo-600 shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>Roleplay Setup</span>
            </button>
          </div>

          {/* UPLOAD & ADD SAMPLE QUESTIONS */}
          {leftTab === "faqs" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  2. Upload Sample FAQ Questions
                </h3>
                <button 
                  onClick={handleResetFAQs}
                  type="button"
                  className={`text-[10px] font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded transition ${
                    confirmResetFaqs 
                      ? "text-rose-600 bg-rose-50 border border-rose-150 animate-pulse shadow-sm" 
                      : "text-emerald-600 hover:bg-emerald-50 hover:underline"
                  }`}
                >
                  <RotateCcw className="w-3 h-3 text-current" />
                  {confirmResetFaqs ? "Sure? Click again to reset!" : "Restore Default"}
                </button>
              </div>

              <p className="text-slate-500 text-[11px] leading-relaxed">
                Define the exact sample support questions your players usually ask. When a player talks about these topics, our Gemini bot will match their intent and supply a 100% satisfied answer using your data!
              </p>

              <form onSubmit={handleAddFAQ} className="space-y-3 p-3 bg-slate-50 rounded-xl">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Sample Question / Keyword</label>
                  <input 
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="E.g., How to get my cashback bonus?"
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Your Satisfying Response Answer</label>
                  <textarea 
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="E.g., We issue a guaranteed 10% cashback matched on your net slot losses every single Monday morning by 9 AM UTC. Play safe!"
                    rows={2}
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-hidden focus:border-emerald-500 resize-none leading-relaxed"
                  />
                </div>

                {faqError && (
                  <p className="text-[10px] font-semibold text-rose-500">{faqError}</p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add to FAQ Database
                  </button>
                </div>
              </form>

            {/* LIST OF CURRENT FAQS */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Loaded FAQs ({faqs.length})</span>
              
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                {faqs.map((faq, index) => (
                  <div key={faq.id} className="pt-2 first:pt-0 group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <h4 className="text-[11.5px] font-bold text-slate-800 flex items-center gap-1.5 text-left leading-snug">
                          <span className="text-emerald-600 text-[10px] font-mono">Q{index + 1}.</span>
                          {faq.question}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed pl-4">
                          {faq.answer}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteFAQ(faq.id)}
                        className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {faqs.length === 0 && (
                  <div className="text-center p-6 bg-slate-50 rounded-xl text-slate-400 text-xs">
                    No FAQs loaded. Add a custom sample question above or restore default settings to test.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

          {leftTab === "policy" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4 text-left"
            >
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-emerald-600 font-mono font-bold uppercase tracking-wider block">Official Guidelines</span>
                  <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Redemption Policy Terms
                  </h3>
                </div>
                <div className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-mono text-slate-500 uppercase font-bold">
                  Active
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 max-h-[460px] overflow-y-auto pr-1">
                {/* Rule Item 1 */}
                <div className="space-y-1 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-emerald-700 font-mono tracking-wider uppercase block">Point Value exchange Rate</span>
                  <p className="leading-relaxed text-slate-700 text-[11px]">
                    Each <strong>Prize Point</strong> won through valid sweepstakes play is redeemable for real prizes at an equivalent of <strong>US$1.00 per point</strong>. Only Sweep Tokens can be redeemed for prizes; standard Game Tokens and promotion Sweeps Tokens carry zero monetary value and can never be redeemed.
                  </p>
                </div>

                {/* Rule Item 2 */}
                <div className="space-y-1 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-emerald-700 font-mono tracking-wider uppercase block">1x Play-Through Criteria</span>
                  <p className="leading-relaxed text-slate-700 text-[11px]">
                    Sweeps Tokens allocated to a player as promotional loyalty rewards are required to be <strong>played (wagered) at least once</strong> (1x rollover) before becoming eligible to win redeemable Sweep Tokens. 
                  </p>
                </div>

                {/* Rule Item 3 */}
                <div className="space-y-1 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-emerald-700 font-mono tracking-wider uppercase block">Approved Geographies &amp; Age</span>
                  <p className="leading-relaxed text-slate-700 text-[11px]">
                    Players must be legal permanent residents of the <strong>United States</strong> or <strong>Canada</strong> who are at least <strong>18 years old</strong> (or age of majority in region).
                  </p>
                  <div className="text-[10.5px] text-rose-600 font-mono mt-1 space-y-0.5 p-1.5 bg-rose-50/60 rounded border border-rose-100">
                    <div className="font-bold uppercase text-[9px] text-rose-700 mb-0.5">EXCLUDED JURISDICTIONS:</div>
                    <div>❌ US States: WA, ID, NV, DE, MT, NY, CT, NJ, CA, TN, MI</div>
                    <div>❌ Canada Provinces: Quebec</div>
                  </div>
                </div>

                {/* Rule Item 4 */}
                <div className="space-y-1 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-emerald-700 font-mono tracking-wider uppercase block">Disbursement &amp; Currency Rules</span>
                  <p className="leading-relaxed text-slate-700 text-[11px]">
                    Monetary redemptions are processed in the native currency of the player's residence (either <strong>Canadian Dollars CAD</strong> or <strong>U.S. Dollars USD</strong>) to the original account/wallet used for purchases. Sponsor is not liable for conversion fees or currency fluctuations.
                  </p>
                </div>

                {/* Rule Item 5 */}
                <div className="space-y-1 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-emerald-700 font-mono tracking-wider uppercase block">Non-Transferability</span>
                  <p className="leading-relaxed text-slate-700 text-[11px]">
                    Game Tokens, Sweeps Tokens, and Sweep Tokens are strictly non-transferable between different player accounts and cannot be substituted or gifted.
                  </p>
                </div>

                {/* Raw block clip */}
                <div className="bg-slate-900 text-slate-300 p-3 rounded-xl space-y-1.5 border border-slate-950 font-mono text-[9px] text-left">
                  <span className="text-[10px] text-amber-400 font-bold block flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    LEGAL REDEMPTION POLICY MEMO
                  </span>
                  <div className="max-h-24 overflow-y-auto leading-normal whitespace-pre-wrap select-all">
                    {`Game Tokens used to play games and Sweeps Tokens used to participate in sweepstakes can never be redeemed for real prizes. Only Sweep Tokens can be redeemed for prizes of value.\n\nEach Prize Point won qualifies at US$1.00.\n\nUnless Sponsor requires otherwise, Sweeps Tokens must be played at least once (1x rollover) before eligible to win redeemable Sweep Tokens.`}
                  </div>
                  <span className="text-[8px] text-slate-500 italic block">Double-click or drag-select text above to copy.</span>
                </div>
              </div>
            </motion.div>
          )}

          {leftTab === "roleplay" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4 text-left"
            >
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-indigo-600 font-mono font-bold uppercase tracking-wider block">Interactive Testing Suite</span>
                  <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-500" />
                    AI Player Roleplay Arena
                  </h3>
                </div>
                <div className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${isRoleplayActive ? "bg-indigo-100 text-indigo-800 border border-indigo-200" : "bg-slate-100 text-slate-500"}`}>
                  {isRoleplayActive ? "Active" : "Idle"}
                </div>
              </div>

              <p className="text-slate-500 text-[11px] leading-relaxed">
                Choose a customer roleplay persona below to test your support agent's speed, knowledge accuracy, and compliance safeguards in a realistic, multi-turn conversation simulation!
              </p>

              {/* Persona Grid Selector */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">1. Select Player Persona</span>
                <div className="grid grid-cols-1 gap-1.5">
                  {RUNTIME_PLAYER_PERSONAS.map((persona) => {
                    const isSelected = selectedPersona.id === persona.id;
                    return (
                      <button
                        key={persona.id}
                        onClick={() => setSelectedPersona(persona)}
                        type="button"
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isSelected 
                            ? "bg-slate-950 border-slate-950 shadow-sm text-white" 
                            : "bg-slate-50/60 hover:bg-slate-100 border-slate-100 text-slate-700"
                        }`}
                      >
                        <div className="flex gap-2.5 items-center">
                          <span className={`w-6 h-6 rounded-md font-mono font-extrabold text-[10px] flex items-center justify-center shrink-0 ${persona.avatarBg}`}>
                            {persona.avatar}
                          </span>
                          <div className="space-y-0.5 min-w-0">
                            <h5 className={`text-[11px] font-bold ${isSelected ? "text-white" : "text-slate-800"} truncate`}>
                              {persona.name}
                            </h5>
                            <p className={`text-[10px] leading-normal ${isSelected ? "text-slate-300" : "text-slate-500"} truncate`}>
                              {persona.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bot Control Options */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">2. Conversation Mode</span>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 font-sans">
                    <label className="text-xs font-bold text-slate-700 block">Autonomous Simulation</label>
                    <span className="text-[9.5px] text-slate-500 block leading-tight">Continuous, self-playing back-and-forth cycle</span>
                  </div>
                  <button
                    onClick={() => setAutoAdvanceMode(!autoAdvanceMode)}
                    type="button"
                    className={`px-2.5 py-1 text-[10.5px] font-bold rounded-lg transition shrink-0 ${
                      autoAdvanceMode 
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                        : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                    }`}
                  >
                    {autoAdvanceMode ? "ON (Autoplay)" : "OFF (Manual)"}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => startRoleplaySession(selectedPersona)}
                type="button"
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                Launch Persona Challenge Session
              </button>
              
              {isRoleplayActive && (
                <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100 space-y-1.5 text-[11px] shrink-0">
                  <div className="flex items-center justify-between text-indigo-900 font-bold">
                    <span>Active Engagement Status</span>
                    <span className="font-mono text-[9px] bg-indigo-100 px-1.5 py-0.5 rounded uppercase">Live Track</span>
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <div>👤 Player Mood: <strong className="text-indigo-800 uppercase text-[9.5px] tracking-wide">{roleplayReaction || "Analyzing..."}</strong></div>
                    {roleplaySatisfaction !== null && (
                      <div className="flex items-center gap-1.5">
                        <span>🌟 Player Satisfaction:</span>
                        <span className={`font-mono font-bold ${roleplaySatisfaction >= 80 ? "text-emerald-600" : "text-rose-600"}`}>
                          {roleplaySatisfaction}/100 CSAT
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* RIGHT COLUMN: INTERACTIVE CHAT SIMULATOR AND AI CSAT EVALUATOR */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
            
            {/* MAIN PLAYGROUND CHAT BOX (8 Columns) */}
            <div className="sm:col-span-12 lg:col-span-7 bg-slate-950 text-slate-100 rounded-2xl border border-slate-900 shadow-xl overflow-hidden flex flex-col h-[520px]">
              
              {/* Simulator Header */}
              <div className="bg-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-wide uppercase font-mono">{casinoName} desk</h4>
                    <p className="text-[10px] text-slate-400">{agentName} is active ({agentPersonality})</p>
                  </div>
                </div>

                <button 
                  onClick={handleClearHistory}
                  className={`text-[10px] border px-2 py-0.5 rounded transition font-medium ${
                    confirmClear 
                      ? "bg-rose-950/40 text-rose-300 border-rose-800 hover:bg-rose-900/60 animate-pulse" 
                      : "text-slate-400 hover:text-rose-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {confirmClear ? "Click again to confirm!" : "Clear Chat"}
                </button>
              </div>

              {/* Chat Message Scroll */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Simulated Welcome */}
                <div className="flex items-start gap-2.5 max-w-[85%] bg-slate-900/40 p-3 rounded-2xl border border-slate-900/60">
                  <div className="h-6 w-6 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-900/50 flex items-center justify-center text-[10px] font-mono shrink-0">
                    AI
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 uppercase font-mono block">System Greetings</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Welcome to the player concierge terminal! I am calibrated on your <strong>{faqs.length} FAQ categories</strong> for <strong>{casinoName}</strong>. 
                      Type or tap a preset question down below to test how satisfied the answer is!
                    </p>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start gap-2.5 max-w-[90%] ${
                        m.role === "user" ? "ml-auto flex-row-reverse text-right" : "text-left"
                      }`}
                    >
                      <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-mono shrink-0 ${
                        m.role === "user" 
                          ? "bg-indigo-950 text-indigo-400 border border-indigo-900/50" 
                          : "bg-emerald-950 text-emerald-400 border border-emerald-900/50"
                      }`}>
                        {m.role === "user" ? "PL" : "AG"}
                      </div>
                      
                      <div className={`space-y-1 bg-slate-900/80 p-3 rounded-2xl border text-left ${
                        m.role === "user" 
                          ? "border-slate-800/60 bg-slate-900/40" 
                          : "border-slate-800 bg-slate-900"
                      }`}>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[8px] tracking-wider text-slate-500 uppercase font-mono">
                            {m.role === "user" ? "Player" : `${agentName} (${agentName})`}
                          </span>
                          <span className="text-[8px] text-slate-600 font-mono">{m.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{m.content}</p>

                        {/* CSAT pill feedback in message directly only for assistant */}
                        {m.role === "assistant" && m.evaluation && (
                          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            <span className="text-[9px] text-slate-500 font-mono">CSAT Score:</span>
                            <span className={`text-[10px] font-mono font-bold ${
                              m.evaluation.csat >= 90 
                                ? "text-emerald-400 bg-emerald-950/40 px-1.5 py-0.2 rounded" 
                                : "text-amber-400 bg-amber-955/40 px-1.5 py-0.2 rounded"
                            }`}>
                              {m.evaluation.csat}% Satisfied
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isLoading && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                    <span>{agentName} is formulating satisfying reply...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Sample Preloaded Test Trigger Buttons */}
              <div className="bg-slate-900/45 p-2.5 border-t border-slate-800/85">
                <span className="text-[9px] font-bold text-slate-400 block uppercase font-mono mb-1.5">Preset Player Questions (Tap to copy/test)</span>
                <div className="flex flex-wrap gap-1.5 h-14 overflow-y-auto pr-1">
                  {faqs.map(f => (
                    <button
                      key={f.id}
                      onClick={() => triggerSampleTestQuestion(f.question)}
                      type="button"
                      className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-2 py-1 rounded-md text-left truncate max-w-[220px]"
                      title={f.question}
                    >
                      {f.question}
                    </button>
                  ))}

                  {faqs.length === 0 && (
                    <span className="text-[10px] text-slate-500 italic">No custom presets loaded yet. Add custom Q&amp;As.</span>
                  )}
                </div>
              </div>

              {/* Active Roleplay helper controls banner */}
              {isRoleplayActive && (
                <div className="bg-slate-900/95 border-t border-slate-800 px-3 py-2 flex items-center justify-between text-[11px] gap-2">
                  <div className="flex items-center gap-1.5 text-slate-300 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shrink-0"></span>
                    <span className="truncate">Roleplay: <strong className="text-white">{selectedPersona.name}</strong> is awaiting responses</span>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleTriggerPlayerResponse(messages)}
                      type="button"
                      disabled={isPlayerGenerating || isLoading}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition"
                    >
                      {isPlayerGenerating ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Player typing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-2.5 h-2.5 text-indigo-200" />
                          <span>Simulate Play Turn</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setAutoAdvanceMode(!autoAdvanceMode)}
                      type="button"
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition font-mono ${
                        autoAdvanceMode 
                          ? "bg-indigo-950 border border-indigo-750 text-indigo-300" 
                          : "bg-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {autoAdvanceMode ? "Auto-Play ON" : "Manual"}
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Input form */}
              <form onSubmit={(e) => handleSendPrompt(e)} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                <input 
                  ref={chatInputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Ask a question (e.g. Can you process my payout?)`}
                  className="flex-1 bg-slate-950 text-xs text-white border border-slate-800 focus:outline-hidden focus:border-emerald-600 rounded-xl p-3 leading-relaxed"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-xl transition shadow shadow-emerald-950 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>

            {/* AI DIAGNOSTICS & CSAT ANALYZER GAUGE (5 Columns) */}
            <div className="sm:col-span-12 lg:col-span-5 space-y-6">
              
              {/* ACTIVE RUNTIME METRICS PANELS */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-[10px] text-slate-400 font-mono block">SIMULATED AGENT EVALUATION</span>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Active Ticket Diagnostics</h4>
                </div>

                {/* CSAT radial meter gauge */}
                <div className="text-center py-2 relative flex flex-col items-center justify-center">
                  <div className="h-28 w-28 rounded-full border-8 border-slate-100 flex flex-col items-center justify-center relative">
                    {/* Simulated visual colored ring based on rating */}
                    <div 
                      className={`absolute inset-0 rounded-full border-8 opacity-70 ${
                        activeRating >= 90 
                          ? "border-emerald-500" 
                          : activeRating >= 75 
                            ? "border-amber-400" 
                            : "border-rose-500"
                      }`}
                      style={{ clipPath: `polygon(50% 50%, -50% -50%, ${activeRating}% -50%)` }}
                    ></div>
                    <span className="text-2xl font-display font-black text-slate-800 mt-1">{activeRating}%</span>
                    <span className="text-[8px] uppercase tracking-widest font-mono text-slate-400">CSAT Score</span>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-500 mt-4">
                    Predicted Player Satisfaction Level
                  </span>
                  
                  {activeRating >= 90 ? (
                    <span className="text-[10px] text-emerald-600 font-extrabold uppercase mt-0.5 tracking-wider font-mono">
                      "Highly Satisfied Answer"
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-500 font-extrabold uppercase mt-0.5 tracking-wider font-mono">
                      "Needs Operator Calibration"
                    </span>
                  )}
                </div>

                {/* Ticket Status Parameters */}
                <div className="space-y-3.5 pt-1">
                  
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Resolution Status:</span>
                    <span className={`text-[10.5px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                      activeStatus === "Resolved" 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                        : activeStatus === "Pending" 
                          ? "bg-amber-50 text-amber-700 border border-amber-100" 
                          : activeStatus === "Ticket Raised" || activeStatus.includes("Escalated")
                            ? "bg-rose-50 text-rose-700 border border-rose-100 shadow-sm animate-pulse"
                            : "bg-slate-50 text-slate-600 border border-slate-100"
                    }`}>
                      {activeStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Intent Accuracy:</span>
                    <span className="text-[11px] font-bold text-slate-800 font-mono">
                      {activeConfidence}% accuracy match
                    </span>
                  </div>

                  {/* AI Operator tips box */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <BookmarkCheck className="w-3 h-3 text-emerald-600" />
                      Satisfaction Calibration Tip
                    </span>
                    <p className="text-slate-700 italic text-[11px] leading-relaxed">
                      "{activeTips}"
                    </p>
                  </div>
                </div>

                {/* Simulated follow-up triggers */}
                {activeFollowUps.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Suggested Player Buttons</span>
                    <div className="space-y-1.5">
                      {activeFollowUps.map((btn, i) => (
                        <button
                          key={i}
                          onClick={() => triggerSampleTestQuestion(btn)}
                          className="w-full text-left text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg p-2 text-slate-600 hover:text-emerald-700 transition font-medium flex items-center justify-between"
                        >
                          <span>{btn}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* SECURITY ASSURANCES PORTAL */}
              <div className="bg-slate-900 text-slate-300 rounded-2xl border border-slate-950 p-4 shrink-0 shadow-sm space-y-3">
                <h4 className="text-[11px] font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-500" />
                  Operator Core Policy Safeguards
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed leading-normal">
                  Our casino support engine runs in a secure sandboxed sandbox environment. It enforces responsible limits, prevents unauthorized account modifications, safeguards payouts, and avoids false promotion claims while maximizing client positive reviews.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono uppercase bg-slate-950/50 p-2.5 rounded border border-slate-800">
                  <div className="text-emerald-400">✔ KYC COMPLIANT</div>
                  <div className="text-emerald-400">✔ ENFORCED RESP PLAY</div>
                  <div className="text-emerald-400">✔ SECURED WITHDRAWAL</div>
                  <div className="text-emerald-400">✔ GUARANTEED T&amp;C INTEGRITY</div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
