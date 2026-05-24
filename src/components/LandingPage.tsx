import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Smartphone, Star, Shield, Zap, TrendingUp, Download, PlayCircle } from 'lucide-react';

interface LandingPageProps {
  onTryOnline: () => void;
  onDownloadApp: () => void;
  isStandalone: boolean;
}

export default function LandingPage({ onTryOnline, onDownloadApp, isStandalone }: LandingPageProps) {
  return (
    <div className="w-full flex justify-center items-center flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full max-w-6xl mx-auto px-6 pt-20 pb-32 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#39FF14]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-400 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
            AI-Powered Career Roast & Roadmap
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight mb-8">
            Get Your <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39FF14] to-[#04D9FF]">Career Reality Check</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Stop daydreaming and start doing. Get a brutal, honest assessment of your habits, followed by an actionable step-by-step roadmap to achieve your actual dream job.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onTryOnline}
              className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
            >
              Try Online Free <ArrowRight className="w-5 h-5" />
            </button>
            
            {!isStandalone && (
              <button
                onClick={onDownloadApp}
                className="w-full sm:w-auto px-8 py-4 bg-[#18181B] border border-white/10 text-white rounded-xl font-bold text-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                <Smartphone className="w-5 h-5" /> Download App
              </button>
            )}
          </div>
        </motion.div>
      </section>

      {/* Demo / Stats Section */}
      <section className="w-full bg-[#09090B] border-y border-white/5 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center mb-24">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-12">See it in Action</h2>
            <div className="relative rounded-3xl overflow-hidden border border-[#39FF14]/30 shadow-[0_0_50px_rgba(57,255,20,0.15)] bg-[#18181B] aspect-video flex items-center justify-center group cursor-pointer" onClick={onTryOnline}>
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1607706189992-eae578626c86?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity" />
               <div className="relative z-10 flex flex-col items-center">
                 <PlayCircle className="w-20 h-20 text-[#39FF14] mb-4 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-lg rounded-full bg-black/50" />
                 <span className="text-lg font-bold text-white tracking-widest uppercase drop-shadow-md">Try Live Demo</span>
               </div>
            </div>
        </div>

        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Brutal Roast", desc: "We analyze your screen time vs goals and give it to you straight." },
              { icon: TrendingUp, title: "Actionable Roadmap", desc: "A personalized 7-day or 30-day plan to fix your habits." },
              { icon: Shield, title: "Private & Secure", desc: "Your data is not stored. It's processed and instantly deleted." }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#18181B] border border-white/5 p-8 rounded-3xl"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-[#39FF14]">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How it Works Section */}
      <section className="w-full py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-zinc-400 text-lg">Three simple steps to transform your career path.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Share Your Goals", desc: "Enter your dream job and honestly tell us your daily social media screen time." },
              { step: "02", title: "Face Reality", desc: "Get a personalized AI roast that compares your habits to what it actually takes to succeed." },
              { step: "03", title: "Get the Roadmap", desc: "Unlock a step-by-step 30-day plan designed specifically for your chosen career." }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-7xl font-bold text-white/5 mb-4 font-display">{item.step}</div>
                <h4 className="text-2xl font-bold text-white mb-3">{item.title}</h4>
                <p className="text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Reviews Section */}
      <section className="w-full bg-[#18181B] py-24 border-y border-white/5">
         <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Loved by Students</h2>
            <p className="text-zinc-400 text-lg">Don't just take our word for it.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Rahul S.", role: "Engineering Student", text: "The roast hurt my ego but the roadmap saved my semester. Highly recommend the Pro version." },
              { name: "Priya M.", role: "UPSC Aspirant", text: "Exactly the reality check I needed. Stopped scrolling reels and started studying the same day." },
              { name: "Amit K.", role: "Aspiring Developer", text: "Brutal. Honest. And the daily action items are incredibly specific to learning MERN stack." }
            ].map((review, idx) => (
              <div key={idx} className="bg-[#09090B] p-8 rounded-3xl border border-white/5">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-zinc-300 mb-6 italic">"{review.text}"</p>
                <div>
                  <div className="font-bold text-white">{review.name}</div>
                  <div className="text-sm text-zinc-500">{review.role}</div>
                </div>
              </div>
            ))}
          </div>
         </div>
      </section>
      
      {/* Bottom CTA */}
      <section className="w-full py-32 text-center px-6">
        <h2 className="text-4xl md:text-6xl font-bold font-display tracking-tight text-white mb-8">
          Ready to face the <span className="text-[#39FF14]">truth?</span>
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onTryOnline}
            className="px-8 py-4 bg-[#39FF14] text-black rounded-xl font-bold text-lg hover:bg-[#32e612] transition-colors flex items-center gap-2"
          >
            <PlayCircle className="w-5 h-5" /> Start Now
          </button>
        </div>
      </section>
    </div>
  );
}
