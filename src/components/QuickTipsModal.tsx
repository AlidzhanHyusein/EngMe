import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, CheckSquare, Zap, MessageSquare } from "lucide-react";

const QuickTipsModal = ({ onOpen }: { onOpen: () => void }) => {
  const [step, setStep] = useState(0);
  const tips = [
    {
      title: "Welcome to The Atelier!",
      content: "Your journey to peak productivity starts here. Let's take a quick tour.",
      icon: <Sparkles className="text-primary" size={32} />
    },
    {
      title: "Missions & Points",
      content: "Complete missions to earn points and level up. Every task brings you closer to mastery.",
      icon: <CheckSquare className="text-secondary" size={32} />
    },
    {
      title: "AI Flow Assistant",
      content: "Check your dashboard for personalized AI-powered productivity tips tailored just for you.",
      icon: <Zap className="text-tertiary" size={32} />
    },
    {
      title: "Stay Social",
      content: "Share your progress and cheer on your teammates in the Social feed.",
      icon: <MessageSquare className="text-primary" size={32} />
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-surface-container-lowest max-w-md w-full rounded-[32px] p-8 shadow-2xl border border-outline-variant/10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-surface-container-low">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / tips.length) * 100}%` }}
          />
        </div>

        <div className="mt-4 flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            {tips[step].icon}
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight">{tips[step].title}</h3>
            <p className="text-on-surface-variant leading-relaxed">{tips[step].content}</p>
          </div>

          <div className="flex w-full gap-4 pt-4">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 font-bold text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-all"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (step < tips.length - 1) setStep(s => s + 1);
                else onOpen();
              }}
              className="flex-1 py-3 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {step < tips.length - 1 ? "Next" : "Get Started"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuickTipsModal;