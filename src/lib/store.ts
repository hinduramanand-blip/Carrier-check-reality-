import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export interface Settings {
  price: number; 
  roastMode: string; 
  razorpayLink: string;
  adSenseId?: string;
  customAdImageUrl?: string;
  customAdLink?: string;
  adminEmail?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  showAnnouncement?: boolean;
  announcementText?: string;
  announcementUrl?: string;
  showPopupNote?: boolean;
  popupNoteTitle?: string;
  popupNoteText?: string;
  adminNotes?: string;
  amazonAffiliateTag?: string;
  geminiApiKey?: string;
  customModules?: { id: string, title: string, content: string }[];
}

export const defaultSettings: Settings = { 
  price: 19, 
  roastMode: 'Savage', 
  razorpayLink: 'https://razorpay.me/@carriercheckreality9',
  adSenseId: '',
  customAdImageUrl: '',
  customAdLink: '',
  adminEmail: '',
  instagramUrl: '',
  twitterUrl: '',
  youtubeUrl: '',
  showAnnouncement: false,
  announcementText: '',
  announcementUrl: '',
  showPopupNote: false,
  popupNoteTitle: '',
  popupNoteText: '',
  adminNotes: '',
  amazonAffiliateTag: '',
  geminiApiKey: '',
  customModules: []
};

const defaultAnalytics = { visits: 0, clicks: 0, roastsGenerated: 0, proUnlocks: 0, dailyViews: {} as Record<string, number> };

export const getSettings = async () => {
  try {
    const docRef = doc(db, 'config', 'settings');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...defaultSettings, ...docSnap.data() } as Settings;
    } else {
      await setDoc(docRef, defaultSettings);
      return defaultSettings;
    }
  } catch (e) {
    console.error("Failed to load settings from Firebase", e);
    return defaultSettings; // fallback
  }
};

export const subscribeSettings = (callback: (settings: Settings) => void) => {
  const docRef = doc(db, 'config', 'settings');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ ...defaultSettings, ...docSnap.data() } as Settings);
    } else {
      setDoc(docRef, defaultSettings).catch(console.error);
      callback(defaultSettings);
    }
  }, (error) => {
    console.error("Failed to subscribe to settings", error);
    callback(defaultSettings);
  });
};

export const saveSettings = async (settings: Settings) => {
  try {
    const docRef = doc(db, 'config', 'settings');
    await setDoc(docRef, settings, { merge: true });
  } catch (e) {
    console.error("Failed to save settings", e);
  }
};

export const getAnalytics = async () => {
  try {
    const docRef = doc(db, 'config', 'analytics');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (!data.dailyViews) data.dailyViews = {};
      return { ...defaultAnalytics, ...data };
    } else {
      await setDoc(docRef, defaultAnalytics);
      return defaultAnalytics;
    }
  } catch (e) {
    console.error("Failed to load analytics from Firebase", e);
    return defaultAnalytics; // fallback
  }
};

export const subscribeAnalytics = (callback: (analytics: any) => void) => {
  const docRef = doc(db, 'config', 'analytics');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (!data.dailyViews) data.dailyViews = {};
      callback({ ...defaultAnalytics, ...data });
    } else {
      setDoc(docRef, defaultAnalytics).catch(console.error);
      callback(defaultAnalytics);
    }
  }, (error) => {
    console.error("Failed to subscribe to analytics", error);
    callback(defaultAnalytics);
  });
};

export const incrementVisits = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'config', 'analytics');
    
    // Quick initialize document if it doesn't exist to prevent updateDoc failing
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        visits: 1,
        clicks: 0,
        roastsGenerated: 0,
        proUnlocks: 0,
        dailyViews: { [today]: 1 }
      });
      return;
    }

    await updateDoc(docRef, {
      visits: increment(1),
      [`dailyViews.${today}`]: increment(1)
    });
  } catch (e) {
    console.error("Failed to increment visits", e);
  }
};

export const incrementClicks = async () => {
  try {
    const docRef = doc(db, 'config', 'analytics');
    await updateDoc(docRef, { clicks: increment(1) });
  } catch (e) {
    console.error("Failed to increment clicks", e);
  }
};

export const incrementRoasts = async () => {
  try {
    const docRef = doc(db, 'config', 'analytics');
    await updateDoc(docRef, { roastsGenerated: increment(1) });
  } catch (e) {
    console.error("Failed to increment roasts", e);
  }
};

export const incrementProUnlocks = async () => {
  try {
    const docRef = doc(db, 'config', 'analytics');
    await updateDoc(docRef, { proUnlocks: increment(1) });
  } catch (e) {
    console.error("Failed to increment pro unlocks", e);
  }
};

export interface Feedback {
  id: string;
  text: string;
  date: string;
  user?: string;
  createdAt: string;
}

export const getFeedbacks = async (): Promise<Feedback[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'feedback'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
  } catch (e) {
    console.error("Failed to get feedbacks", e);
    return [];
  }
};

export const addFeedback = async (text: string, user?: string) => {
  try {
    await addDoc(collection(db, 'feedback'), {
      text,
      user: user || 'Anonymous',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to add feedback", e);
  }
};
