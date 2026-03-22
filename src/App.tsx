import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';
import { Flame, Target, Clock, Share2, Lock, ArrowRight, Loader2, User, Sparkles, Shield, Search, Twitter, Instagram, Youtube, Mail, Menu, Download, Smartphone } from 'lucide-react';
import Modal from './components/Modal';
import Chatbot from './components/Chatbot';
import AdminDashboard from './components/AdminDashboard';
import { getSettings, incrementVisits, incrementClicks, addFeedback, incrementRoasts, incrementProUnlocks } from './lib/store';
import { jobList, jobCategories } from './lib/jobs';
import html2canvas from 'html2canvas';

const generateWithRetry = async (modelName: string, contents: string, config: any, maxRetries = 3) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const settings = getSettings();
      const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config,
      });
      return response;
    } catch (error: any) {
      attempt++;
      console.error(`API connection error (Attempt ${attempt}/${maxRetries}):`, error);
      if (attempt >= maxRetries) {
        throw new Error(`Failed to connect to the AI model: ${error?.message || error}`);
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

interface RoadmapDay {
  day: number;
  task: string;
  book?: string;
}

interface FreeResultData {
  type: 'free';
  roast: string;
  roadmap: RoadmapDay[];
  proTip: string;
  shareText: string;
}

interface ProResultData {
  type: 'pro';
  savageRoast: string;
  proRoadmap: RoadmapDay[];
  resources: { title: string; description: string }[];
  habitTracker: string[];
  expertAdvice: string;
  shareText: string;
}

type ResultData = FreeResultData | ProResultData;

export default function App() {
  const [name, setName] = useState('');
  const [dreamJob, setDreamJob] = useState('');
  const [socialMediaHours, setSocialMediaHours] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [isProUnlocked, setIsProUnlocked] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New State
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [settings, setSettings] = useState({ 
    price: 9, 
    roastMode: 'Savage', 
    razorpayLink: '',
    adSenseId: '',
    customAdImageUrl: '',
    customAdLink: '',
    instagramUrl: '',
    twitterUrl: '',
    youtubeUrl: '',
    showAnnouncement: false,
    announcementText: '',
    announcementUrl: '',
    customModules: [] as { id: string, title: string, content: string }[]
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showJobSuggestions, setShowJobSuggestions] = useState(false);
  const [user, setUser] = useState<{name: string, email: string} | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [loginForm, setLoginForm] = useState({ name: '', email: '' });
  
  // New State for Tutorial and Feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAppDownload, setShowAppDownload] = useState(false);
  const [showProBenefits, setShowProBenefits] = useState(false);
  const [showPaymentVerification, setShowPaymentVerification] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    // Check if app is running in standalone mode (installed PWA)
    const checkStandalone = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsStandalone(true);
      } else {
        setIsStandalone(false);
      }
    };
    
    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  useEffect(() => {
    incrementVisits();
    setSettings(getSettings());
    const savedUser = localStorage.getItem('app_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setName(parsed.name);
    }
  }, []);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackText.trim()) {
      addFeedback(feedbackText, user?.name);
      setFeedbackText('');
      setShowFeedback(false);
      // Optional: Show a success toast here
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.name && loginForm.email) {
      setUser(loginForm);
      setName(loginForm.name);
      localStorage.setItem('app_user', JSON.stringify(loginForm));
      setShowLogin(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setName('');
    localStorage.removeItem('app_user');
    setShowProfile(false);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'Admin2026') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      alert('Incorrect password');
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery === 'ADMIN@2026') {
        setSearchQuery('');
        setShowAdminLogin(true);
      }
    }
  };

  const handleGenerateFree = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name || !dreamJob || !socialMediaHours) return;

    setLoading(true);
    setApiError(null);
    try {
      const response = await generateWithRetry(
        'gemini-3-flash-preview',
        `Generate a 'Career Reality Check' for ${name}.
        Their dream goal/job is: ${dreamJob}. (This could be a job, business, or any other goal).
        They spend ${socialMediaHours} hours on social media daily.
        
        IMPORTANT: The entire response (roast, roadmap, pro tip, summary) MUST be in a bilingual format (Hindi + English / Hinglish) so it's easily understood by everyone. Provide the absolute BEST advice tailored to their specific goal, whether it's a job, a business, or anything else.
        
        1. Write a funny, sarcastic, and ${settings.roastMode.toLowerCase()} roast in Hinglish (Hindi + English) about how their social media habits are destroying their chances of achieving their goal. Be brutal but funny.
        2. Provide a clear, serious 7-day roadmap (table of tasks) in Hinglish to help them actually start working toward their goal.
        3. Provide one Career/Business Pro Tip in Hinglish.
        4. Provide a short, punchy summary text for WhatsApp sharing that includes a snippet of the roast in Hinglish.`,
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              roast: {
                type: Type.STRING,
                description: 'The funny, sarcastic, and savage Hinglish roast.',
              },
              roadmap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.INTEGER },
                    task: { type: Type.STRING, description: 'A serious, actionable task for the day.' },
                  },
                  required: ['day', 'task'],
                },
                description: 'The 7-day roadmap.',
              },
              proTip: {
                type: Type.STRING,
                description: 'One Career Pro Tip.',
              },
              shareText: {
                type: Type.STRING,
                description: 'A short, punchy summary text for WhatsApp sharing.',
              },
            },
            required: ['roast', 'roadmap', 'proTip', 'shareText'],
          },
        }
      );

      let dataText = response?.text || '{}';
      dataText = dataText.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(dataText);
      setResult({ type: 'free', ...data });
      incrementRoasts();
    } catch (error: any) {
      console.error('Error generating reality check:', error);
      setApiError(error.message || 'Failed to generate reality check. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePro = async () => {
    if (!name || !dreamJob || !socialMediaHours) return;

    setLoading(true);
    setApiError(null);
    try {
      const response = await generateWithRetry(
        'gemini-3-flash-preview',
        `Act as an Elite Success Mentor. Generate a 30-day "Transformation Journey" for ${name}.
        Their dream goal/job is: ${dreamJob}. (This could be a job, business, or any other goal).
        They spend ${socialMediaHours} hours on social media daily.
        
        Tone: Professional, motivating, and highly valuable. Ensure the value is so high that they feel their ₹9 was the best investment ever. Make it a complete, personalized dossier (poora chitta) of their path so they feel they received a premium, exhaustive blueprint.
        
        IMPORTANT: The entire response MUST be in a bilingual format (Hindi + English / Hinglish) so it's easily understood by everyone. Provide the absolute BEST advice tailored to their specific goal, whether it's a job, a business, or anything else.
        
        1. savageRoast: Write an incredibly savage, brutal roast in Hinglish (Hindi + English) about their social media habits.
        2. proRoadmap: Generate a detailed 30-day Pro roadmap with tasks in Hinglish.
           - Phase 1: Foundation (Day 1-10) - Mindset shifts & Power habits.
           - Phase 2: Action (Day 11-20) - Detailed step-by-step strategy for their specific goal (job/business).
           - Phase 3: Mastery (Day 21-30) - Scaling tips & Elite Book list.
           *MANDATORY VIRAL FEATURE*: On Days 5, 10, 15, 20, 25, and 30, append this exact message to the task string: "🚀 Progress is better together! Share this with a friend to grow as a team!"
           *MANDATORY BOOK FEATURE*: For EVERY SINGLE DAY (Day 1 to 30), provide ONE highly relevant book recommendation ('book' field) related to their specific goal/field. So they get 30 books in 30 days.
        3. resources: A curated "Master Reading List" (Top 3 books). For each book, provide the 'title' (just the book name) and 'description' (a short summary in Hinglish).
        4. habitTracker: Specific "Power Habits" that clear mental fog and increase focus 10x (3-4 habits) in Hinglish.
        5. expertAdvice: Provide elite advice in Hinglish and end with these exact 'Save & Download Instructions' (in English):
           "📥 **Save Your Roadmap:** Since we prioritize your privacy, we do not store your data permanently.
           ✅ **Option 1:** Click 'Print' and select 'Save as PDF' to keep this offline.
           ✅ **Option 2:** Copy the entire text and paste it into your **Google Drive** or **Keep Notes** for lifelong access.
           ✅ **Option 3:** Download this roadmap as a document to refer back anytime.
           For any data deletion requests, email us at zidpath@gmail.com"
        6. shareText: A short, punchy summary text for WhatsApp sharing in Hinglish.`,
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              savageRoast: { type: Type.STRING },
              proRoadmap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.INTEGER },
                    task: { type: Type.STRING },
                    book: { type: Type.STRING, description: "A highly relevant book recommendation for this specific day" },
                  },
                  required: ['day', 'task', 'book'],
                },
              },
              resources: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ['title', 'description'],
                },
              },
              habitTracker: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              expertAdvice: { type: Type.STRING },
              shareText: { type: Type.STRING },
            },
            required: ['savageRoast', 'proRoadmap', 'resources', 'habitTracker', 'expertAdvice', 'shareText'],
          },
        }
      );

      let dataText = response?.text || '{}';
      dataText = dataText.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(dataText);
      setResult({ type: 'pro', ...data });
      incrementRoasts();
    } catch (error: any) {
      console.error('Error generating PRO reality check:', error);
      setApiError(error.message || 'Failed to generate PRO reality check. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayment = () => {
    let url = settings.razorpayLink || "https://razorpay.me/@carriercheckreality9";
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    window.open(url, '_blank');
    setShowProBenefits(false);
    setShowPaymentVerification(true);
  };

  const handleVerifyPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (transactionId.trim().length > 5) {
      setShowPaymentVerification(false);
      incrementProUnlocks();
      setIsProUnlocked(true);
      handleGeneratePro();
      setTransactionId('');
    } else {
      alert('Please enter a valid Transaction ID after completing the payment.');
    }
  };

  const handleAdminBypass = () => {
    if (secretCode === 'ADMIN@2026') {
      incrementProUnlocks();
      setIsProUnlocked(true);
      handleGeneratePro();
      setSecretCode('');
    } else {
      alert('Invalid access code. Please proceed with payment.');
    }
  };

  const handleDownloadRoadmap = async () => {
    const element = document.getElementById('pro-roadmap-card');
    if (!element) return;
    
    const scrollableDiv = element.querySelector('.overflow-y-auto');
    if (scrollableDiv) {
      scrollableDiv.classList.remove('max-h-[500px]', 'overflow-y-auto');
    }

    // Hide download buttons during PNG generation
    const downloadBtns = element.querySelectorAll('button');
    downloadBtns.forEach(btn => btn.style.display = 'none');

    try {
      const canvas = await html2canvas(element, { 
        backgroundColor: '#09090B',
        scale: 2,
        useCORS: true
      });
      
      const data = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = data;
      link.download = 'My_Pro_Roadmap.png';
      link.click();
    } catch (err) {
      console.error('Error downloading roadmap:', err);
      alert('Failed to download roadmap. Please try again.');
    } finally {
      if (scrollableDiv) {
        scrollableDiv.classList.add('max-h-[500px]', 'overflow-y-auto');
      }
      downloadBtns.forEach(btn => btn.style.display = '');
    }
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("App is already installed, or your browser doesn't support this feature. You can also 'Add to Home Screen' from your browser menu.");
    }
    setShowAppDownload(false);
  };

  const handleShare = () => {
    if (!result) return;
    const text = encodeURIComponent(result.shareText);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className={`min-h-screen bg-[#09090B] text-white font-sans selection:bg-[#39FF14] selection:text-black flex flex-col ${!isAdmin && settings.showAnnouncement && settings.announcementText ? 'pt-24 md:pt-28' : 'pt-16 md:pt-20'}`}>
      {/* Header */}
      {!isAdmin && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-[#09090B]/90 backdrop-blur-md border-b border-white/5">
          {settings.showAnnouncement && settings.announcementText && (
            <div className="bg-[#39FF14] text-black text-xs md:text-sm font-bold text-center py-2 px-4">
              {settings.announcementUrl ? (
                <a href={settings.announcementUrl} target="_blank" rel="noreferrer" className="hover:underline">
                  {settings.announcementText}
                </a>
              ) : (
                <span>{settings.announcementText}</span>
              )}
            </div>
          )}
          <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <button onClick={() => { setResult(null); setActiveModal(null); }} className="text-white hover:text-[#39FF14] transition-colors">Home</button>
              <button onClick={() => setActiveModal('About Us')} className="text-zinc-400 hover:text-white transition-colors">About Us</button>
              <button onClick={() => setActiveModal('Contact Us')} className="text-zinc-400 hover:text-white transition-colors">Contact Us</button>
              {user ? (
                <button onClick={() => setShowProfile(true)} className="flex items-center gap-2 text-[#39FF14] hover:text-white transition-colors">
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline">{user.name}</span>
                </button>
              ) : (
                <button onClick={() => setShowLogin(true)} className="text-zinc-400 hover:text-white transition-colors">Login</button>
              )}
            </div>

            {/* Search Bar (Prominent on Mobile) */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="Search roadmaps..."
                  className="w-full bg-[#18181B] border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#04D9FF] focus:ring-1 focus:ring-[#04D9FF] transition-all"
                />
              </div>
            </div>

            {/* Download App Button */}
            {!isStandalone && (
              <button 
                onClick={() => setShowAppDownload(true)}
                className="step-3-download hidden md:flex items-center gap-2 bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 hover:bg-[#39FF14]/20 px-4 py-2 rounded-full text-sm font-bold transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>Get App</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Dropdown */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden border-t border-white/5 bg-[#09090B] overflow-hidden"
              >
                <div className="flex flex-col px-4 py-4 space-y-4 text-sm font-medium">
                  <button onClick={() => { setResult(null); setActiveModal(null); setIsMobileMenuOpen(false); }} className="text-left text-white hover:text-[#39FF14] transition-colors">Home</button>
                  <button onClick={() => { setActiveModal('About Us'); setIsMobileMenuOpen(false); }} className="text-left text-zinc-400 hover:text-white transition-colors">About Us</button>
                  <button onClick={() => { setActiveModal('Contact Us'); setIsMobileMenuOpen(false); }} className="text-left text-zinc-400 hover:text-white transition-colors">Contact Us</button>
                  {user ? (
                    <button onClick={() => { setShowProfile(true); setIsMobileMenuOpen(false); }} className="text-left text-[#39FF14] hover:text-white transition-colors flex items-center gap-2">
                      <User className="w-4 h-4" /> Profile
                    </button>
                  ) : (
                    <button onClick={() => { setShowLogin(true); setIsMobileMenuOpen(false); }} className="text-left text-zinc-400 hover:text-white transition-colors">Login</button>
                  )}
                  {!isStandalone && (
                    <button 
                      onClick={() => { setShowAppDownload(true); setIsMobileMenuOpen(false); }}
                      className="flex items-center gap-2 bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 hover:bg-[#39FF14]/20 px-4 py-2 rounded-lg text-sm font-bold transition-all w-full justify-center mt-2"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Get App</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      )}

      {isAdmin ? (
        <AdminDashboard onLogout={() => setIsAdmin(false)} />
      ) : (
        <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-20">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-[#18181B] rounded-2xl border border-white/10 mb-6 shadow-[0_0_30px_rgba(57,255,20,0.1)]">
            <Flame className="w-8 h-8 text-[#39FF14]" />
          </div>
          <h1 
            className="text-4xl md:text-6xl font-bold font-display tracking-tight mb-4 select-none"
          >
            Career <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39FF14] to-[#04D9FF]">Reality Check</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-xl mx-auto">
            Get roasted for your habits, then get a serious roadmap to actually achieve your dreams.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.form 
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleGenerateFree}
              className="step-1-form bg-[#18181B] rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[#39FF14]/50 to-transparent" />
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#09090B] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-all"
                      placeholder="e.g. Ramanand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">Dream Job</label>
                  <div className="relative">
                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input 
                      type="text" 
                      required
                      value={dreamJob}
                      onChange={(e) => {
                        setDreamJob(e.target.value);
                        setShowJobSuggestions(true);
                      }}
                      onFocus={() => setShowJobSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowJobSuggestions(false), 200)}
                      className="w-full bg-[#09090B] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#04D9FF] focus:ring-1 focus:ring-[#04D9FF] transition-all"
                      placeholder="e.g. Senior Software Engineer"
                    />
                    {showJobSuggestions && (
                      <ul className="absolute z-50 w-full bg-[#18181B] border border-white/10 rounded-xl mt-1 max-h-72 overflow-y-auto shadow-2xl scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        {jobCategories
                          .map(category => ({
                            ...category,
                            jobs: dreamJob 
                              ? category.jobs.filter(job => job.toLowerCase().includes(dreamJob.toLowerCase()))
                              : category.jobs
                          }))
                          .filter(category => category.jobs.length > 0)
                          .map(cat => (
                            <React.Fragment key={cat.category}>
                              <li className="px-4 py-2 text-xs font-bold text-[#39FF14] uppercase tracking-wider bg-[#09090B] sticky top-0 z-10 border-b border-white/5 shadow-sm">
                                {cat.category}
                              </li>
                              {cat.jobs.map(job => (
                                <li 
                                  key={job} 
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => { setDreamJob(job); setShowJobSuggestions(false); }} 
                                  className="px-4 py-3 hover:bg-[#04D9FF]/20 cursor-pointer text-sm text-zinc-300 hover:text-white border-b border-white/5 last:border-0 pl-6"
                                >
                                  {job}
                                </li>
                              ))}
                            </React.Fragment>
                        ))}
                        {dreamJob && jobCategories.every(c => !c.jobs.some(j => j.toLowerCase().includes(dreamJob.toLowerCase()))) && (
                          <li 
                            onClick={() => setShowJobSuggestions(false)}
                            className="px-4 py-3 text-sm text-[#39FF14] hover:bg-[#04D9FF]/20 cursor-pointer border-b border-white/5"
                          >
                            Use "{dreamJob}" (Custom Entry)
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">Daily Social Media (Hours)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input 
                      type="number" 
                      required
                      min="0"
                      max="24"
                      value={socialMediaHours}
                      onChange={(e) => setSocialMediaHours(e.target.value)}
                      className="w-full bg-[#09090B] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF10F0] focus:ring-1 focus:ring-[#FF10F0] transition-all"
                      placeholder="e.g. 4"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-white text-black font-bold text-lg rounded-xl py-4 flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing your life choices...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Get Reality Check
                    </>
                  )}
                </button>
                
                {apiError && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                    {apiError}
                  </div>
                )}
              </div>
            </motion.form>
          ) : result.type === 'free' ? (
            <motion.div 
              key="result-free"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* The Roast */}
              <div className="bg-[#18181B] rounded-3xl p-6 md:p-8 border border-[#FF10F0]/30 shadow-[0_0_40px_rgba(255,16,240,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF10F0]/10 blur-3xl rounded-full" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#FF10F0]/20 rounded-lg text-[#FF10F0]">
                    <Flame className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white">The Roast</h2>
                </div>
                <p className="text-lg md:text-xl leading-relaxed text-zinc-300 italic">
                  "{result.roast}"
                </p>
                
                <button 
                  onClick={handleShare}
                  className="mt-8 w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/20 px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  Share Roast on WhatsApp
                </button>
              </div>

              {/* The Roadmap */}
              <div className="bg-[#18181B] rounded-3xl p-6 md:p-8 border border-[#39FF14]/30 shadow-[0_0_40px_rgba(57,255,20,0.05)]">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-[#39FF14]/20 rounded-lg text-[#39FF14]">
                    <Target className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white">7-Day Basic Roadmap</h2>
                </div>
                
                <div className="space-y-4">
                  {result.roadmap.map((day) => (
                    <div key={day.day} className="flex gap-4 p-4 rounded-2xl bg-[#09090B] border border-white/5 hover:border-[#39FF14]/30 transition-colors group">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#18181B] border border-white/10 flex items-center justify-center font-display font-bold text-[#39FF14] group-hover:scale-110 transition-transform">
                        D{day.day}
                      </div>
                      <div className="flex items-center">
                        <p className="text-zinc-300">{day.task}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Career Pro Tip */}
              <div className="bg-[#18181B] rounded-3xl p-6 md:p-8 border border-[#04D9FF]/30 shadow-[0_0_40px_rgba(4,217,255,0.05)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#04D9FF]/20 rounded-lg text-[#04D9FF]">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-display font-bold text-white">Career Pro Tip</h2>
                </div>
                <p className="text-zinc-300">{result.proTip}</p>
              </div>

              {/* The Hook */}
              <div className="bg-gradient-to-br from-[#18181B] to-[#09090B] rounded-3xl p-8 border border-yellow-400/50 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Lock className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-2xl font-display font-bold text-white mb-2">Unlock the 30-Day Pro Roadmap</h3>
                <p className="text-zinc-400 mb-8">Get the exact blueprint, curated resources, habit tracker, and expert advice to land your dream job.</p>
                
                {!isProUnlocked ? (
                  <div className="flex flex-col items-center gap-4">
                    <a 
                      href={settings.razorpayLink ? (settings.razorpayLink.startsWith('http') ? settings.razorpayLink : `https://${settings.razorpayLink}`) : "https://razorpay.me/@carriercheckreality9"}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowPaymentVerification(true)}
                      style={{ zIndex: 9999, position: 'relative', pointerEvents: 'auto', cursor: 'pointer' }}
                      className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-black font-bold px-8 py-4 rounded-xl hover:bg-yellow-500 transition-colors w-full md:w-auto"
                    >
                      Unlock Pro Version <ArrowRight className="w-5 h-5" />
                    </a>
                    
                    {/* Admin Bypass Input */}
                    <div className="mt-2 flex items-center justify-center gap-2 opacity-30 hover:opacity-100 transition-opacity focus-within:opacity-100">
                      <input
                        type="password"
                        value={secretCode}
                        onChange={(e) => setSecretCode(e.target.value)}
                        placeholder="Secret Code"
                        className="bg-transparent border-b border-zinc-600 text-xs text-center text-zinc-400 focus:outline-none focus:border-yellow-400 w-24"
                      />
                      <button
                        onClick={handleAdminBypass}
                        className="text-xs text-zinc-500 hover:text-yellow-400 transition-colors"
                      >
                        Admin Unlock
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <button 
                      onClick={handleGeneratePro}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-black font-bold px-8 py-4 rounded-xl hover:bg-yellow-500 transition-colors w-full md:w-auto disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      Generate Pro Version
                    </button>
                    {apiError && (
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center w-full max-w-md">
                        {apiError}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="text-center pt-8">
                <button 
                  onClick={() => setResult(null)}
                  className="text-zinc-500 hover:text-white transition-colors underline underline-offset-4 text-sm"
                >
                  I want another reality check
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="result-pro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Pro Roast */}
              <div className="bg-[#18181B] rounded-3xl p-6 md:p-8 border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 blur-3xl rounded-full" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-yellow-400/20 rounded-lg text-yellow-400">
                    <Flame className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white">Savage Roast (Pro)</h2>
                </div>
                <p className="text-lg md:text-xl leading-relaxed text-zinc-300 italic">
                  "{result.savageRoast}"
                </p>
                
                <button 
                  onClick={handleShare}
                  className="mt-8 w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/20 px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  Share Roast on WhatsApp
                </button>
              </div>

              {/* Pro Roadmap Card (Downloadable) */}
              <div id="pro-roadmap-card" className="bg-[#18181B] rounded-3xl p-6 md:p-8 border-2 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)] relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-400/20 rounded-lg text-yellow-400">
                      <Target className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white">30-Day Pro Roadmap</h2>
                  </div>
                  <button 
                    onClick={handleDownloadRoadmap}
                    className="hidden md:flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors text-sm font-bold bg-yellow-400/10 px-4 py-2 rounded-lg"
                  >
                    <Download className="w-4 h-4" /> Download Image
                  </button>
                </div>
                
                <div className="space-y-4 mb-8 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {result.proRoadmap.map((day) => (
                    <div key={day.day} className="flex gap-4 p-4 rounded-2xl bg-[#09090B] border border-white/5 hover:border-yellow-400/30 transition-colors group">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#18181B] border border-white/10 flex items-center justify-center font-display font-bold text-yellow-400 group-hover:scale-110 transition-transform">
                        D{day.day}
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="text-zinc-300 text-sm md:text-base mb-2">{day.task}</p>
                        {day.book && (
                          <div className="flex items-center gap-2 text-xs text-yellow-400/80 bg-yellow-400/10 w-fit px-3 py-1 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                            <span>Book of the Day: {day.book}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-[#09090B] p-6 rounded-2xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#04D9FF]" /> Curated Resources
                    </h3>
                    <ul className="space-y-4">
                      {result.resources.map((res, i) => {
                        const amazonLink = `https://www.amazon.in/s?k=${encodeURIComponent(res.title)}${settings.amazonAffiliateTag ? `&tag=${settings.amazonAffiliateTag}` : ''}`;
                        return (
                          <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                            <span className="text-[#04D9FF] mt-1">•</span>
                            <div>
                              <a 
                                href={amazonLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-bold text-white hover:text-[#04D9FF] hover:underline transition-colors"
                              >
                                {res.title}
                              </a>
                              <p className="mt-1">{res.description}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div className="bg-[#09090B] p-6 rounded-2xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#39FF14]" /> Daily Habit Tracker
                    </h3>
                    <ul className="space-y-2">
                      {result.habitTracker.map((habit, i) => (
                        <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                          <span className="text-[#39FF14] mt-1">•</span> {habit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-[#09090B] p-6 rounded-2xl border border-white/5 mb-8">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" /> Expert Career Advice
                  </h3>
                  <p className="text-sm text-zinc-300 italic">"{result.expertAdvice}"</p>
                </div>

                {/* Branding Footer */}
                <div className="border-t border-white/10 pt-6 text-center">
                  <p className="text-yellow-400/80 font-display font-bold tracking-widest uppercase text-sm">Design by Ramy</p>
                </div>
              </div>
              
              <button 
                onClick={handleDownloadRoadmap}
                className="md:hidden w-full flex items-center justify-center gap-2 text-black font-bold bg-yellow-400 hover:bg-yellow-500 transition-colors px-6 py-4 rounded-xl"
              >
                <Download className="w-5 h-5" /> Download Pro Roadmap
              </button>

              <div className="text-center pt-8">
                <button 
                  onClick={() => setResult(null)}
                  className="text-zinc-500 hover:text-white transition-colors underline underline-offset-4 text-sm"
                >
                  I want another reality check
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      )}

      {/* AdSense Placeholder Space */}
      {!isAdmin && settings.adSenseId && (
        <div className="w-full max-w-6xl mx-auto mt-8 px-6">
          <div className="w-full p-4 border border-dashed border-zinc-700 rounded-xl flex items-center justify-center text-zinc-500 text-sm bg-black/20">
            Advertisement Space (AdSense ID: {settings.adSenseId})
          </div>
        </div>
      )}

      {/* Custom Ad Banner */}
      {!isAdmin && settings.customAdImageUrl && (
        <div className="w-full max-w-6xl mx-auto mt-8 px-6">
          <a 
            href={settings.customAdLink || '#'} 
            target="_blank" 
            rel="noreferrer"
            className="block w-full overflow-hidden rounded-xl border border-white/10 hover:border-[#39FF14]/50 transition-colors"
          >
            <img 
              src={settings.customAdImageUrl} 
              alt="Advertisement" 
              className="w-full h-auto object-cover max-h-[250px]"
              referrerPolicy="no-referrer"
            />
          </a>
        </div>
      )}

      {/* Custom Modules */}
      {!isAdmin && settings.customModules && settings.customModules.length > 0 && (
        <div className="w-full max-w-4xl mx-auto mt-12 px-6 space-y-8">
          {settings.customModules.map((module) => (
            <div key={module.id} className="bg-[#18181B] rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl">
              <h2 className="text-2xl font-display font-bold text-[#39FF14] mb-4">{module.title}</h2>
              <div className="text-zinc-300 whitespace-pre-wrap">{module.content}</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {!isAdmin && (
        <footer className="border-t border-white/5 bg-[#09090B] pt-12 pb-24 md:pb-6 mt-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {/* Column 1: Legal */}
              <div className="space-y-4">
                <h4 className="text-white font-bold font-display tracking-wider uppercase text-sm">Legal</h4>
                <div className="flex flex-col space-y-2 text-sm text-zinc-500">
                  <button onClick={() => setActiveModal('Privacy Policy')} className="text-left w-fit hover:text-[#FF10F0] transition-colors">Privacy Policy</button>
                  <button onClick={() => setActiveModal('Terms')} className="text-left w-fit hover:text-[#FF10F0] transition-colors">Terms & Conditions</button>
                  <button onClick={() => setActiveModal('Disclaimer')} className="text-left w-fit hover:text-[#FF10F0] transition-colors">Disclaimer</button>
                </div>
              </div>

              {/* Column 2: Support & Business */}
              <div className="space-y-4">
                <h4 className="text-white font-bold font-display tracking-wider uppercase text-sm">Support & Business</h4>
                <div className="flex flex-col space-y-2 text-sm text-zinc-500">
                  <button onClick={() => setActiveModal('FAQ')} className="text-left w-fit hover:text-[#04D9FF] transition-colors">Help Center / FAQ</button>
                  <button onClick={() => setShowFeedback(true)} className="text-left w-fit hover:text-[#04D9FF] transition-colors">Submit Feedback</button>
                  <a href="mailto:zidpath@gmail.com?subject=Sponsorship%20Inquiry" className="text-left w-fit hover:text-[#39FF14] transition-colors font-medium">Sponsor / Advertise with Us</a>
                  <a href="mailto:zidpath@gmail.com" className="text-left w-fit hover:text-[#04D9FF] transition-colors">Help: zidpath@gmail.com</a>
                </div>
              </div>

              {/* Column 3: Contact */}
              <div className="space-y-4">
                <h4 className="text-white font-bold font-display tracking-wider uppercase text-sm">Socials</h4>
                <div className="flex items-center gap-4 text-zinc-500">
                  <a href={settings.twitterUrl || "#"} target="_blank" rel="noreferrer" className="hover:text-[#04D9FF] transition-colors"><Twitter className="w-5 h-5" /></a>
                  <a href={settings.instagramUrl || "#"} target="_blank" rel="noreferrer" className="hover:text-[#FF10F0] transition-colors"><Instagram className="w-5 h-5" /></a>
                  <a href={settings.youtubeUrl || "#"} target="_blank" rel="noreferrer" className="hover:text-red-500 transition-colors"><Youtube className="w-5 h-5" /></a>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 flex flex-col items-center justify-center gap-4">
              <p className="text-xs text-zinc-600 font-medium tracking-wide">
                © 2026 Career Reality Check | All Rights Reserved.
              </p>
              <p className="text-xs text-[#39FF14] font-medium tracking-wide mt-2">
                Design by Ramy
              </p>
            </div>
          </div>
        </footer>
      )}

      {/* Admin Login Modal */}
      <Modal isOpen={showAdminLogin} onClose={() => setShowAdminLogin(false)} title="Admin Access">
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
            <input 
              type="password" 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full bg-[#09090B] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14]"
              placeholder="Enter admin password"
            />
          </div>
          <button type="submit" className="w-full bg-white text-black font-bold rounded-xl py-3 hover:bg-zinc-200 transition-colors">
            Login
          </button>
        </form>
      </Modal>

      {/* Login Modal */}
      <Modal isOpen={showLogin} onClose={() => setShowLogin(false)} title="Login / Create Profile">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Name</label>
            <input 
              type="text" 
              required
              value={loginForm.name}
              onChange={(e) => setLoginForm({...loginForm, name: e.target.value})}
              className="w-full bg-[#09090B] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14]"
              placeholder="Your Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
            <input 
              type="email" 
              required
              value={loginForm.email}
              onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
              className="w-full bg-[#09090B] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14]"
              placeholder="Your Email"
            />
          </div>
          <button type="submit" className="w-full bg-[#39FF14] text-black font-bold rounded-xl py-3 hover:bg-[#39FF14]/90 transition-colors">
            Save Profile
          </button>
        </form>
      </Modal>

      {/* Profile Modal */}
      <Modal isOpen={showProfile} onClose={() => setShowProfile(false)} title="Your Profile">
        {user && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-[#39FF14]/20 rounded-full flex items-center justify-center border border-[#39FF14]/30">
                <User className="w-8 h-8 text-[#39FF14]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{user.name}</h3>
                <p className="text-zinc-400">{user.email}</p>
              </div>
            </div>
            <div className="p-4 bg-[#09090B] border border-white/5 rounded-xl">
              <p className="text-sm text-zinc-400 mb-1">Status</p>
              <p className="text-white font-medium">Ready for a Reality Check 🚀</p>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full bg-red-500/10 text-red-500 border border-red-500/20 font-bold rounded-xl py-3 hover:bg-red-500/20 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </Modal>

      {/* App Install Modal */}
      <Modal isOpen={showAppDownload} onClose={() => setShowAppDownload(false)} title="Install Career Reality Check App">
        <div className="space-y-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-[#18181B] rounded-2xl border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(57,255,20,0.15)]">
              <Smartphone className="w-10 h-10 text-[#39FF14]" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold font-display">Take Career Reality Check Everywhere</h3>
          <p className="text-sm text-zinc-400">
            Get daily reality checks, track your roadmap progress, and stay motivated on the go.
          </p>

          <div className="flex flex-col gap-3 mt-6">
            <button 
              onClick={handleInstallApp}
              className="flex items-center justify-center gap-3 w-full bg-[#39FF14] text-black hover:bg-[#32e612] py-3 px-4 rounded-xl font-bold transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Install App</span>
            </button>
          </div>
          
          <p className="text-xs text-zinc-500 mt-4">
            Install this web app directly to your device's home screen for the best experience.
          </p>
        </div>
      </Modal>

      {/* Pro Benefits Modal */}
      <Modal isOpen={showProBenefits} onClose={() => setShowProBenefits(false)} title="Unlock Pro Version 🚀">
        <div className="space-y-6">
          <p className="text-zinc-300 text-sm">
            Is paid version mein aapko ek complete, personalized blueprint milega jo aapke career ya business goal ko achieve karne mein madad karega.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-400/10 rounded-lg shrink-0"><Target className="w-5 h-5 text-yellow-400"/></div>
              <div>
                <p className="font-bold text-white">30-Day Action Plan</p>
                <p className="text-xs text-zinc-400">Day-by-day tasks aur strategy aapke specific goal ke liye.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#04D9FF]/10 rounded-lg shrink-0"><Sparkles className="w-5 h-5 text-[#04D9FF]"/></div>
              <div>
                <p className="font-bold text-white">Master Reading List</p>
                <p className="text-xs text-zinc-400">Top 3 books ki summary jo aapki mindset ko transform karegi.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#FF10F0]/10 rounded-lg shrink-0"><Flame className="w-5 h-5 text-[#FF10F0]"/></div>
              <div>
                <p className="font-bold text-white">10x Focus Power Habits</p>
                <p className="text-xs text-zinc-400">Aise habits jo aapka distraction khatam karke focus badhayenge.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#39FF14]/10 rounded-lg shrink-0"><Download className="w-5 h-5 text-[#39FF14]"/></div>
              <div>
                <p className="font-bold text-white">Downloadable PDF</p>
                <p className="text-xs text-zinc-400">Apne roadmap ko save karein aur kabhi bhi access karein.</p>
              </div>
            </div>
          </div>

          {settings.razorpayLink || "https://razorpay.me/@carriercheckreality9" ? (
            <a 
              href={settings.razorpayLink ? (settings.razorpayLink.startsWith('http') ? settings.razorpayLink : `https://${settings.razorpayLink}`) : "https://razorpay.me/@carriercheckreality9"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setShowProBenefits(false);
                setShowPaymentVerification(true);
              }}
              className="w-full bg-yellow-400 text-black font-bold py-4 rounded-xl hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2 text-lg"
            >
              Pay ₹{settings.price} & Unlock Now <ArrowRight className="w-5 h-5" />
            </a>
          ) : (
            <button 
              onClick={handleInitiatePayment}
              className="w-full bg-yellow-400 text-black font-bold py-4 rounded-xl hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2 text-lg"
            >
              Pay ₹{settings.price} & Unlock Now <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </Modal>

      {/* Payment Verification Modal */}
      <Modal isOpen={showPaymentVerification} onClose={() => setShowPaymentVerification(false)} title="Verify Payment">
        <form onSubmit={handleVerifyPayment} className="space-y-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-[#18181B] rounded-2xl border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.15)]">
              <Shield className="w-10 h-10 text-yellow-400" />
            </div>
          </div>
          
          <h3 className="text-xl font-display font-bold text-white">
            Payment Initiated
          </h3>
          
          <p className="text-sm text-zinc-400">
            Please complete your payment of <strong className="text-yellow-400">₹{settings.price}</strong> on the Razorpay page that opened. Once done, enter the Transaction ID below to unlock your Pro Roadmap.
          </p>

          <div className="text-left">
            <label className="block text-sm font-medium text-zinc-400 mb-2">Transaction ID / Reference No.</label>
            <input 
              type="text" 
              required
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. pay_P1234567890"
              className="w-full bg-[#18181B] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-yellow-400 text-black font-bold py-4 rounded-xl hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2 text-lg"
          >
            Verify & Unlock <Sparkles className="w-5 h-5" />
          </button>
        </form>
      </Modal>

      {/* Feedback Modal */}
      <Modal isOpen={showFeedback} onClose={() => setShowFeedback(false)} title="Suggest a Feature">
        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          <p className="text-sm text-zinc-400 mb-4">
            Aapko app mein aage kya chahiye? Kya behtar kar sakte hain? Humein batayein!
          </p>
          <div>
            <textarea 
              required
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full bg-[#09090B] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#FF10F0] focus:ring-1 focus:ring-[#FF10F0] resize-none"
              placeholder="Type your feedback or feature request here..."
            />
          </div>
          <button type="submit" className="w-full bg-[#FF10F0] text-white font-bold rounded-xl py-3 hover:bg-[#FF10F0]/90 transition-colors">
            Submit Feedback
          </button>
        </form>
      </Modal>

      {/* Legal/FAQ Modal */}
      <Modal isOpen={!!activeModal} onClose={() => setActiveModal(null)} title={activeModal || ''}>
        <div className="space-y-4 text-sm text-zinc-300">
          {activeModal === 'About Us' && (
            <div className="space-y-4">
              <p>नमस्ते! हम जानते हैं कि आज के दौर में करियर बनाना कितना मुश्किल है।</p>
              <p>हमारा यह ऐप AI (Gemini) की मदद से आपको एक "Reality Check" देता है। हम आपके आलस का मज़ाक भी उड़ाते हैं और आपको अगले 7 दिनों का एक ठोस Roadmap भी देते हैं, ताकि आप अपने सपनों को सच कर सकें।</p>
            </div>
          )}
          {activeModal === 'Privacy Policy' && (
            <div className="space-y-4 text-sm text-zinc-300">
              <p><strong>Privacy Policy (As per DPDP Act 2023)</strong></p>
              <p>Effective Date: March 2026</p>
              <p><strong>1. Data Collection:</strong> We only collect your Name and Career Goals strictly for the purpose of generating your personalized AI career roadmap.</p>
              <p><strong>2. Security:</strong> Your data is processed securely via Google AI. We do not sell, rent, or share your personal data with third parties.</p>
              <p><strong>3. Payments:</strong> All transactions are handled securely by Razorpay. We do not collect or store your bank account or credit/debit card details on our servers.</p>
              <p><strong>4. Data Deletion Process:</strong> We delete your data immediately after the session ends as we do not permanently store user data. However, if you wish to formally request data deletion, please email us at zidpath@gmail.com with the subject "Data Deletion Request". We will ensure any residual records are removed within 7 working days.</p>
            </div>
          )}
          {activeModal === 'Terms' && (
            <div className="space-y-4 text-sm text-zinc-300">
              <p><strong>Terms & Conditions</strong></p>
              <p><strong>1. Service:</strong> Our application provides AI-based guidance and roadmaps for personal and career growth.</p>
              <p><strong>2. Fee:</strong> The fee of ₹9 for the 30-Day Ultra Plan (Pro Version) is strictly Non-Refundable under any circumstances.</p>
              <p><strong>3. Usage:</strong> Users must not use the AI or our services for any illegal, harmful, malicious, or unethical activities.</p>
              <p><strong>4. Jurisdiction:</strong> These terms shall be governed by and construed in accordance with the laws of India. All disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of New Delhi, India.</p>
            </div>
          )}
          {activeModal === 'Disclaimer' && (
            <div className="space-y-4 text-sm text-zinc-300">
              <p><strong>Disclaimer</strong></p>
              <p><strong>1. No Guarantee:</strong> The roadmaps and advice generated by this AI are for general guidance and informational purposes only. This does not guarantee any specific job placement, career advancement, or financial success.</p>
              <p><strong>2. "As-Is" Basis:</strong> The service is provided on an "as-is" basis. We are not responsible or liable for any AI hallucinations, inaccuracies, or technical errors in the generated content.</p>
              <p><strong>3. User Responsibility:</strong> We do not provide permanent storage for your generated roadmaps. Users are strongly advised to select all, copy, and save their roadmaps to Google Drive or Keep Notes immediately after generation to ensure they do not lose access to the content.</p>
              <p><strong>4. Content & Promotion Policy:</strong> We strictly adhere to Indian laws and regulations. We do not accept, promote, or endorse any form of explicit/obscene content (ashleel content), tobacco products (gutka/pan masala), or gambling/betting (satta/casino) platforms.</p>
            </div>
          )}
          {activeModal === 'FAQ' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-white mb-1">How does this work?</h4>
                <p className="text-zinc-400">We use Google's Gemini AI to analyze your inputs and generate a custom roast and an actionable 7-day roadmap.</p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Is my data saved?</h4>
                <p className="text-zinc-400">No, we do not store your personal data on our servers. It's processed on the fly.</p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Can I change the roast level?</h4>
                <p className="text-zinc-400">Currently, the roast level is set globally by the admin. But trust us, you need the savage mode.</p>
              </div>
            </div>
          )}
          {activeModal === 'Contact Us' && (
            <form className="space-y-4" onSubmit={(e) => { 
              e.preventDefault(); 
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name');
              const email = formData.get('email');
              const message = formData.get('message');
              window.location.href = `mailto:zidpath@gmail.com?subject=Contact from ${name}&body=Name: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0AMessage:%0D%0A${message}`;
              setActiveModal(null); 
            }}>
              <p className="mb-4">हमसे संपर्क करने के लिए नीचे दिया गया फॉर्म भरें।</p>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">नाम (Name)</label>
                <input type="text" name="name" required className="w-full bg-[#09090B] border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">ईमेल (Email)</label>
                <input type="email" name="email" required className="w-full bg-[#09090B] border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">संदेश (Message)</label>
                <textarea name="message" required rows={4} className="w-full bg-[#09090B] border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] resize-none"></textarea>
              </div>
              <button type="submit" className="w-full bg-white text-black font-bold rounded-xl py-3 hover:bg-zinc-200 transition-colors">
                भेजें (Submit)
              </button>
            </form>
          )}
        </div>
      </Modal>

      {/* Chatbot */}
      {!isAdmin && <Chatbot />}

      {/* Mobile App Install Floating Banner */}
      {!isAdmin && !isStandalone && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#18181B] border-t border-white/10 p-4 pb-safe flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#09090B] rounded-xl border border-white/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-[#39FF14]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Career Reality Check App</p>
              <p className="text-xs text-zinc-400">Get the full experience</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAppDownload(true)}
            className="bg-[#39FF14] text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-[#32e612] transition-colors"
          >
            Install
          </button>
        </div>
      )}
    </div>
  );
}
