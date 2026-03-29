import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, ArrowRight } from "lucide-react";
import { UserProfile } from "../types";

const OnboardingScreen = ({ profile, onComplete }: { profile: UserProfile, onComplete: (updates: Partial<UserProfile>) => void }) => {
  const [department, setDepartment] = useState("");
  const [team, setTeam] = useState("");
  const [bio, setBio] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-outline-variant/10 space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
            <UserPlus size={32} />
          </div>
          <h2 className="text-3xl font-black tracking-tight">Welcome, {profile.displayName.split(" ")[0]}!</h2>
          <p className="text-on-surface-variant">Let's set up your workspace profile.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Department</label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g., Engineering, HR, Marketing"
              className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Team</label>
            <input
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="e.g., Frontend, Talent Acquisition"
              className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a bit about yourself..."
              className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary resize-none"
              rows={3}
            />
          </div>
        </div>

        <button
          onClick={() => onComplete({ department, team, bio, onboarded: true })}
          disabled={!department || !team}
          className="w-full bg-primary text-white font-black py-4 rounded-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
        >
          Enter The Atelier <ArrowRight size={20} />
        </button>
      </motion.div>
    </div>
  );
};

export default OnboardingScreen;