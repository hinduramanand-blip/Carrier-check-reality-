import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Settings, BarChart3, LogOut, Save, MessageSquare, LayoutTemplate, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getSettings, saveSettings, getAnalytics, getFeedbacks, Feedback } from '../lib/store';

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [price, setPrice] = useState(9);
  const [roastMode, setRoastMode] = useState('Savage');
  const [razorpayLink, setRazorpayLink] = useState('');
  const [adSenseId, setAdSenseId] = useState('');
  const [customAdImageUrl, setCustomAdImageUrl] = useState('');
  const [customAdLink, setCustomAdLink] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementUrl, setAnnouncementUrl] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [amazonAffiliateTag, setAmazonAffiliateTag] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [customModules, setCustomModules] = useState<{ id: string, title: string, content: string }[]>([]);
  const [analytics, setAnalytics] = useState({ visits: 0, clicks: 0, roastsGenerated: 0, proUnlocks: 0, dailyViews: {} as Record<string, number> });
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const settings = getSettings();
    setPrice(settings.price);
    setRoastMode(settings.roastMode);
    setRazorpayLink(settings.razorpayLink || '');
    setAdSenseId(settings.adSenseId || '');
    setCustomAdImageUrl(settings.customAdImageUrl || '');
    setCustomAdLink(settings.customAdLink || '');
    setInstagramUrl(settings.instagramUrl || '');
    setTwitterUrl(settings.twitterUrl || '');
    setYoutubeUrl(settings.youtubeUrl || '');
    setShowAnnouncement(settings.showAnnouncement || false);
    setAnnouncementText(settings.announcementText || '');
    setAnnouncementUrl(settings.announcementUrl || '');
    setAdminNotes(settings.adminNotes || '');
    setAmazonAffiliateTag(settings.amazonAffiliateTag || '');
    setGeminiApiKey(settings.geminiApiKey || '');
    setCustomModules(settings.customModules || []);
    setAnalytics(getAnalytics());
    setFeedbacks(getFeedbacks());
  }, []);

  const handleSave = () => {
    saveSettings({ 
      price, 
      roastMode, 
      razorpayLink, 
      adSenseId, 
      customAdImageUrl,
      customAdLink,
      instagramUrl, 
      twitterUrl, 
      youtubeUrl,
      showAnnouncement,
      announcementText,
      announcementUrl,
      adminNotes,
      amazonAffiliateTag,
      geminiApiKey,
      customModules
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const chartData = Object.entries(analytics.dailyViews || {}).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: count
  }));

  if (chartData.length === 0) {
    chartData.push({ date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), views: 0 });
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-6 py-12"
    >
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/20 rounded-2xl border border-red-500/30">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Admin Dashboard</h1>
            <p className="text-zinc-400">Manage app settings and view analytics.</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Settings Panel */}
        <div className="bg-[#18181B] rounded-3xl p-8 border border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-[#39FF14]" />
            <h2 className="text-xl font-display font-bold text-white">App Settings</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">Roadmap Price (₹)</label>
              <input 
                type="number" 
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-[#09090B] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">Roast Mode</label>
              <select 
                value={roastMode}
                onChange={(e) => setRoastMode(e.target.value)}
                className="w-full bg-[#09090B] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-all appearance-none"
              >
                <option value="Mild">Mild (Gentle nudge)</option>
                <option value="Savage">Savage (Brutal reality)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">Gemini API Key</label>
              <input 
                type="password" 
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-[#09090B] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-all"
              />
              <p className="text-xs text-zinc-500 mt-2">Leave empty to use default key. Add your own key if you want to change it later without touching code.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">Amazon Affiliate Tag</label>
              <input 
                type="text" 
                value={amazonAffiliateTag}
                onChange={(e) => setAmazonAffiliateTag(e.target.value)}
                placeholder="e.g. yourtag-21"
                className="w-full bg-[#09090B] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-all"
              />
              <p className="text-xs text-zinc-500 mt-2">Used to monetize book recommendations in the Pro Roadmap.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">Razorpay Link</label>
              <input 
                type="url" 
                value={razorpayLink}
                onChange={(e) => setRazorpayLink(e.target.value)}
                placeholder="https://rzp.io/l/..."
                className="w-full bg-[#09090B] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-all"
              />
            </div>

            <div className="pt-4 border-t border-white/5">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Future & Monetization</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">AdSense Client ID</label>
                  <input 
                    type="text" 
                    value={adSenseId}
                    onChange={(e) => setAdSenseId(e.target.value)}
                    placeholder="ca-pub-..."
                    className="w-full bg-[#09090B] border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-all"
                  />
                </div>
                <div className="pt-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Custom Ad Image URL (Direct Sponsorship)</label>
                  <input 
                    type="url" 
                    value={customAdImageUrl}
                    onChange={(e) => setCustomAdImageUrl(e.target.value)}
                    placeholder="https://example.com/ad-banner.jpg"
                    className="w-full bg-[#09090B] border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Custom Ad Click Link</label>
                  <input 
                    type="url" 
                    value={customAdLink}
                    onChange={(e) => setCustomAdLink(e.target.value)}
                    placeholder="https://sponsor-website.com"
                    className="w-full bg-[#09090B] border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-all"
                  />
                </div>
                <div className="pt-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Instagram URL</label>
                  <input 
                    type="url" 
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full bg-[#09090B] border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Twitter/X URL</label>
                  <input 
                    type="url" 
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://twitter.com/..."
                    className="w-full bg-[#09090B] border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">YouTube URL</label>
                  <input 
                    type="url" 
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full bg-[#09090B] border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Custom Announcement Banner</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="showAnnouncement"
                    checked={showAnnouncement}
                    onChange={(e) => setShowAnnouncement(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-[#09090B] text-[#39FF14] focus:ring-[#39FF14]"
                  />
                  <label htmlFor="showAnnouncement" className="text-sm font-medium text-white">Enable Banner</label>
                </div>
                
                {showAnnouncement && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Banner Text</label>
                      <input 
                        type="text" 
                        value={announcementText}
                        onChange={(e) => setAnnouncementText(e.target.value)}
                        placeholder="e.g. Follow us on Instagram for updates!"
                        className="w-full bg-[#09090B] border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Banner Link (Optional)</label>
                      <input 
                        type="url" 
                        value={announcementUrl}
                        onChange={(e) => setAnnouncementUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-[#09090B] border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-all"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="w-full bg-[#39FF14] text-black font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-[#39FF14]/90 transition-colors"
            >
              <Save className="w-5 h-5" />
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Analytics Panel */}
        <div className="bg-[#18181B] rounded-3xl p-8 border border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-[#04D9FF]" />
            <h2 className="text-xl font-display font-bold text-white">Analytics</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#09090B] p-6 rounded-2xl border border-white/5">
              <p className="text-zinc-400 text-sm uppercase tracking-wider mb-2">Total Earnings</p>
              <p className="text-4xl font-display font-bold text-[#39FF14]">₹{analytics.proUnlocks * 9}</p>
            </div>
            <div className="bg-[#09090B] p-6 rounded-2xl border border-white/5">
              <p className="text-zinc-400 text-sm uppercase tracking-wider mb-2">Transactions</p>
              <p className="text-4xl font-display font-bold text-white">{analytics.proUnlocks}</p>
            </div>
            <div className="bg-[#09090B] p-6 rounded-2xl border border-white/5">
              <p className="text-zinc-400 text-sm uppercase tracking-wider mb-2">Total Visits</p>
              <p className="text-4xl font-display font-bold text-white">{analytics.visits}</p>
            </div>
            <div className="bg-[#09090B] p-6 rounded-2xl border border-white/5">
              <p className="text-zinc-400 text-sm uppercase tracking-wider mb-2">Total Roasts</p>
              <p className="text-4xl font-display font-bold text-[#04D9FF]">{analytics.roastsGenerated}</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-[#04D9FF]/10 border border-[#04D9FF]/20 rounded-xl mb-6">
            <p className="text-sm text-[#04D9FF]">
              Conversion Rate: {analytics.visits > 0 ? ((analytics.proUnlocks / analytics.visits) * 100).toFixed(1) : 0}%
            </p>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Daily Views</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#a1a1aa" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#a1a1aa" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181B', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ color: '#04D9FF' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#04D9FF" 
                    strokeWidth={3}
                    dot={{ fill: '#04D9FF', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#39FF14' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* User Feedback Panel */}
      <div className="mt-8 bg-[#18181B] rounded-3xl p-8 border border-white/5 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-6 h-6 text-[#FF10F0]" />
          <h2 className="text-xl font-display font-bold text-white">User Feedback & Suggestions</h2>
        </div>
        
        {feedbacks.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 bg-[#09090B] rounded-xl border border-white/5">
            No feedback received yet.
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {[...feedbacks].reverse().map((fb) => (
              <div key={fb.id} className="bg-[#09090B] p-5 rounded-xl border border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-[#39FF14]">{fb.user}</span>
                  <span className="text-xs text-zinc-500">
                    {new Date(fb.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-zinc-300 text-sm whitespace-pre-wrap">{fb.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Future Custom Content Placeholder */}
      <div className="mt-8 bg-[#18181B] rounded-3xl p-8 border border-white/5 shadow-2xl border-dashed border-[#39FF14]/30">
        <div className="flex items-center gap-3 mb-6">
          <LayoutTemplate className="w-6 h-6 text-[#39FF14]" />
          <h2 className="text-xl font-display font-bold text-white">Future Custom Content (Admin Only)</h2>
        </div>
        
        <p className="text-sm text-zinc-400 mb-6">
          Yeh section future updates ke liye reserved hai. Yahan aap naye features, custom HTML, ya promotional blocks manage kar payenge. (Aadmi ke liye bas)
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Admin Notes / Draft Content</label>
            <textarea 
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Type your ideas, draft content, or future plans here..."
              className="w-full bg-[#09090B] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] resize-none transition-all"
            />
          </div>
          
          <div className="space-y-4">
            {customModules.map((module, index) => (
              <div key={module.id} className="p-4 bg-[#09090B] border border-white/10 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <input 
                    type="text" 
                    value={module.title}
                    onChange={(e) => {
                      const newModules = [...customModules];
                      newModules[index].title = e.target.value;
                      setCustomModules(newModules);
                    }}
                    placeholder="Module Title"
                    className="bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-[#39FF14] px-2 py-1 w-2/3"
                  />
                  <button 
                    onClick={() => {
                      const newModules = customModules.filter(m => m.id !== module.id);
                      setCustomModules(newModules);
                    }}
                    className="text-red-500 hover:text-red-400 text-sm font-bold"
                  >
                    Remove
                  </button>
                </div>
                <textarea 
                  rows={3}
                  value={module.content}
                  onChange={(e) => {
                    const newModules = [...customModules];
                    newModules[index].content = e.target.value;
                    setCustomModules(newModules);
                  }}
                  placeholder="Module Content..."
                  className="w-full bg-[#18181B] border border-white/10 rounded-lg py-2 px-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#39FF14] resize-none text-sm"
                />
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => {
              setCustomModules([...customModules, { id: Date.now().toString(), title: '', content: '' }]);
            }}
            className="w-full bg-[#39FF14]/20 text-[#39FF14] font-bold rounded-xl py-3 border border-[#39FF14]/50 hover:bg-[#39FF14]/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Add New Content Module
          </button>
          
          <button 
            onClick={handleSave}
            className="w-full bg-[#39FF14] text-black font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-[#39FF14]/90 transition-colors mt-4"
          >
            <Save className="w-5 h-5" />
            {saved ? 'Saved!' : 'Save Modules'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
