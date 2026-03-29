import React from "react";
import { motion } from "framer-motion";
import {
  CheckSquare,
  MessageSquare,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Trophy,
  ArrowRight,
  Zap
} from "lucide-react";

const LandingPage = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <div className="min-h-screen bg-surface overflow-hidden">
      {/* Hero Section */}
      <header className="relative pt-20 pb-32 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest mb-4"
          >
            <Sparkles size={14} /> The Future of Work is Kinetic
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-on-surface leading-[0.9]"
          >
            THE <span className="text-primary">ATELIER</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-xl text-on-surface-variant font-medium leading-relaxed"
          >
            A high-performance workspace designed for flow. Gamify your productivity,
            connect with your team, and master your craft in real-time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-primary text-white font-black px-10 py-5 rounded-2xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-lg flex items-center justify-center gap-3"
            >
              Get Started <ArrowRight size={24} />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto bg-surface-container-low text-on-surface font-black px-10 py-5 rounded-2xl hover:bg-surface-container-high transition-all text-lg"
            >
              Explore Features
            </a>
          </motion.div>
        </div>

        {/* Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black tracking-tight">Everything you need to excel.</h2>
            <p className="text-on-surface-variant font-medium">Built for modern teams who value speed, clarity, and growth.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<CheckSquare className="text-primary" size={32} />}
              title="Mission Control"
              description="Turn tasks into missions. Earn points, level up, and maintain your streak with our gamified productivity engine."
            />
            <FeatureCard
              icon={<MessageSquare className="text-secondary" size={32} />}
              title="Social Momentum"
              description="Share updates, celebrate wins, and react to your team's progress in a real-time social feed."
            />
            <FeatureCard
              icon={<TrendingUp className="text-tertiary" size={32} />}
              title="Team Insights"
              description="Visualize performance with advanced analytics. Track department growth and individual contributions."
            />
            <FeatureCard
              icon={<ShieldCheck className="text-primary" size={32} />}
              title="Secure Workspace"
              description="Enterprise-grade security with role-based access control and PII protection for your team's data."
            />
            <FeatureCard
              icon={<Sparkles className="text-secondary" size={32} />}
              title="AI-Powered"
              description="Leverage Gemini AI to generate task descriptions and provide productivity insights tailored to your flow."
            />
            <FeatureCard
              icon={<Trophy className="text-tertiary" size={32} />}
              title="Leaderboards"
              description="Healthy competition fuels excellence. See where you stand in your department and the global workspace."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-outline-variant/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <span className="text-xl font-black tracking-tight">ATELIER</span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">© 2026 Atelier Kinetic Workspace. All rights reserved.</p>
          <div className="flex gap-6">
            <button onClick={onGetStarted} className="text-sm font-bold hover:text-primary transition-colors">Login</button>
            <button onClick={onGetStarted} className="text-sm font-bold hover:text-primary transition-colors">Register</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-8 bg-surface rounded-3xl border border-outline-variant/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
    <div className="w-16 h-16 bg-surface-container-low rounded-2xl flex items-center justify-center">
      {icon}
    </div>
    <h3 className="text-xl font-black tracking-tight">{title}</h3>
    <p className="text-on-surface-variant text-sm leading-relaxed font-medium">{description}</p>
  </div>
);

export default LandingPage;