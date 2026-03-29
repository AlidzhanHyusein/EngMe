import { 
  CheckSquare, 
  Award, 
  Zap, 
  Flame, 
  Star, 
  ShieldCheck, 
  Sparkles, 
  Trophy, 
  Target, 
  Rocket 
} from "lucide-react";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
  criteria: {
    type: 'tasks' | 'streak' | 'points';
    value: number;
  };
}

export const BADGES: BadgeDefinition[] = [
  {
    id: 'first-mission',
    name: 'First Mission',
    description: 'Completed your first mission!',
    iconName: 'CheckSquare',
    color: 'text-primary',
    criteria: { type: 'tasks', value: 1 }
  },
  {
    id: 'mission-veteran',
    name: 'Mission Veteran',
    description: 'Completed 10 missions!',
    iconName: 'Award',
    color: 'text-secondary',
    criteria: { type: 'tasks', value: 10 }
  },
  {
    id: 'mission-master',
    name: 'Mission Master',
    description: 'Completed 50 missions!',
    iconName: 'Zap',
    color: 'text-tertiary',
    criteria: { type: 'tasks', value: 50 }
  },
  {
    id: 'on-fire',
    name: 'On Fire',
    description: 'Reached a 3-day streak!',
    iconName: 'Flame',
    color: 'text-orange-500',
    criteria: { type: 'streak', value: 3 }
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Reached a 7-day streak!',
    iconName: 'Flame',
    color: 'text-red-500',
    criteria: { type: 'streak', value: 7 }
  },
  {
    id: 'legendary',
    name: 'Legendary',
    description: 'Reached a 30-day streak!',
    iconName: 'Trophy',
    color: 'text-amber-500',
    criteria: { type: 'streak', value: 30 }
  },
  {
    id: 'point-collector',
    name: 'Point Collector',
    description: 'Reached 1,000 points!',
    iconName: 'Star',
    color: 'text-yellow-500',
    criteria: { type: 'points', value: 1000 }
  },
  {
    id: 'point-baron',
    name: 'Point Baron',
    description: 'Reached 5,000 points!',
    iconName: 'Target',
    color: 'text-blue-500',
    criteria: { type: 'points', value: 5000 }
  },
  {
    id: 'point-king',
    name: 'Point King',
    description: 'Reached 10,000 points!',
    iconName: 'Rocket',
    color: 'text-purple-500',
    criteria: { type: 'points', value: 10000 }
  }
];
