import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { getSettings } from '../lib/store';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Namaste! Main aapka Career & Support Assistant hoon. Kaise help kar sakta hoon aaj?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const settings = getSettings();
      const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: 'You are a helpful, friendly Career & Support Assistant for the "Career Reality Check" app. You answer user queries in a friendly Hinglish (Hindi + English) tone. Keep answers short, encouraging, and slightly witty.',
        },
      });

      // Send previous context (simplified for this demo by just sending the latest message, 
      // but ideally we'd pass history. For now, just send the new message)
      const response = await chat.sendMessage({ message: userMessage });
      
      setMessages(prev => [...prev, { role: 'model', text: response.text || 'Sorry, main abhi thoda busy hoon. Try again later!' }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Oops, kuch error aagaya. Please try again!' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-4 md:bottom-6 md:right-6 p-4 bg-[#04D9FF] text-black rounded-full shadow-[0_0_20px_rgba(4,217,255,0.3)] hover:scale-110 transition-transform z-40 ${isOpen ? 'hidden' : 'block'}`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 md:bottom-6 md:right-6 w-[calc(100vw-32px)] md:w-[350px] h-[500px] max-h-[calc(100vh-120px)] bg-[#18181B] border border-[#04D9FF]/30 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-[#09090B] border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#04D9FF]/20 rounded-lg text-[#04D9FF]">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white">Support Assistant</h3>
                  <p className="text-xs text-[#04D9FF]">Online</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#04D9FF] text-black rounded-br-sm' 
                      : 'bg-[#27272A] text-zinc-200 rounded-bl-sm border border-white/5'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#27272A] text-zinc-400 p-3 rounded-2xl rounded-bl-sm border border-white/5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-[#09090B] border-t border-white/5">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-[#18181B] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#04D9FF] focus:ring-1 focus:ring-[#04D9FF] transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-2 p-2 text-[#04D9FF] hover:bg-[#04D9FF]/10 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
