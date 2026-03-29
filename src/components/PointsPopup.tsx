import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const PointsPopup = ({ points, onComplete }: { points: number, onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: -100 }}
      exit={{ opacity: 0, scale: 1.5, y: -200 }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100]"
    >
      <div className="bg-tertiary-container/90 backdrop-blur-md px-8 py-6 rounded-3xl shadow-2xl border-4 border-tertiary flex flex-col items-center gap-2">
        <motion.div
          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <Star className="w-16 h-16 text-tertiary fill-tertiary" />
        </motion.div>
        <h2 className="text-4xl font-black text-tertiary">+{points} PTS</h2>
        <p className="text-on-tertiary-container font-bold uppercase tracking-widest text-xs">Mission Accomplished!</p>
      </div>
    </motion.div>
  );
};

export default PointsPopup;