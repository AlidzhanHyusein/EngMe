import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Award } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "../lib/utils";
import { BadgeDefinition } from "../types";

const BadgeAwardPopup = ({ badge, onComplete }: { badge: BadgeDefinition, onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const Icon = (LucideIcons as any)[badge.iconName] || Award;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 100 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.5, y: -100 }}
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] w-full max-w-sm px-4"
    >
      <div className="bg-surface-container-highest border-2 border-primary p-6 rounded-[32px] shadow-2xl flex items-center gap-6">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
          <Icon className={cn("w-10 h-10", badge.color)} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">New Badge Earned!</p>
          <h3 className="text-xl font-black tracking-tight">{badge.name}</h3>
          <p className="text-xs text-on-surface-variant font-medium">{badge.description}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default BadgeAwardPopup;