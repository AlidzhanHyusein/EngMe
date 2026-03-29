import React from "react";
import { Award } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "../lib/utils";
import { BADGES } from "../constants";

const BadgeList = ({ badgeIds }: { badgeIds: string[] }) => {
  const earnedBadges = BADGES.filter(b => badgeIds.includes(b.id));

  if (earnedBadges.length === 0) return <p className="text-xs text-on-surface-variant font-medium italic">No badges earned yet. Complete missions to unlock them!</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {earnedBadges.map(badge => {
        const Icon = (LucideIcons as any)[badge.iconName] || Award;
        return (
          <div
            key={badge.id}
            className="group relative"
          >
            <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center border border-outline-variant/10 hover:border-primary/30 transition-all cursor-help">
              <Icon className={cn("w-6 h-6", badge.color)} />
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-on-surface text-surface text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center shadow-xl">
              <p className="font-black uppercase tracking-tighter mb-1">{badge.name}</p>
              <p className="font-medium leading-tight opacity-80">{badge.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BadgeList;