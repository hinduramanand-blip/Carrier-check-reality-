export const getSettings = () => {
  const defaultSettings = { 
    price: 19, 
    roastMode: 'Savage', 
    razorpayLink: 'https://razorpay.me/@carriercheckreality9?amount=19',
    adSenseId: '',
    customAdImageUrl: '',
    customAdLink: '',
    instagramUrl: '',
    twitterUrl: '',
    youtubeUrl: '',
    showAnnouncement: false,
    announcementText: '',
    announcementUrl: '',
    adminNotes: '',
    amazonAffiliateTag: '',
    geminiApiKey: '',
    customModules: [] as { id: string, title: string, content: string }[]
  };
  const saved = localStorage.getItem('app_settings');
  const parsed = saved ? JSON.parse(saved) : {};
  
  // Ensure we use the default razorpay link if the saved one is empty or the old one without amount
  if (parsed && (!parsed.razorpayLink || parsed.razorpayLink === 'https://razorpay.me/@carriercheckreality9')) {
    parsed.razorpayLink = defaultSettings.razorpayLink;
  }
  
  return { ...defaultSettings, ...parsed };
};

export const saveSettings = (settings: { 
  price: number; 
  roastMode: string; 
  razorpayLink: string;
  adSenseId?: string;
  customAdImageUrl?: string;
  customAdLink?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  showAnnouncement?: boolean;
  announcementText?: string;
  announcementUrl?: string;
  adminNotes?: string;
  amazonAffiliateTag?: string;
  geminiApiKey?: string;
  customModules?: { id: string, title: string, content: string }[];
}) => {
  localStorage.setItem('app_settings', JSON.stringify(settings));
};

export const getAnalytics = () => {
  const defaultAnalytics = { visits: 0, clicks: 0, roastsGenerated: 0, proUnlocks: 0, dailyViews: {} as Record<string, number> };
  const saved = localStorage.getItem('app_analytics');
  const parsed = saved ? JSON.parse(saved) : defaultAnalytics;
  if (!parsed.dailyViews) parsed.dailyViews = {};
  if (parsed.roastsGenerated === undefined) parsed.roastsGenerated = 0;
  if (parsed.proUnlocks === undefined) parsed.proUnlocks = 0;
  return parsed;
};

export const incrementVisits = () => {
  const analytics = getAnalytics();
  analytics.visits += 1;
  
  // Track daily views
  const today = new Date().toISOString().split('T')[0];
  analytics.dailyViews[today] = (analytics.dailyViews[today] || 0) + 1;
  
  localStorage.setItem('app_analytics', JSON.stringify(analytics));
};

export const incrementClicks = () => {
  const analytics = getAnalytics();
  analytics.clicks += 1;
  localStorage.setItem('app_analytics', JSON.stringify(analytics));
};

export const incrementRoasts = () => {
  const analytics = getAnalytics();
  analytics.roastsGenerated += 1;
  localStorage.setItem('app_analytics', JSON.stringify(analytics));
};

export const incrementProUnlocks = () => {
  const analytics = getAnalytics();
  analytics.proUnlocks += 1;
  localStorage.setItem('app_analytics', JSON.stringify(analytics));
};

export interface Feedback {
  id: string;
  text: string;
  date: string;
  user?: string;
}

export const getFeedbacks = (): Feedback[] => {
  const saved = localStorage.getItem('app_feedbacks');
  return saved ? JSON.parse(saved) : [];
};

export const addFeedback = (text: string, user?: string) => {
  const feedbacks = getFeedbacks();
  feedbacks.push({
    id: Date.now().toString(),
    text,
    date: new Date().toISOString(),
    user: user || 'Anonymous'
  });
  localStorage.setItem('app_feedbacks', JSON.stringify(feedbacks));
};
