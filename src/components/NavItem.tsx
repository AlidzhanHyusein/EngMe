import React from "react";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all relative overflow-hidden",
        active
          ? "bg-primary text-white shadow-lg shadow-primary/20"
          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
      )}
    >
      {active && (
        <motion.div
          layoutId="nav-active"
          className="absolute inset-0 bg-primary rounded-xl -z-10"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className={cn("transition-transform", active && "scale-105")}>{icon}</span>
      {label}
    </motion.button>
  );
}

export default NavItem;
