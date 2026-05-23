import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';
import { Flame, Target, Clock, Share2, Lock, ArrowRight, Loader2, User, Sparkles, Shield, Search, Twitter, Instagram, Youtube, Mail, Menu, Download, Smartphone, Printer, AlertTriangle, CheckSquare, BarChart2, Users } from 'lucide-react';
import Modal from './components/Modal';
import Chatbot from './components/Chatbot';
import AdminDashboard from './components/AdminDashboard';
import { getSettings, getAnalytics, incrementVisits, incrementClicks, addFeedback, incrementRoasts, incrementProUnlocks } from './lib/store';
import { jobList, jobCategories } from './lib/jobs';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import ReactMarkdown from 'react-markdown';

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
  timeCommitment?: string;
  tool?: string;
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
  const [isAdminUnlock, setIsAdminUnlock] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [secretClickCount, setSecretClickCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New State
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [settings, setSettings] = useState({ 
    price: 19, 
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
    amazonAffiliateTag: '',
    customModules: [] as { id: string, title: string, content: string }[]
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showJobSuggestions, setShowJobSuggestions] = useState(false);
  const [analytics, setAnalytics] = useState({ visits: 0, clicks: 0, roastsGenerated: 0, proUnlocks: 0, dailyViews: {} as Record<string, number> });
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
  const [amountConfirmed, setAmountConfirmed] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Load state on mount
  useEffect(() => {
    const savedResult = localStorage.getItem('careerResult');
    const hasSeenGuide = localStorage.getItem('hasSeenGuide');
    
    if (!hasSeenGuide) {
      setShowGuide(true);
    }
    
    if (savedResult) {
      try {
        setResult(JSON.parse(savedResult));
      } catch (e) {
        console.error('Failed to parse saved result', e);
      }
    }
  }, []);

  // Save state on change
  useEffect(() => {
    if (result) {
      localStorage.setItem('careerResult', JSON.stringify(result));
    } else {
      localStorage.removeItem('careerResult');
    }
  }, [result]);

  const handleInitiatePayment = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = settings.razorpayLink;
    
    // Try to open in new tab
    const newWin = window.open(url, '_blank');
    
    // If blocked or failed (often happens in in-app browsers like Instagram/Facebook), fallback to same tab
    if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
      window.location.href = url;
    }
  };

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
    setAnalytics(getAnalytics());
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
        `You are a brutal, savage, and hilarious Career Roasting AI for an app called "Career Check Reality". Your job is to destroy the user's delusions about their career based on their inputs:
        Name: ${name}
        Current Profession/Studies/Goal: ${dreamJob}
        Daily Mobile Screen Time: ${socialMediaHours} hours
        
        Even if the input data is limited, you must use your creativity to guess their biggest distractions (like Instagram Reels, Crush, or gaming), their fake dreams (like 12 LPA package with zero skills), and their ultimate pain points (like low CGPA or backlogs).

        You must strictly generate the 'roast' field in the following HINDI-ENGLISH (Hinglish) format so it can be easily displayed on the app dashboard:

        ### 📊 CAREER SURVIVAL SCORE: [Generate a percentage between 5% to 35% based on their high screen time]
        ### 🧠 DELUSION LEVEL (गलतफ़हमी का स्तर): [Generate a percentage between 85% to 99%]

        ---

        ### 💀 THE SAVAGE ROAST (औकात चेक)
        [Write a brutal, funny, and highly relatable roast here in Hinglish. 
        - Style: ${settings.roastMode}.
        - Target their profession (e.g., B.Tech, UPSC, B.Com, MBA).
        - Roast their high mobile screen time severely.
        - Punchline Example: "सपना 12 लाख के पैकेज का और स्किल्स 12 रुपये की भी नहीं! इतने स्क्रीन टाइम में तो मार्क जुकरबर्ग भी तुम्हारे घर आकर पैसे नहीं देगा।"
        - Use sharp, trendy Indian meme references, but keep it strictly about careers and wasting time.]

        ---

        ### 🔮 FUTURE REALITY (भविष्यवाणी)
        [Write a 2-line dark reality prediction about where they will be in 5 years if they don't change, using savage humor.]
        
        Additionally, you must provide:
        - A clear, serious 7-day 'roadmap' (table of tasks) in Hinglish.
        - One 'proTip' in Hinglish.
        - A 'shareText' for WhatsApp.`,
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
        Their dream goal/job/degree/exam is: ${dreamJob}. (This could be a job, business, college degree like B.Tech/BCA, or competitive exam preparation like UPSC/NEET/JEE).
        They spend ${socialMediaHours} hours on social media daily.
        
        Tone: Professional, motivating, extremely detailed and highly actionable. Ensure the value is so high that they feel their ₹19 was the best investment ever. Make it a complete, personalized dossier (poora chitta) of their path so they feel they received a premium, exhaustive blueprint. The plan should be substantially large, comprehensive, and impactful.
        
        IMPORTANT: The entire response MUST be in a bilingual format (Hindi + English / Hinglish) so it's easily understood by everyone. Provide the absolute BEST advice tailored to their specific goal.
        
        1. savageRoast: Write an incredibly savage, brutal roast in Hinglish about their social media habits. YOU MUST STRICTLY FORMAT THIS FIELD AS FOLLOWS:
        ### 📊 CAREER SURVIVAL SCORE: [Generate a percentage]
        ### 🧠 DELUSION LEVEL: [Generate a percentage]

        ---
        ### 💀 THE SAVAGE ROAST (PRO LEVEL)
        [Write the roast here...]

        ---
        ### 🔮 FUTURE REALITY
        [Write the dark 5-year prediction...]
        
        2. proRoadmap: Generate a highly detailed 30-day Pro roadmap with tasks in Hinglish. Each task should be long and descriptive, breaking down exactly WHAT to do and HOW to do it.
           - Phase 1: Foundation (Day 1-10) - Mindset shifts, Power habits, and Groundwork.
           - Phase 2: Action (Day 11-20) - Detailed step-by-step strategy, Skill acquisition, and Networking.
           - Phase 3: Mastery (Day 21-30) - Scaling tips, Portfolio building, and Elite performance execution.
           *MANDATORY VIRAL FEATURE*: On Days 5, 10, 15, 20, 25, and 30, append this exact message to the task string: "🚀 Progress is better together! Share this with a friend to grow as a team!"
           *MANDATORY BOOK FEATURE*: For EVERY SINGLE DAY (Day 1 to 30), provide ONE highly relevant book recommendation ('book' field) related to their specific goal/field. So they get 30 books in 30 days.
           *MANDATORY TIME & TOOL*: For each day, provide a realistic 'timeCommitment' (e.g., '1.5 hours', '2 hours') and a specific 'tool' to use (e.g., 'Notion', 'LinkedIn', 'ChatGPT').
        3. resources: A curated "Master Reading List" (Top 5 books). For each book, provide the 'title' (just the book name) and 'description' (a substantive summary in Hinglish).
        4. habitTracker: Specific "Power Habits" that clear mental fog and increase focus 10x (5 intense habits) in Hinglish.
        5. expertAdvice: Provide a long, elite, life-changing piece of advice in Hinglish and end with these exact 'Save & Download Instructions' (in English):
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
                    timeCommitment: { type: Type.STRING, description: "Time required, e.g., '45 mins'" },
                    tool: { type: Type.STRING, description: "Specific tool to use, e.g., 'Notion', 'LinkedIn'" }
                  },
                  required: ['day', 'task', 'book', 'timeCommitment', 'tool'],
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



  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountConfirmed) {
      alert(`Please confirm that you have paid exactly ₹${settings.price} to proceed.`);
      return;
    }
    if (transactionId.trim().length > 5) {
      setIsVerifying(true);
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsVerifying(false);
      setShowPaymentVerification(false);
      incrementProUnlocks();
      setIsProUnlocked(true);
      handleGeneratePro();
      setTransactionId('');
      setAmountConfirmed(false);
    } else {
      alert('Please enter a valid Transaction ID after completing the payment.');
    }
  };

  const handleAdminBypass = () => {
    if (secretCode === 'ADMIN@2026') {
      incrementProUnlocks();
      setIsProUnlocked(true);
      setIsAdminUnlock(true);
      handleGeneratePro();
      setSecretCode('');
      setShowAdminInput(false);
    } else {
      alert('Invalid access code. Please proceed with payment.');
    }
  };

  const handleSecretClick = () => {
    setShowAdminInput(prev => !prev);
  };

  const handleDownloadRoadmap = async () => {
    const element = document.getElementById('pro-roadmap-card');
    if (!element) return;
    
    const scrollableDiv = element.querySelector('.overflow-y-auto');
    if (scrollableDiv) {
      scrollableDiv.classList.remove('max-h-[500px]', 'overflow-y-auto');
    }

    // Hide download buttons during PDF generation
    const downloadBtns = element.querySelectorAll('button');
    downloadBtns.forEach(btn => btn.style.display = 'none');

    const brandingText = element.querySelector('#pdf-branding-text');
    const originalBranding = brandingText ? brandingText.textContent : '';
    if (brandingText) {
      brandingText.textContent = isAdminUnlock ? 'DESIGN BY RAMY (ADMIN MODE)' : 'DESIGN BY RAMY';
    }

    // Show loading toast
    const loadingToast = document.createElement('div');
    loadingToast.innerHTML = 'Generating High-Quality PDF... Please wait.';
    loadingToast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#eab308;color:black;padding:10px 20px;border-radius:8px;font-weight:bold;z-index:99999;box-shadow:0 4px 6px rgba(0,0,0,0.3);';
    document.body.appendChild(loadingToast);

    // Wait for DOM to update and repaint before capturing
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      let currentY = margin;

      const setPdfBackground = () => {
        pdf.setFillColor(24, 24, 27); // #18181B
        pdf.rect(0, 0, pdfWidth, pageHeight, 'F');
      };

      setPdfBackground();
      const originalAddPage = pdf.addPage.bind(pdf);
      pdf.addPage = function() {
        originalAddPage();
        setPdfBackground();
        return this;
      };

      const captureAndAdd = async (el: HTMLElement) => {
        if (!el) return;
        const dataUrl = await toJpeg(el, { 
          quality: 0.95, 
          backgroundColor: '#18181B', // Match card background
          pixelRatio: 2 
        });
        const imgProps = pdf.getImageProperties(dataUrl);
        const imgHeight = (imgProps.height * (pdfWidth - margin * 2)) / imgProps.width;

        if (currentY + imgHeight > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.addImage(dataUrl, 'JPEG', margin, currentY, pdfWidth - margin * 2, imgHeight);
        currentY += imgHeight + 5; // 5mm gap
      };

      // Capture sections
      const header = document.getElementById('pdf-header');
      if (header) await captureAndAdd(header);

      const days = document.querySelectorAll('.roadmap-day-card');
      if (days.length > 0) {
        // Day 1 on first page
        await captureAndAdd(days[0] as HTMLElement);
        
        // Force new page for Day 2 onwards
        if (days.length > 1) {
          pdf.addPage();
          currentY = margin;
        }

        for (let i = 1; i < days.length; i++) {
          await captureAndAdd(days[i] as HTMLElement);
          
          // Force new page after every 2 days (i=2, i=4, i=6...)
          if (i % 2 === 0 && i !== days.length - 1) {
            pdf.addPage();
            currentY = margin;
          }
        }
      }

      // Force new page for resources
      pdf.addPage();
      currentY = margin;

      const resources = document.getElementById('pdf-resources');
      if (resources) await captureAndAdd(resources);

      const expert = document.getElementById('pdf-expert');
      if (expert) await captureAndAdd(expert);

      const footer = document.getElementById('pdf-footer');
      if (footer) await captureAndAdd(footer);

      pdf.save(isAdminUnlock ? 'Admin_Pro_Roadmap.pdf' : 'My_Pro_Roadmap.pdf');
    } catch (err) {
      console.error('Error downloading roadmap:', err);
      alert('Failed to download roadmap. Please try again.');
    } finally {
      document.body.removeChild(loadingToast);
      if (scrollableDiv) {
        scrollableDiv.classList.add('max-h-[500px]', 'overflow-y-auto');
      }
      downloadBtns.forEach(btn => btn.style.display = '');
      if (brandingText) {
        brandingText.textContent = originalBranding;
      }
    }
  };

  const handlePrintRoadmap = () => {
    const element = document.getElementById('pro-roadmap-card');
    if (!element) return;
    
    const scrollableDiv = element.querySelector('.overflow-y-auto');
    if (scrollableDiv) {
      scrollableDiv.classList.remove('max-h-[500px]', 'overflow-y-auto');
    }

    const brandingText = element.querySelector('#pdf-branding-text');
    const originalBranding = brandingText ? brandingText.textContent : '';
    if (brandingText) {
      brandingText.textContent = isAdminUnlock ? 'DESIGN BY RAMY (ADMIN MODE)' : 'DESIGN BY RAMY';
    }

    // Force synchronous reflow so the DOM updates immediately
    void element.offsetHeight;

    // Call print synchronously to avoid mobile browser popup blockers
    window.print();

    // Restore original state
    if (scrollableDiv) {
      scrollableDiv.classList.add('max-h-[500px]', 'overflow-y-auto');
    }
    if (brandingText) {
      brandingText.textContent = originalBranding;
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

  const handleShare = async () => {
    if (!result) return;
    
    // Create the message to share
    const roastText = result.type === 'free' ? result.roast : result.savageRoast;
    const shareText = result.shareText || `Check out my Career Reality Check!\n\n${roastText}\n\n`;
    const shareUrl = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Career Reality Check',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // Fallback if sharing is aborted or fails
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback for desktop/unsupported browsers: Copy to clipboard and alert
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('Roast & Link copied to clipboard! You can now paste it anywhere.');
      } catch (err) {
        // Ultimate fallback: open WhatsApp web
        const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
      }
    }
  };

  const handleGlobalShare = async () => {
    const shareText = "Get roasted for your habits, then get a serious roadmap to actually achieve your dreams! 🚀\nTry Career Reality Check now:\n";
    const shareUrl = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Career Reality Check',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('App Link copied to clipboard! You can now paste it anywhere.');
      } catch (err) {
        const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
      }
    }
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
              <button onClick={handleGlobalShare} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                <Share2 className="w-4 h-4" /> Share App
              </button>
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
                  <button onClick={() => { handleGlobalShare(); setIsMobileMenuOpen(false); }} className="text-left text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                    <Share2 className="w-4 h-4" /> Share App
                  </button>
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
                      className="w-full bg-[#09090B] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-all"
                      placeholder="e.g. Ramanand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">Dream Goal / Exam / Job</label>
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
                      placeholder="e.g. UPSC / B.Tech / Software Engineer"
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

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-white/5">
                  <button 
                    type="button"
                    onClick={() => {
                      const text = encodeURIComponent("Get roasted for your habits, then get a serious roadmap to actually achieve your dreams! 🚀\nTry Career Reality Check now:\n" + window.location.origin);
                      window.open(`https://wa.me/?text=${text}`, '_blank');
                    }} 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/20 px-4 py-3 sm:py-2 rounded-xl sm:rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> 
                    Share to WhatsApp
                  </button>
                  <button 
                    type="button"
                    onClick={handleGlobalShare} 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors bg-[#18181B] border border-white/10 hover:bg-white/5 px-4 py-3 sm:py-2 rounded-xl sm:rounded-lg"
                  >
                    <Share2 className="w-4 h-4" /> 
                    Share Everywhere Else
                  </button>
                </div>
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
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF10F0]/5 rounded-full" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#FF10F0]/20 rounded-lg text-[#FF10F0]">
                    <Flame className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white">The Roast</h2>
                </div>
                <div className="text-xl md:text-2xl leading-relaxed font-medium text-zinc-200 markdown-body max-w-none">
                  <ReactMarkdown>{result.roast}</ReactMarkdown>
                </div>
                
                <button 
                  onClick={handleShare}
                  className="mt-8 w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#04D9FF]/10 text-[#04D9FF] border border-[#04D9FF]/30 hover:bg-[#04D9FF]/20 px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  Share Roast & Link
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
                <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <Lock className="w-10 h-10 text-yellow-400 mx-auto mb-4 relative z-10" />
                <h3 className="text-2xl font-display font-bold text-white mb-2 relative z-10">Unlock the 30-Day Pro Roadmap</h3>
                <p className="text-zinc-400 mb-8 relative z-10">Get the exact blueprint, curated resources, habit tracker, and expert advice to land your dream job.</p>
                
                {!isProUnlocked ? (
                  <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto relative z-10">
                    <div className="flex flex-col gap-3 w-full">
                      <button 
                        onClick={() => setShowProBenefits(true)}
                        className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-black font-bold px-8 py-4 rounded-xl hover:bg-yellow-500 transition-colors w-full"
                      >
                        View Pro Benefits & Unlock <ArrowRight className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setShowPaymentVerification(true)}
                        className="inline-flex items-center justify-center gap-2 bg-[#18181B] border border-yellow-400/50 text-yellow-400 font-bold px-8 py-4 rounded-xl hover:bg-yellow-400/10 transition-colors w-full"
                      >
                        Already Paid? Verify Here <Shield className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Subtle Admin Toggle */}
                    <button 
                      onClick={() => setShowAdminInput(prev => !prev)}
                      className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mt-2"
                    >
                      Admin Access
                    </button>
                    
                    {/* Admin Panel */}
                    {showAdminInput && (
                      <div className="mt-2 w-full p-6 border border-red-500/30 bg-red-500/5 rounded-2xl relative z-20">
                        <h4 className="text-red-400 font-bold mb-4 flex items-center justify-center gap-2">
                          <Shield className="w-5 h-5" /> Admin Panel
                        </h4>
                        <div className="flex flex-col gap-3">
                          <input
                            type="password"
                            value={secretCode}
                            onChange={(e) => setSecretCode(e.target.value)}
                            placeholder="Enter Admin Code"
                            className="bg-[#09090B] border border-red-500/30 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-red-500 text-center"
                          />
                          <button
                            onClick={handleAdminBypass}
                            className="bg-red-500 text-white font-bold px-4 py-3 rounded-xl hover:bg-red-600 transition-colors"
                          >
                            Unlock Admin PDF
                          </button>
                          <button
                            onClick={() => {
                              localStorage.removeItem('isProUnlocked');
                              localStorage.removeItem('isAdminUnlock');
                              setIsProUnlocked(false);
                              setIsAdminUnlock(false);
                              window.location.reload();
                            }}
                            className="bg-zinc-800 text-zinc-300 font-bold px-4 py-3 rounded-xl hover:bg-zinc-700 transition-colors mt-2 text-sm"
                          >
                            Reset App State (Test Payment Flow)
                          </button>
                        </div>
                      </div>
                    )}
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
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-yellow-400/20 rounded-lg text-yellow-400">
                    <Flame className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white">Savage Roast (Pro)</h2>
                </div>
                <div className="text-xl md:text-2xl leading-relaxed font-medium text-zinc-200 markdown-body max-w-none">
                  <ReactMarkdown>{result.savageRoast}</ReactMarkdown>
                </div>
                
                <button 
                  onClick={handleShare}
                  className="mt-8 w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#04D9FF]/10 text-[#04D9FF] border border-[#04D9FF]/30 hover:bg-[#04D9FF]/20 px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  Share Roast & Link
                </button>
              </div>

              {/* Pro Roadmap Card (Downloadable) */}
              <div id="pro-roadmap-card" className="bg-[#18181B] rounded-3xl p-6 md:p-8 border-2 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)] relative">
                <div id="pdf-header" className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-400/20 rounded-lg text-yellow-400">
                      <Target className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white">30-Day Pro Roadmap</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handlePrintRoadmap}
                      className="hidden md:flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-bold bg-blue-400/10 px-4 py-2 rounded-lg print:hidden"
                    >
                      <Printer className="w-4 h-4" /> Print
                    </button>
                    <button 
                      onClick={handleDownloadRoadmap}
                      className="hidden md:flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors text-sm font-bold bg-yellow-400/10 px-4 py-2 rounded-lg print:hidden"
                    >
                      <Download className="w-4 h-4" /> Download PDF
                    </button>
                  </div>
                </div>
                
                <div id="pdf-content" className="space-y-4 mb-8 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {result.proRoadmap.map((day) => (
                    <div key={day.day} className="roadmap-day-card flex gap-4 p-4 rounded-2xl bg-[#09090B] border border-white/5 hover:border-yellow-400/30 transition-colors group">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#18181B] border border-white/10 flex items-center justify-center font-display font-bold text-yellow-400 group-hover:scale-110 transition-transform">
                        D{day.day}
                      </div>
                      <div className="flex flex-col justify-center w-full">
                        <p className="text-zinc-300 text-sm md:text-base mb-3">{day.task}</p>
                        <div className="flex flex-wrap gap-2">
                          {day.timeCommitment && (
                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md">
                              <Clock className="w-3 h-3" /> {day.timeCommitment}
                            </div>
                          )}
                          {day.tool && (
                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-md">
                              <Target className="w-3 h-3" /> Tool: {day.tool}
                            </div>
                          )}
                          {day.book && (
                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-yellow-400/80 bg-yellow-400/10 px-2 py-1 rounded-md">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                              Book: {day.book}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div id="pdf-resources" className="grid md:grid-cols-2 gap-6 mb-8">
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

                <div id="pdf-expert" className="bg-[#09090B] p-6 rounded-2xl border border-white/5 mb-8">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" /> Expert Career Advice
                  </h3>
                  <p className="text-sm text-zinc-300 italic">"{result.expertAdvice}"</p>
                </div>

                {/* Branding Footer */}
                <div id="pdf-footer" className="border-t border-white/10 pt-6 text-center">
                  <p id="pdf-branding-text" className="text-yellow-400/80 font-display font-bold tracking-widest uppercase text-sm">
                    {isAdminUnlock ? 'DESIGN BY RAMY (ADMIN)' : 'DESIGN BY STUDENT'}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 md:hidden print:hidden">
                <button 
                  onClick={handleDownloadRoadmap}
                  className="w-full flex items-center justify-center gap-2 text-black font-bold bg-yellow-400 hover:bg-yellow-500 transition-colors px-6 py-4 rounded-xl"
                >
                  <Download className="w-5 h-5" /> Download Pro Roadmap
                </button>
                <button 
                  onClick={handlePrintRoadmap}
                  className="w-full flex items-center justify-center gap-2 text-blue-400 font-bold bg-blue-400/10 hover:bg-blue-400/20 transition-colors px-6 py-4 rounded-xl"
                >
                  <Printer className="w-5 h-5" /> Print Roadmap
                </button>
              </div>

              <div className="text-center pt-8 print:hidden">
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

      {/* Live impact Analytics */}
      {!isAdmin && (
        <div className="w-full max-w-6xl mx-auto mt-12 px-6">
          <div className="bg-[#18181B] rounded-3xl p-6 md:p-8 border border-[#39FF14]/10 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-8 relative z-10">
              {/* Stats Column */}
              <div className="w-full lg:w-1/3 flex flex-col justify-center space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#04D9FF]/20 rounded-lg text-[#04D9FF]">
                      <BarChart2 className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white">Our Global Impact</h2>
                  </div>
                  <p className="text-zinc-400">Live statistics showing how many careers we've roasted and transformed.</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-[#09090B] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#39FF14]/10 rounded-lg"><Users className="w-5 h-5 text-[#39FF14]" /></div>
                      <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Total Visitors</span>
                    </div>
                    <span className="text-2xl font-display font-bold text-[#39FF14]">
                      {(1024 + (analytics.visits || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-[#09090B] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#FF10F0]/10 rounded-lg"><Flame className="w-5 h-5 text-[#FF10F0]" /></div>
                      <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Roasts Generated</span>
                    </div>
                    <span className="text-2xl font-display font-bold text-[#FF10F0]">
                      {(841 + (analytics.roastsGenerated || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-[#09090B] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-400/10 rounded-lg"><Lock className="w-5 h-5 text-yellow-400" /></div>
                      <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Pro Roadmaps Unlocked</span>
                    </div>
                    <span className="text-2xl font-display font-bold text-yellow-400">
                      {(156 + (analytics.proUnlocks || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chart Column */}
              <div className="w-full lg:w-2/3 bg-[#09090B] rounded-2xl p-6 border border-white/5">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" /> Activity Trend (Last 7 Days)
                </h3>
                <div className="h-[250px] w-full flex items-end justify-between gap-2 pt-8">
                  {(Object.keys(analytics.dailyViews || {}).length > 0 
                    ? Object.entries(analytics.dailyViews).map(([date, visits]) => ({ name: date.slice(5), visits })).slice(-7)
                    : [
                      { name: 'Day 1', visits: 120 }, { name: 'Day 2', visits: 150 }, { name: 'Day 3', visits: 180 },
                      { name: 'Day 4', visits: 220 }, { name: 'Day 5', visits: 190 }, { name: 'Day 6', visits: 280 },
                      { name: 'Today', visits: 310 + (analytics.visits || 0) }
                    ]
                  ).map((data, i, arr) => {
                    const maxVisits = Math.max(...arr.map(d => d.visits), 400);
                    const heightPercent = Math.max((data.visits / maxVisits) * 100, 10);
                    
                    return (
                      <div key={data.name} className="flex flex-col items-center flex-1 h-full justify-end group">
                        <div className="w-full relative flex items-end justify-center h-full">
                          {/* Tooltip */}
                          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#18181B] border border-white/10 text-white text-xs py-1 px-2 rounded-lg whitespace-nowrap z-10 pointer-events-none">
                            {data.visits.toLocaleString()} visits
                          </div>
                          {/* Bar */}
                          <div 
                            className="w-full max-w-[40px] bg-[#39FF14]/20 group-hover:bg-[#39FF14]/40 rounded-t-lg transition-all relative overflow-hidden"
                            style={{ height: `${heightPercent}%` }}
                          >
                            <div className="absolute top-0 w-full h-1 bg-[#39FF14]"></div>
                          </div>
                        </div>
                        <span className="text-[10px] sm:text-xs text-zinc-500 mt-3 font-medium whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                          {data.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
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
                <div className="flex flex-col space-y-2 text-sm text-zinc-300">
                  <button onClick={() => setActiveModal('Privacy Policy')} className="text-left w-fit hover:text-[#FF10F0] transition-colors">Privacy Policy</button>
                  <button onClick={() => setActiveModal('Terms')} className="text-left w-fit hover:text-[#FF10F0] transition-colors">Terms & Conditions</button>
                  <button onClick={() => setActiveModal('Disclaimer')} className="text-left w-fit hover:text-[#FF10F0] transition-colors">Disclaimer</button>
                </div>
              </div>

              {/* Column 2: Contact & Support */}
              <div className="space-y-4">
                <h4 className="text-white font-bold font-display tracking-wider uppercase text-sm">Contact & Support</h4>
                <div className="flex flex-col space-y-2 text-sm text-zinc-300">
                  <a href="mailto:zidpath@gmail.com" className="text-left w-fit flex items-center gap-2 hover:text-[#39FF14] text-white font-bold transition-colors mb-2">
                    <Mail className="w-4 h-4" /> zidpath@gmail.com
                  </a>
                  <button onClick={() => setActiveModal('FAQ')} className="text-left w-fit hover:text-[#04D9FF] transition-colors">Help Center / FAQ</button>
                  <button onClick={() => setShowFeedback(true)} className="text-left w-fit hover:text-[#04D9FF] transition-colors">Submit Feedback</button>
                  <a href="mailto:zidpath@gmail.com?subject=Sponsorship%20Inquiry" className="text-left w-fit hover:text-[#FF10F0] transition-colors">Sponsor / Advertise with Us</a>

                </div>
              </div>

              {/* Column 3: Contact */}
              <div className="space-y-4">
                <h4 className="text-white font-bold font-display tracking-wider uppercase text-sm">Socials</h4>
                <div className="flex items-center gap-4 text-zinc-300">
                  <a href={settings.twitterUrl || "#"} target="_blank" rel="noreferrer" className="hover:text-[#04D9FF] transition-colors"><Twitter className="w-5 h-5" /></a>
                  <a href={settings.instagramUrl || "#"} target="_blank" rel="noreferrer" className="hover:text-[#FF10F0] transition-colors"><Instagram className="w-5 h-5" /></a>
                  <a href={settings.youtubeUrl || "#"} target="_blank" rel="noreferrer" className="hover:text-red-500 transition-colors"><Youtube className="w-5 h-5" /></a>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 flex flex-col items-center justify-center gap-4">
              <p className="text-xs text-zinc-400 font-medium tracking-wide">
                © 2026 Career Reality Check | All Rights Reserved.
              </p>
              <p className="text-xs text-[#39FF14] font-medium tracking-wide mt-2 uppercase">
                Design by student
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
          
          <p className="text-xs text-zinc-300 mt-4">
            Install this web app directly to your device's home screen for the best experience.
          </p>
        </div>
      </Modal>

      {/* Welcome Guide Modal */}
      <Modal isOpen={showGuide} onClose={() => {
        setShowGuide(false);
        localStorage.setItem('hasSeenGuide', 'true');
      }} title="Welcome to Career Reality Check! 🎯">
        <div className="space-y-6">
          <p className="text-zinc-300 text-sm">
            Naye ho? Koi baat nahi! Yahan hum aapko aapke career ka sach batayenge aur ek solid roadmap denge.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-400/10 rounded-lg shrink-0 text-blue-400 font-bold">1</div>
              <div>
                <p className="font-bold text-white">Enter Details</p>
                <p className="text-xs text-zinc-400">Apna naam, dream job aur social media ka time daalein.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-400/10 rounded-lg shrink-0 text-red-400 font-bold">2</div>
              <div>
                <p className="font-bold text-white">Get Reality Check</p>
                <p className="text-xs text-zinc-400">AI aapko ek brutal reality check aur free basic roadmap dega.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-400/10 rounded-lg shrink-0 text-yellow-400 font-bold">3</div>
              <div>
                <p className="font-bold text-white">Unlock Pro Roadmap</p>
                <p className="text-xs text-zinc-400">Sirf ₹{settings.price} mein 30-din ka step-by-step action plan paayein!</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              setShowGuide(false);
              localStorage.setItem('hasSeenGuide', 'true');
            }}
            className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors mt-4"
          >
            Let's Start! 🚀
          </button>
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
                <p className="font-bold text-white">1. 30-Day Action Plan</p>
                <p className="text-xs text-zinc-400">Day-by-day tasks aur strategy aapke specific goal ke liye.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#04D9FF]/10 rounded-lg shrink-0"><Sparkles className="w-5 h-5 text-[#04D9FF]"/></div>
              <div>
                <p className="font-bold text-white">2. Master Reading List</p>
                <p className="text-xs text-zinc-400">Top 3 books ki summary jo aapki mindset ko transform karegi.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#FF10F0]/10 rounded-lg shrink-0"><Flame className="w-5 h-5 text-[#FF10F0]"/></div>
              <div>
                <p className="font-bold text-white">3. 10x Focus Power Habits</p>
                <p className="text-xs text-zinc-400">Aise habits jo aapka distraction khatam karke focus badhayenge.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#39FF14]/10 rounded-lg shrink-0"><Download className="w-5 h-5 text-[#39FF14]"/></div>
              <div>
                <p className="font-bold text-white">4. High-Quality PDF Download</p>
                <p className="text-xs text-zinc-400">Apne roadmap ko HD PDF mein save karein aur kabhi bhi access karein.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-400/10 rounded-lg shrink-0"><Shield className="w-5 h-5 text-purple-400"/></div>
              <div>
                <p className="font-bold text-white">5. Expert Career Advice</p>
                <p className="text-xs text-zinc-400">Industry experts ki taraf se personalized tips aur guidance.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-6">
            <button 
              onClick={handleInitiatePayment}
              className="w-full bg-yellow-400 text-black font-bold py-4 rounded-xl hover:bg-yellow-500 transition-colors flex flex-col items-center justify-center gap-1 text-lg"
            >
              <div className="flex items-center gap-2">
                Pay ₹{settings.price} to Unlock <ArrowRight className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Accepts UPI (GPay, PhonePe, Paytm), Cards & More</span>
            </button>
            <button 
              onClick={() => {
                setShowProBenefits(false);
                setShowPaymentVerification(true);
              }}
              className="w-full bg-[#18181B] border border-yellow-400/50 text-yellow-400 font-bold py-4 rounded-xl hover:bg-yellow-400/10 transition-colors flex items-center justify-center gap-2 text-lg"
            >
              Already Paid? Verify Here <Shield className="w-5 h-5" />
            </button>
          </div>
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
          
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-left">
            <p className="text-red-400 text-sm font-bold flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" />
              STRICT WARNING & NO REFUND POLICY
            </p>
            <p className="text-zinc-300 text-xs">
              You must pay exactly <strong className="text-white">₹{settings.price}</strong>. If you pay less, the system will reject your transaction ID and your roadmap will NOT be unlocked.
              <br /><br />
              <strong className="text-red-400">Note: Payment is strictly non-refundable (Paise kisi bhi haal mein refund nahi honge).</strong>
            </p>
          </div>

          <p className="text-sm text-zinc-400">
            Please complete your payment on the Razorpay page. Once done, enter the Transaction ID below.
          </p>

          <div className="text-left">
            <label className="block text-sm font-medium text-zinc-400 mb-2">Transaction ID / Reference No.</label>
            <input 
              type="text" 
              required
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. pay_P1234567890"
              className="w-full bg-[#18181B] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all mb-4"
            />
            
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-1">
                <input 
                  type="checkbox" 
                  checked={amountConfirmed}
                  onChange={(e) => setAmountConfirmed(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 border-2 border-zinc-600 rounded bg-[#18181B] peer-checked:bg-yellow-400 peer-checked:border-yellow-400 transition-colors"></div>
                <CheckSquare className="w-3.5 h-3.5 text-black absolute opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                I confirm that I have paid exactly <strong className="text-white">₹{settings.price}</strong>. I understand that entering a fake ID or paying less will result in permanent ban.
              </span>
            </label>
          </div>

          <button 
            type="submit"
            disabled={!amountConfirmed || isVerifying}
            className="w-full bg-yellow-400 text-black font-bold py-4 rounded-xl hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>Verifying Payment... <Loader2 className="w-5 h-5 animate-spin" /></>
            ) : (
              <>Verify & Unlock <Sparkles className="w-5 h-5" /></>
            )}
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
            <div className="space-y-6 text-sm text-zinc-300 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
              <div>
                <h3 className="text-xl font-bold text-[#39FF14] mb-2">PRIVACY POLICY (प्राइवेसी पॉलिसी)</h3>
                <p className="text-xs text-zinc-300 mb-6">Last Updated: May 23, 2026 | Jurisdiction: Republic of India</p>
                
                <p className="mb-4">Career Check Reality ("हम", "हमारी", "App", "Website") में आपका स्वागत है। हम अपने यूज़र्स ("आप", "आपके", "User") की प्राइवेसी और डेटा सुरक्षा का पूरा सम्मान करते हैं। यह प्राइवेसी पॉलिसी भारत के Information Technology (IT) Act, 2000 और Digital Personal Data Protection (DPDP) Act, 2023 के नियमों के तहत बनाई गई है। यह डॉक्युमेंट आपको बताता है कि जब आप हमारी वेबसाइट का उपयोग करते हैं, तो हम किस प्रकार की जानकारी एकत्र करते हैं और उसका उपयोग कैसे करते हैं।</p>
                
                <div className="bg-[#18181B] border border-white/10 p-4 rounded-xl mb-6">
                  <p className="font-bold text-white mb-1">महत्वपूर्ण सूचना:</p>
                  <p>हम आपका कोई भी पर्सनल सेंसिटिव डेटा (जैसे आधार, बैंक पासवर्ड, बायोमेट्रिक्स) स्टोर या एकत्र नहीं करते हैं। हमारी वेबसाइट पर दिया गया इनपुट पूरी तरह से करियर रोस्टिंग और फन के उद्देश्य से लिया जाता है।</p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white">1. एकत्र की जाने वाली जानकारी (Information We Collect)</h4>
                  <p>जब आप हमारी वेबसाइट पर करियर रियलिटी चेक या रोस्ट जनरेट करते हैं, तो हम आपसे केवल निम्नलिखित बुनियादी इनपुट लेते हैं:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-white">यूज़र इनपुट:</strong> आपका नाम, आपका वर्तमान प्रोफेशन/पढ़ाई (जैसे B.Tech, UPSC, Commerce), और आपका दैनिक मोबाइल स्क्रीन टाइम (Daily Screen Time)।</li>
                    <li><strong className="text-white">लॉग डेटा और एनालिटिक्स:</strong> हम आपकी सुरक्षा और वेबसाइट के परफॉर्मेंस को बेहतर बनाने के लिए बुनियादी डेटा जैसे IP एड्रेस, ब्राउज़र का प्रकार (Browser Type), और विज़िट का समय एकत्र कर सकते हैं।</li>
                    <li><strong className="text-white">भुगतान की जानकारी (Payment Data):</strong> जब आप हमारे प्रो रोडमैप (₹19) के लिए भुगतान करते हैं, तो सभी ट्रांजैक्शन्स हमारे सिक्योर पेमेंट गेटवे पार्टनर (Razorpay) के माध्यम से सुरक्षित रूप से प्रोसेस किए जाते हैं। हम अपने सर्वर पर आपके क्रेडिट/डेबिट कार्ड या नेट बैंकिंग के क्रेडेंशियल्स सेव नहीं करते हैं।</li>
                  </ul>
                </div>

                <div className="space-y-4 mt-6">
                  <h4 className="text-lg font-bold text-white">2. जानकारी का उपयोग (How We Use Your Information)</h4>
                  <p>हम एकत्र की गई जानकारी का उपयोग निम्नलिखित उद्देश्यों के लिए करते हैं:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Google AI Studio (Gemini API) के माध्यम से आपके इनपुट के आधार पर कस्टमाइज़्ड और मज़ेदार करियर रोस्ट रिस्पॉन्स जनरेट करने के लिए।</li>
                    <li>₹19 का प्रो करियर रोडमैप जनरेट करने और उसे डाउनलोड करने की सुविधा देने के लिए।</li>
                    <li>वेबसाइट के ट्रैफिक, टोटल विज़िट्स और कन्वर्ज़न रेट को ऐडमिन पैनल के ज़रिए ट्रैक और एनालाइज़ करने के लिए।</li>
                    <li>भविष्य में Google AdSense विज्ञापन दिखाने और Amazon Affiliate बुक रिकमेंडेशन्स को ऑप्टिमाइज़ करने के लिए।</li>
                  </ul>
                </div>

                <div className="space-y-4 mt-6">
                  <h4 className="text-lg font-bold text-white">3. डेटा शेयरिंग और थर्ड-पार्टी सर्विसेस (Data Sharing & Third-Party Services)</h4>
                  <p>हम आपका डेटा किसी भी अनधिकृत तीसरे पक्ष (Third Party) को नहीं बेचते हैं। बेहतर सर्विस देने के लिए हम केवल निम्नलिखित विश्वसनीय थर्ड-पार्टी एपीआई (APIs) और सर्विसेस का उपयोग करते हैं:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-white">Google AI Studio (Gemini API):</strong> आपके करियर इनपुट को प्रोसेस करके रोस्ट और एनालिसिस जनरेट करने के लिए।</li>
                    <li><strong className="text-white">Razorpay:</strong> आपके पेमेंट्स को 100% सुरक्षित और एन्क्रिप्टेड तरीके से प्रोसेस करने के लिए।</li>
                    <li><strong className="text-white">Hosting Partners (GitHub/Vercel/Render):</strong> हमारी वेबसाइट फ़ाइलों और डेटाबेस को सुरक्षित रूप से होस्ट करने के लिए।</li>
                  </ul>
                </div>

                <div className="space-y-4 mt-6">
                  <h4 className="text-lg font-bold text-white">4. डेटा सुरक्षा (Data Security)</h4>
                  <p>हम आपके डेटा को सुरक्षित रखने के लिए कमर्शियली एक्सेप्टेबल सुरक्षा उपायों का उपयोग करते हैं। वेबसाइट पर सभी डेटा ट्रांसफर SSL (HTTPS) एन्क्रिप्शन के माध्यम से सुरक्षित होते हैं। हालाँकि, इंटरनेट पर 100% सुरक्षा की गारंटी कोई नहीं दे सकता, इसलिए हम यूज़र्स को सलाह देते हैं कि वे कोई भी गोपनीय या पर्सनल सेंसिटिव जानकारी इनपुट बॉक्स में न डालें।</p>
                </div>
              </div>
            </div>
          )}
          {activeModal === 'Terms' && (
            <div className="space-y-6 text-sm text-zinc-300 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
              <div>
                <h3 className="text-xl font-bold text-[#39FF14] mb-2">TERMS & CONDITIONS (नियम एवं शर्तें)</h3>
                <p className="text-xs text-zinc-300 mb-6">Last Updated: May 23, 2026 | Jurisdiction: Republic of India</p>

                <p className="mb-6">Career Check Reality वेबसाइट का उपयोग करने से पहले कृपया इन नियमों और शर्तों (Terms & Conditions) को ध्यान से पढ़ें। इस वेबसाइट को एक्सेस या उपयोग करके, आप इन शर्तों और भारत के सभी लागू कानूनों का पालन करने के लिए बाध्य होने की सहमति देते हैं। यदि आप इन शर्तों से असहमत हैं, तो कृपया इस वेबसाइट का उपयोग न करें।</p>

                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white">1. सेवा का उद्देश्य और उपयोग की पात्रता (Eligibility & Purpose)</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>यह वेबसाइट केवल मनोरंजन (Entertainment), करियर अवेयरनेस और मोटिवेशनल उद्देश्यों के लिए बनाई गई है।</li>
                    <li>वेबसाइट का "Savage Roast Mode" एआई-जनरेटेड व्यंग्य और हास्य (Satire & Humor) पर आधारित है। इसे किसी भी प्रकार का व्यक्तिगत अपमान, मानसिक उत्पीड़न या वास्तविक करियर सलाह नहीं माना जाना चाहिए।</li>
                    <li>इस वेबसाइट का उपयोग करने के लिए यूज़र की आयु कम से कम 13 वर्ष होनी चाहिए।</li>
                  </ul>
                </div>

                <div className="space-y-4 mt-6">
                  <h4 className="text-lg font-bold text-white">2. पेमेंट्स और रिफंड पॉलिसी (Payments & Refund Policy)</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>वेबसाइट पर "Pro Roadmap" सर्विस के लिए ₹19 का एकमुश्त (One-time) शुल्क लिया जाता है।</li>
                    <li>चूंकि रोडमैप एक डिजिटल प्रोडक्ट/सर्विस है जो भुगतान के तुरंत बाद जनरेट हो जाती है, इसलिए भारतीय कानून के डिजिटल गुड्स नियमों के तहत <strong className="text-white">यह राशि पूरी तरह से नॉन-रिफंडेबल (Non-Refundable) है</strong>।</li>
                    <li>यदि पेमेंट कटने के बाद किसी तकनीकी खराबी के कारण आपका रोडमैप डाउनलोड नहीं होता है, तो आप ऐडमिन से संपर्क कर सकते हैं, वेरिफिकेशन के बाद आपको रोडमैप ईमेल कर दिया जाएगा।</li>
                  </ul>
                </div>

                <div className="space-y-4 mt-6">
                  <h4 className="text-lg font-bold text-white">3. बौद्धिक संपदा अधिकार (Intellectual Property Rights)</h4>
                  <p>इस वेबसाइट पर उपलब्ध सभी कंटेंट, डिज़ाइन, कोड, लोगो, और यूज़र इंटरफ़ेस (UI) "Career Check Reality" की अनन्य संपत्ति हैं। आप ऐडमिन की लिखित अनुमति के बिना हमारी वेबसाइट के कोड, लेआउट या ब्रांडिंग को कॉपी, मॉडिफाई या री-डिस्ट्रीब्यूट नहीं कर सकते। हालाँकि, यूज़र्स को अपने खुद के जनरेटेड रोस्ट स्क्रीनशॉट सोशल मीडिया (Instagram Reels, YouTube Shorts, WhatsApp) पर शेयर करने की पूरी अनुमति है।</p>
                </div>

                <div className="space-y-4 mt-6">
                  <h4 className="text-lg font-bold text-white">4. कानूनी अधिकार क्षेत्र (Jurisdiction)</h4>
                  <p>इन शर्तों से उत्पन्न होने वाले किसी भी प्रकार के कानूनी विवाद या दावों का निपटारा केवल भारत के कानूनों के तहत होगा और इसके लिए विशेष अधिकार क्षेत्र स्थानीय भारतीय अदालतें (Courts of India) होंगी।</p>
                </div>
              </div>
            </div>
          )}
          {activeModal === 'Disclaimer' && (
            <div className="space-y-6 text-sm text-zinc-300 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
              <div>
                <h3 className="text-xl font-bold text-[#39FF14] mb-2">LEGAL DISCLAIMER (अस्वीकरण)</h3>
                <p className="text-xs text-zinc-300 mb-6">Last Updated: May 23, 2026 | Jurisdiction: Republic of India</p>

                <div className="bg-[#18181B] border border-white/10 p-4 rounded-xl mb-6">
                  <p className="font-bold text-white mb-1">कृपया ध्यान दें:</p>
                  <p>इस वेबसाइट का उपयोग करने से पहले इस कानूनी अस्वीकरण को पढ़ना अनिवार्य है।</p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white">1. केवल मनोरंजन के लिए (For Entertainment Purposes Only)</h4>
                  <p>Career Check Reality द्वारा जनरेट किया गया "Savage Roast" पूरी तरह से आर्टिफिशियल इंटेलिजेंस (Google Gemini AI) द्वारा बनाया गया एक काल्पनिक और हास्यप्रद (Humorous) रिस्पॉन्स है। इसका उद्देश्य केवल मनोरंजन और यूज़र्स को एक मज़ेदार तरीके से मोबाइल स्क्रीन टाइम के प्रति सचेत करना है। हम किसी भी व्यक्ति, जाति, धर्म, प्रोफेशन या कम्युनिटी की भावनाओं को ठेस पहुँचाने का इरादा नहीं रखते हैं।</p>
                </div>

                <div className="space-y-4 mt-6">
                  <h4 className="text-lg font-bold text-white">2. कोई व्यावसायिक करियर सलाह नहीं (No Professional Career Advice)</h4>
                  <p>इस वेबसाइट पर मिलने वाला 'रोस्ट' या 'करियर सर्वाइवल स्कोर' कोई वास्तविक करियर प्रेडिक्शन या प्रोफेशनल गाइडेंस नहीं है। यूज़र को अपने करियर, कॉलेज, जॉब या पढ़ाई से जुड़े महत्वपूर्ण फैसले अपने व्यक्तिगत विवेक, रिसर्च और योग्य करियर काउंसलर्स की सलाह के आधार पर लेने चाहिए। इस वेबसाइट पर दिए गए कंटेंट के आधार पर लिए गए किसी भी जीवन या करियर के फैसले के नुकसान या लाभ के ज़िम्मेदार यूज़र स्वयं होंगे।</p>
                </div>

                <div className="space-y-4 mt-6">
                  <h4 className="text-lg font-bold text-white">3. एआई त्रुटियां और सटीकता की सीमा (AI Errors & Limitation of Liability)</h4>
                  <p>चूंकि रिस्पॉन्स एआई मॉडल (Generative AI) द्वारा रियल-टाइम में जनरेट किए जाते हैं, इसलिए इनमें तकनीकी त्रुटियां (Hallucinations) या गलत तथ्य हो सकते हैं। हम एआई द्वारा जनरेट की गई किसी भी जानकारी की 100% सटीकता, विश्वसनीयता या पूर्णता की गारंटी नहीं देते हैं। "Career Check Reality" या इसके डेवलपर्स/ऐडमिन किसी भी यूज़र को होने वाले किसी भी प्रकार के मानसिक, वित्तीय या प्रत्यक्ष/अप्रत्यक्ष नुकसान के लिए कानूनी रूप से उत्तरदायी (Liable) नहीं होंगे।</p>
                </div>

                <div className="space-y-4 mt-6">
                  <h4 className="text-lg font-bold text-white">4. एफिलिएट और विज्ञापनों का प्रकटीकरण (Affiliate & Ads Disclosure)</h4>
                  <p>यह वेबसाइट अपने खर्चों और मेंटेनेंस को चलाने के लिए मुद्रीकरण (Monetization) का उपयोग करती है। वेबसाइट पर दिखाए जाने वाले Google AdSense के विज्ञापन और रोडमैप में रिकमेंड की गई किताबों के Amazon Affiliate लिंक्स से डेवलपर को एक छोटा कमीशन प्राप्त हो सकता है। यूज़र किसी भी थर्ड-पार्टी लिंक पर क्लिक करने या अमेज़न से सामान खरीदने से पहले उनकी अपनी प्राइवेसी पॉलिसी और शर्तों को ज़रूर जांच लें。</p>
                </div>
              </div>
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
