export type UserRole = "admin" | "hr" | "member";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: UserRole;
  department?: string;
  team?: string;
  bio?: string;
  points: number;
  streak: number;
  badges: string[];
  completedTasksCount: number;
  onboarded: boolean;
  uuid?: string;
}

export type TaskCategory = "Work" | "Fun" | "Wellness";
export type TaskDifficulty = "Entry" | "Intermediate" | "Advanced" | "Epic";
export type TaskStatus = "todo" | "in-progress" | "completed";

export interface WorkspaceTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  points: number;
  assignedTo: string[];
  status: TaskStatus;
  createdAt: any;
}

export type FeedType = "post" | "milestone" | "streak";

export interface FeedItem {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  type: FeedType;
  likes: string[];
  reactions?: Record<string, string[]>;
  createdAt: any;
  mediaUrl?: string;
  mediaType?: "image" | "video";
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: RewardCategory;
  imageUrl?: string;
  available: boolean;
  createdBy: string; // HR or Admin UID
  createdAt: any;
}

export type RewardCategory = "Gift Cards" | "Extra Time Off" | "Equipment" | "Experiences" | "Recognition";

export interface RewardRedemption {
  id: string;
  rewardId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rewardName: string;
  pointsSpent: number;
  status: RedemptionStatus;
  requestedAt: any;
  approvedAt?: any;
  approvedBy?: string;
  notes?: string;
}

export type RedemptionStatus = "pending" | "approved" | "rejected" | "fulfilled";

export interface Notification {
  id: string;
  recipientUid: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  relatedId?: string; // Could be reward redemption ID, task ID, etc.
}

export type NotificationType = "reward_redemption" | "task_assigned" | "badge_earned" | "system";
