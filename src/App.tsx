import React, { useState, useEffect, useMemo } from "react";
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut, 
  User 
} from "firebase/auth";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  doc, 
  getDoc 
} from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import { 
  UserProfile, 
  WorkspaceTask, 
  FeedItem, 
  TaskStatus, 
  TaskCategory, 
  TaskDifficulty,
  UserRole,
  Reward,
  RewardRedemption
} from "./types";
import { 
  getUserProfile, 
  createUserProfile, 
  updateUserProfile,
  updateTaskStatus, 
  completeTaskWithPoints,
  checkAndAwardBadges,
  createFeedItem, 
  toggleLike, 
  toggleReaction,
  createTask,
  testConnection,
  getUserNotifications,
  markNotificationAsRead,
  getRewards,
  getRedemptions,
  createReward,
  updateRedemptionStatus,
  registerUserByHR
} from "./services/firebaseService";
import { generateTaskDescription, getAIInsights } from "./services/geminiService";
import { cn } from "./lib/utils";
import { 
  BADGES, 
  BadgeDefinition 
} from "./constants";
import * as LucideIcons from "lucide-react";
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  Settings,
  Plus,
  Flame,
  Star,
  Award,
  RefreshCw,
  Trophy,
  LogOut,
  Search,
  Bell,
  TrendingUp,
  Users,
  Zap,
  Heart,
  Share2,
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Building2,
  UserPlus,
  ArrowRight,
  Moon,
  Sun,
  ThumbsUp,
  Rocket,
  PartyPopper,
  Image,
  Video,
  X,
  Gift
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from "recharts";

// Imported components
import LoadingScreen from "./components/LoadingScreen";
import LandingPage from "./pages/LandingPage";
import LoginScreen from "./pages/LoginScreen";
import OnboardingScreen from "./pages/OnboardingScreen";
import PointsPopup from "./components/PointsPopup";
import QuickTipsModal from "./components/QuickTipsModal";
import BadgeAwardPopup from "./components/BadgeAwardPopup";
import NavItem from "./components/NavItem";
import BadgeList from "./components/BadgeList";


// Reusable avatar that falls back to initials when photo fails to load
function ProfileAvatar({ photoURL, displayName, size = "md", className = "" }: {
  photoURL?: string | null;
  displayName?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [imgError, setImgError] = React.useState(false);
  const initial = displayName?.charAt(0).toUpperCase() || "?";
  const sizeClasses: Record<string, string> = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-24 h-24 text-3xl",
  };
  const base = sizeClasses[size];
  const rounded = size === "lg" ? "rounded-3xl shadow-2xl" : "rounded-full";
  if (!photoURL || imgError) {
    return (
      <div
        className={cn(`${base} ${rounded} flex items-center justify-center font-black text-white flex-shrink-0 ${className}`)}
        style={{ backgroundColor: "var(--primary, #4a40e0)" }}
      >
        {initial}
      </div>
    );
  }
  return (
    <img
      src={photoURL}
      alt={displayName || ""}
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className={cn(`${base} ${rounded} object-cover flex-shrink-0 ${className}`)}
    />
  );
}
// --- Components ---

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('{"error":')) {
        setHasError(true);
        setErrorInfo(event.error.message);
      }
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-xl border border-error/20">
          <h2 className="text-2xl font-bold text-error mb-4">Database Error</h2>
          <p className="text-on-surface-variant mb-6">Something went wrong with the database connection.</p>
          <pre className="bg-surface-container-low p-4 rounded text-xs overflow-auto max-h-40 mb-6">
            {errorInfo}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-primary text-white font-bold py-3 rounded-full"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// --- Components ---

// --- Components ---

// --- Components ---

// --- Components ---

// --- Components ---

// --- Components ---

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "tasks" | "social" | "rewards" | "leaderboard" | "admin" | "settings" | "register">("dashboard");
  const [awardPoints, setAwardPoints] = useState<number | null>(null);
  const [awardedBadges, setAwardedBadges] = useState<BadgeDefinition[]>([]);
  const [showQuickTips, setShowQuickTips] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });
  const [accentColor, setAccentColor] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accentColor') || '#4a40e0';
    }
    return '#4a40e0';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--primary', accentColor);
    // Approximate container color
    root.style.setProperty('--primary-container', accentColor + '33'); 
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const existingProfile = await getUserProfile(firebaseUser.uid);
        if (existingProfile) {
          setProfile(existingProfile);
        } else {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || "New Member",
            email: firebaseUser.email || "",
            photoURL: firebaseUser.photoURL || "",
            role: firebaseUser.email === "alidzanhasan9@gmail.com" ? "admin" : "member",            points: 0,
            streak: 1,
            badges: ["Newcomer"],
            completedTasksCount: 0,
            onboarded: false
          };
          await createUserProfile(newProfile);
          setProfile(newProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOnboardingComplete = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    await updateUserProfile(user.uid, updates);
    setProfile(prev => prev ? { ...prev, ...updates } : null);
    setShowQuickTips(true);
    
    // Welcome post to the feed
    await createFeedItem(`Just joined the workspace! Excited to start my journey in the ${updates.department || "Atelier"} department. 👋`, "post");
  };

  useEffect(() => {
    if (!user) return;

    const tasksQuery = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => doc.data() as WorkspaceTask));
    });

    const feedQuery = query(collection(db, "feed"), orderBy("createdAt", "desc"), limit(20));
    const unsubscribeFeed = onSnapshot(feedQuery, (snapshot) => {
      console.log("Feed snapshot received:", snapshot.docs.length, "documents");
      setFeed(snapshot.docs.map(doc => doc.data() as FeedItem));
    }, (error) => {
      console.error("Feed query error:", error);
    });

    const usersQuery = query(collection(db, "users"), orderBy("points", "desc"));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
    });

    return () => {
      unsubscribeTasks();
      unsubscribeFeed();
      unsubscribeUsers();
    };
  }, [user]);

  const handleCompleteTask = async (points: number, taskId: string, proofMedia?: { url: string; type: "image" | "video" }) => {
    if (!user || !profile) return;
    setAwardPoints(points);
    await completeTaskWithPoints(taskId, points, user.uid);

    // Automatic feed post with proof media attached
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await createFeedItem(
        `Just completed the mission: "${task.title}"! 🚀`,
        "post",
        proofMedia?.url,
        proofMedia?.type
      );
    }

    // Check for badges
    const newBadges = await checkAndAwardBadges(user.uid);
    if (newBadges.length > 0) {
      setAwardedBadges(prev => [...prev, ...newBadges]);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleRefreshToken = async () => {
    if (user) {
      try {
        await user.getIdToken(true); // Force refresh token
        // Reload profile to get updated role
        const updatedProfile = await getUserProfile(user.uid);
        if (updatedProfile) {
          setProfile(updatedProfile);
        }
        alert("Token refreshed! Try creating a reward now.");
      } catch (error) {
        console.error("Token refresh failed:", error);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) return <LoadingScreen />;
  if (!user && !showLogin) return <LandingPage onGetStarted={() => setShowLogin(true)} />;
  if (!user && showLogin) return <LoginScreen onGoogleLogin={handleLogin} onBack={() => setShowLogin(false)} />;
  if (profile && !profile.onboarded) return <OnboardingScreen profile={profile} onComplete={handleOnboardingComplete} />;

  const tabLabel: Record<string, string> = {
    dashboard: "Dashboard", tasks: "Missions", social: "Social",
    rewards: "Rewards", leaderboard: "Leaderboard", admin: "HR Panel",
    register: "Register", settings: "Settings",
  };

  const isHROrAdmin = profile?.role === "admin" || profile?.role === "hr";

  // Build bottom tabs dynamically based on role
  const bottomTabs = [
    { id: "dashboard",   icon: <LayoutDashboard size={22} />, label: "Home" },
    { id: "tasks",       icon: <CheckSquare size={22} />,     label: "Missions" },
    { id: "social",      icon: <MessageSquare size={22} />,   label: "Social" },
    // Regular members get Rewards + Leaderboard; HR/Admin get HR Panel + Register instead
    ...(isHROrAdmin
      ? [
          { id: "admin",    icon: <ShieldCheck size={22} />, label: "HR" },
          { id: "register", icon: <UserPlus size={22} />,    label: "Register" },
        ]
      : [
          { id: "rewards",     icon: <Gift size={22} />,      label: "Rewards" },
          { id: "leaderboard", icon: <TrendingUp size={22} />, label: "Ranks" },
        ]),
  ];

  return (
    <ErrorBoundary>
      <AnimatePresence>
        {awardPoints && <PointsPopup points={awardPoints} onComplete={() => setAwardPoints(null)} />}
        {awardedBadges.length > 0 && (
          <BadgeAwardPopup
            badge={awardedBadges[0]}
            onComplete={() => setAwardedBadges(prev => prev.slice(1))}
          />
        )}
        {showQuickTips && <QuickTipsModal onOpen={() => setShowQuickTips(false)} />}
      </AnimatePresence>

      <div className="min-h-screen bg-surface text-on-surface flex flex-col md:flex-row">

        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="hidden md:flex w-64 bg-surface-container-low border-r border-outline-variant/10 flex-col sticky top-0 h-screen z-50">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: "var(--primary, #4a40e0)" }}>
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <span className="font-headline font-black text-xl tracking-tight text-primary">Atelier</span>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            <NavItem active={activeTab === "dashboard"}   onClick={() => setActiveTab("dashboard")}   icon={<LayoutDashboard size={20} />} label="Dashboard" />
            <NavItem active={activeTab === "tasks"}       onClick={() => setActiveTab("tasks")}       icon={<CheckSquare size={20} />}    label="Mission Control" />
            <NavItem active={activeTab === "social"}      onClick={() => setActiveTab("social")}      icon={<MessageSquare size={20} />}  label="Social" />
            <NavItem active={activeTab === "rewards"}     onClick={() => setActiveTab("rewards")}     icon={<Gift size={20} />}           label="Rewards" />
            <NavItem active={activeTab === "leaderboard"} onClick={() => setActiveTab("leaderboard")} icon={<TrendingUp size={20} />}     label="Leaderboard" />
            {(profile?.role === "admin" || profile?.role === "hr") && (
              <NavItem active={activeTab === "admin"}    onClick={() => setActiveTab("admin")}    icon={<ShieldCheck size={20} />} label="HR Panel" />
            )}
            {profile?.role === "hr" && (
              <NavItem active={activeTab === "register"} onClick={() => setActiveTab("register")} icon={<UserPlus size={20} />}    label="Register User" />
            )}
            <NavItem active={activeTab === "settings"}   onClick={() => setActiveTab("settings")}   icon={<Settings size={20} />}      label="Settings" />
          </nav>

          <div className="p-4 border-t border-outline-variant/10">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest shadow-sm">
              <ProfileAvatar photoURL={profile?.photoURL} displayName={profile?.displayName} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{profile?.displayName}</p>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">{profile?.role}</p>
              </div>
              <button onClick={handleRefreshToken} className="text-on-surface-variant hover:text-primary transition-colors mr-2" title="Refresh Token">
                <RefreshCw size={18} />
              </button>
              <button onClick={handleLogout} className="text-on-surface-variant hover:text-error transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0 min-w-0">

          {/* MOBILE HEADER */}
          <header className="md:hidden sticky top-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/10">
            <div className="flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-md" style={{ backgroundColor: "var(--primary, #4a40e0)" }}>
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <span className="font-black text-base tracking-tight text-primary">
                  {tabLabel[activeTab] || activeTab}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 bg-secondary/10 text-secondary rounded-full">
                  <Flame className="w-3 h-3 fill-secondary" />
                  <span className="text-xs font-black">{profile?.streak}d</span>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 bg-tertiary/10 text-tertiary rounded-full">
                  <Star className="w-3 h-3 fill-tertiary" />
                  <span className="text-xs font-black">{profile?.points}</span>
                </div>
                <button
                  onClick={() => setActiveTab("settings")}
                  className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 active:scale-95 transition-all"
                >
                  <ProfileAvatar photoURL={profile?.photoURL} displayName={profile?.displayName} size="sm" />
                </button>
              </div>
            </div>
          </header>

          {/* DESKTOP HEADER */}
          <header className="hidden md:flex h-16 border-b border-outline-variant/10 items-center justify-between px-8 sticky top-0 bg-surface/80 backdrop-blur-xl z-40">
            <h2 className="text-xl font-black tracking-tight capitalize">{tabLabel[activeTab] || activeTab}</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-full">
                <Flame className="w-4 h-4 text-secondary fill-secondary" />
                <span className="text-sm font-black">{profile?.streak} Day Streak</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-tertiary/10 text-tertiary rounded-full">
                <Star className="w-4 h-4 fill-tertiary" />
                <span className="text-sm font-black">{profile?.points} PTS</span>
              </div>
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all">
                <Bell size={20} />
              </button>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === "dashboard" && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <DashboardView profile={profile} tasks={tasks} />
                </motion.div>
              )}
              {activeTab === "tasks" && (
                <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <TasksView tasks={tasks} userId={user.uid} onCompleteTask={handleCompleteTask} />
                </motion.div>
              )}
              {activeTab === "social" && (
                <motion.div key="social" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <SocialView feed={feed} userId={user.uid} />
                </motion.div>
              )}
              {activeTab === "rewards" && (
                <motion.div key="rewards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <RewardsView userId={user.uid} userProfile={profile} />
                </motion.div>
              )}
              {activeTab === "leaderboard" && (
                <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <LeaderboardView users={allUsers} />
                </motion.div>
              )}
              {activeTab === "admin" && (
                <motion.div key="admin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <AdminView allUsers={allUsers} tasks={tasks} />
                </motion.div>
              )}
              {activeTab === "settings" && (
                <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <SettingsView 
                    profile={profile} 
                    theme={theme} 
                    onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} 
                    accentColor={accentColor}
                    onSetAccentColor={setAccentColor}
                  />
                </motion.div>
              )}
              {activeTab === "register" && (profile?.role === "hr" || profile?.role === "admin") && (
                <motion.div key="register" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <RegisterView />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* ── MOBILE BOTTOM TAB BAR ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-outline-variant/10">
          <div className="flex items-stretch">
            {[...bottomTabs, { id: "settings", icon: <Settings size={22} />, label: "Profile" }].map(tab => {
              const isActive = activeTab === tab.id;
              // HR tab gets a special highlight colour
              const isHRTab = tab.id === "admin";
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 relative active:scale-95 transition-all min-w-0"
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator-top"
                      className={cn("absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full", isHRTab ? "bg-secondary" : "bg-primary")}
                    />
                  )}
                  <motion.div
                    animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    className={cn(
                      "p-1.5 rounded-xl transition-all",
                      isActive && isHRTab ? "text-secondary bg-secondary/10"
                      : isActive ? "text-primary bg-primary/10"
                      : "text-on-surface-variant"
                    )}
                  >
                    {tab.icon}
                  </motion.div>
                  <span className={cn(
                    "text-[10px] font-bold transition-all truncate max-w-full px-0.5",
                    isActive && isHRTab ? "text-secondary"
                    : isActive ? "text-primary"
                    : "text-on-surface-variant"
                  )}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Safe area spacer for phones with home indicator */}
          <div className="h-safe-area-inset-bottom" />
        </nav>

      </div>
    </ErrorBoundary>
  );
}

// --- Sub-Views ---

function RegisterView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await registerUserByHR({ email, password, displayName: name, department });
      setSuccess(true);
      setEmail("");
      setPassword("");
      setName("");
      setDepartment("");
    } catch (err: any) {
      setError(err.message || "Failed to register user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-xl border border-outline-variant/10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
            <UserPlus size={32} />
          </div>
          <h3 className="text-2xl font-black tracking-tight">Register New User</h3>
          <p className="text-on-surface-variant text-sm font-medium">HR Exclusive: Create a new employee account</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary transition-all"
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary transition-all"
              placeholder="john@company.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary transition-all"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Department</label>
            <select 
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="">Select Department</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">HR</option>
              <option value="Sales">Sales</option>
            </select>
          </div>

          {error && (
            <div className="p-4 bg-error-container/30 text-error text-xs font-bold rounded-2xl border border-error/20">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-2xl border border-emerald-200 flex items-center gap-2">
              <CheckSquare size={16} />
              User registered successfully!
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Main App ---

// --- Components ---

function DashboardView({ profile, tasks }: { profile: UserProfile | null, tasks: WorkspaceTask[] }) {
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const fetchAI = async () => {
    if (!profile) return;
    setLoadingAI(true);
    try {
      const tips = await getAIInsights(tasks, profile);
      setAiTips(tips);
    } catch (err) {
      console.error("Failed to fetch AI tips:", err);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    if (profile && aiTips.length === 0) {
      fetchAI();
    }
  }, [profile]);

  const statsData = [
    { name: 'Mon', points: 400 },
    { name: 'Tue', points: 300 },
    { name: 'Wed', points: 600 },
    { name: 'Thu', points: 800 },
    { name: 'Fri', points: 500 },
    { name: 'Sat', points: 200 },
    { name: 'Sun', points: 100 },
  ];

  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-5 md:space-y-8">
      {/* AI Insights Bar */}
      <div className="bg-primary/5 border border-primary/20 p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-center gap-4 md:gap-6">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-primary/20">
          <Sparkles size={24} />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-primary flex items-center gap-2">
              AI Flow Assistant
              {loadingAI && <div className="w-1 h-1 bg-primary rounded-full animate-ping" />}
            </h3>
            <button 
              onClick={fetchAI} 
              disabled={loadingAI}
              className="p-1.5 hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50"
              title="Refresh Insights"
            >
              <RefreshCw size={14} className={cn("text-primary", loadingAI && "animate-spin")} />
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {loadingAI ? (
              <div className="flex gap-2">
                <div className="h-4 w-24 bg-primary/10 rounded animate-pulse" />
                <div className="h-4 w-32 bg-primary/10 rounded animate-pulse" />
                <div className="h-4 w-28 bg-primary/10 rounded animate-pulse" />
              </div>
            ) : (
              aiTips.map((tip, i) => (
                <span key={i} className="text-xs font-medium px-3 py-1 bg-white rounded-full border border-primary/10 text-on-surface-variant">
                  {tip}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <StatCard 
          icon={<Flame className="text-secondary fill-secondary" />}
          label="Current Streak"
          value={`${profile?.streak} Days`}
          subValue="Top 10% this week"
          color="secondary"
        />
        <StatCard 
          icon={<Star className="text-tertiary fill-tertiary" />}
          label="Daily Goal"
          value={`${completedCount}/3`}
          subValue={`${3 - completedCount} more to hit target`}
          color="tertiary"
          progress={(completedCount / 3) * 100}
        />
        <StatCard 
          icon={<Award className="text-primary fill-primary" />}
          label="Badges Earned"
          value={profile?.badges.length.toString() || "0"}
          subValue="View Trophy Room"
          color="primary"
        />
      </div>

      <div className="bg-surface-container-lowest p-4 md:p-8 rounded-2xl md:rounded-lg shadow-sm border border-outline-variant/10">
        <h3 className="text-base md:text-lg font-black tracking-tight mb-4 flex items-center gap-2">
          <Trophy className="text-amber-500" size={20} />
          Trophy Room
        </h3>
        <BadgeList badgeIds={profile?.badges || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
        <div className="lg:col-span-8 bg-surface-container-lowest p-4 md:p-8 rounded-2xl md:rounded-lg shadow-sm border border-outline-variant/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">Weekly Momentum</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                <div className="w-2 h-2 rounded-full bg-primary" /> Focus Time
              </div>
            </div>
          </div>
          <div className="h-44 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statsData}>
                <defs>
                  <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4a40e0" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4a40e0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e7ff" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="points" stroke="#4a40e0" strokeWidth={3} fillOpacity={1} fill="url(#colorPoints)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4 md:space-y-6">
          <div className="bg-surface-container-low p-4 md:p-6 rounded-2xl md:rounded-lg">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">Mission Status</h3>
            <div className="space-y-4">
              <StatusRow label="To Do" count={todoCount} color="bg-outline-variant" />
              <StatusRow label="In Progress" count={inProgressCount} color="bg-primary" />
              <StatusRow label="Completed" count={completedCount} color="bg-secondary" />
            </div>
          </div>

          <div className="bg-indigo-600 p-6 rounded-lg text-white relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Next Milestone</span>
              <h3 className="text-xl font-bold leading-tight">Master of Consistency</h3>
              <p className="text-indigo-100 text-xs">Finish all daily tasks for 2 more days to earn the Silver Shield badge.</p>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-white h-full" style={{ width: "80%" }} />
              </div>
            </div>
            <Award className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 rotate-12 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue, color, progress }: any) {
  return (
    <div className="bg-surface-container-lowest p-3 md:p-6 rounded-2xl md:rounded-lg shadow-sm border border-outline-variant/10 flex flex-col items-center text-center space-y-2 md:space-y-4">
      <div className={cn("w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center", `bg-${color}-container/30`)}>
        <div className="scale-75 md:scale-100">{icon}</div>
      </div>
      <div>
        <h3 className="text-on-surface-variant text-[8px] md:text-[10px] font-bold uppercase tracking-widest leading-tight">{label}</h3>
        <p className="text-lg md:text-3xl font-black text-on-surface font-headline">{value}</p>
      </div>
      {progress !== undefined && (
        <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full", `bg-${color}`)} style={{ width: `${progress}%` }} />
        </div>
      )}
      <p className="text-on-surface-variant text-[10px] md:text-xs font-medium hidden md:block">{subValue}</p>
    </div>
  );
}

function StatusRow({ label, count, color }: { label: string, count: number, color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn("w-2 h-2 rounded-full", color)} />
        <span className="text-sm font-bold">{label}</span>
      </div>
      <span className="text-sm font-black">{count}</span>
    </div>
  );
}

// ---- Proof Modal ----
function ProofModal({
  task,
  onSubmit,
  onClose,
}: {
  task: WorkspaceTask;
  onSubmit: (proof: { url: string; type: "image" | "video" }) => void;
  onClose: () => void;
}) {
  const [proof, setProof] = React.useState<{ url: string; type: "image" | "video" } | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10_000_000) {
      setError("File too large. Max 10 MB.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      const type = file.type.startsWith("video") ? "video" : "image";
      setProof({ url, type });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!proof) return;
    setSubmitting(true);
    await onSubmit(proof);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center md:items-center md:p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="bg-surface w-full max-w-lg rounded-t-[32px] md:rounded-[32px] shadow-2xl border border-outline-variant/10 overflow-hidden"
      >
        {/* Mobile drag handle */}
        <div className="md:hidden w-10 h-1 bg-outline-variant/30 rounded-full mx-auto mt-3 mb-0" />
        {/* Header */}
        <div className="bg-primary p-5 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-300" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Submit Proof</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all">
                <X size={16} className="text-white" />
              </button>
            </div>
            <h3 className="text-xl font-black text-white leading-tight">{task.title}</h3>
            <p className="text-white/70 text-sm mt-1">Upload a photo or video proving you completed this mission to earn your points.</p>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-5">
          {/* Reward badge */}
          <div className="flex items-center gap-3 bg-tertiary-container/20 rounded-2xl px-4 py-3 border border-tertiary-container/30">
            <Award className="text-tertiary w-5 h-5" />
            <span className="text-sm font-black text-tertiary">Reward: +{task.points} PTS</span>
          </div>

          {/* Upload area */}
          {!proof ? (
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Choose proof type</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-outline-variant/30 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-all">
                    <Image className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-sm">Photo</p>
                    <p className="text-[10px] text-on-surface-variant font-medium">JPG, PNG, GIF, WEBP</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </label>

                <label className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-outline-variant/30 hover:border-secondary/40 hover:bg-secondary/5 cursor-pointer transition-all">
                  <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center group-hover:bg-secondary/20 transition-all">
                    <Video className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-sm">Video</p>
                    <p className="text-[10px] text-on-surface-variant font-medium">MP4, MOV, WEBM</p>
                  </div>
                  <input type="file" accept="video/*" className="hidden" onChange={handleFile} />
                </label>
              </div>
              {error && (
                <p className="text-xs font-bold text-error bg-error-container/20 px-3 py-2 rounded-xl">{error}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Your Proof</p>
                <button
                  onClick={() => setProof(null)}
                  className="text-[10px] font-black uppercase text-error hover:bg-error/10 px-2 py-1 rounded-lg transition-all"
                >
                  Remove
                </button>
              </div>
              <div className="rounded-2xl overflow-hidden border border-outline-variant/10 bg-surface-container-low">
                {proof.type === "image" ? (
                  <img src={proof.url} alt="Proof" className="w-full max-h-56 object-cover" />
                ) : (
                  <video src={proof.url} controls className="w-full max-h-56 object-cover" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                <CheckSquare size={14} />
                {proof.type === "image" ? "Photo" : "Video"} proof ready to submit
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-black text-sm bg-surface-container-low hover:bg-surface-container transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!proof || submitting}
              className="flex-1 py-3 rounded-2xl font-black text-sm bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:scale-100"
            >
              {submitting ? "Submitting..." : "Complete Mission 🚀"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TasksView({ tasks, userId, onCompleteTask }: {
  tasks: WorkspaceTask[];
  userId: string;
  onCompleteTask: (points: number, taskId: string, proof?: { url: string; type: "image" | "video" }) => void;
}) {
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [proofTask, setProofTask] = useState<WorkspaceTask | null>(null);

  const filteredTasks = tasks.filter(t => filter === "all" || t.status === filter);
  const featuredTask = tasks.find(t => t.status === "todo" && t.difficulty === "Epic") || tasks.find(t => t.status === "todo");

  const openProof = (task: WorkspaceTask) => setProofTask(task);

  const handleProofSubmit = async (proof: { url: string; type: "image" | "video" }) => {
    if (!proofTask) return;
    await onCompleteTask(proofTask.points, proofTask.id, proof);
    setProofTask(null);
  };

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {proofTask && (
          <ProofModal
            task={proofTask}
            onSubmit={handleProofSubmit}
            onClose={() => setProofTask(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["all", "todo", "in-progress", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold capitalize transition-all",
                filter === f ? "bg-primary text-white shadow-md" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
              )}
            >
              {f.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {featuredTask && filter === "all" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary text-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] shadow-2xl shadow-primary/20 relative overflow-hidden group mb-4"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-300" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Featured Mission</span>
            </div>
            <h4 className="text-xl md:text-3xl font-black leading-tight">{featuredTask.title}</h4>
            <p className="text-white/80 text-sm max-w-md">{featuredTask.description}</p>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-white/60">Reward</span>
                <span className="text-xl font-black text-amber-300">+{featuredTask.points} PTS</span>
              </div>
              <button
                onClick={async () => {
                  if (featuredTask.status === "todo") {
                    await updateTaskStatus(featuredTask.id, "in-progress");
                  } else {
                    openProof(featuredTask);
                  }
                }}
                className="bg-white text-primary font-black px-8 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center gap-2"
              >
                {featuredTask.status === "in-progress" ? (
                  <><CheckSquare size={18} /> Submit Proof</>
                ) : (
                  "Accept Mission"
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        {filteredTasks
          .filter(t => filter !== "all" || t.id !== featuredTask?.id)
          .map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden active:scale-[0.99] transition-all group"
            >
              <div
                className="p-4 md:p-5 flex items-center gap-3 md:gap-5 cursor-pointer"
                onClick={async () => {
                  if (task.status === "completed") return;
                  if (task.status === "in-progress") openProof(task);
                  else await updateTaskStatus(task.id, "in-progress");
                }}
              >
                {/* Status circle */}
                <div className={cn(
                  "w-10 h-10 md:w-12 md:h-12 rounded-full border-4 flex items-center justify-center flex-shrink-0 transition-all",
                  task.status === "completed" ? "bg-primary border-primary"
                  : task.status === "in-progress" ? "border-primary bg-primary/10"
                  : "border-surface-container-high group-hover:border-primary/40"
                )}>
                  {task.status === "completed" ? (
                    <CheckSquare className="text-white w-5 h-5" />
                  ) : task.status === "in-progress" ? (
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                  ) : null}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <h4 className="font-bold text-sm md:text-base leading-tight">{task.title}</h4>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex-shrink-0",
                      task.category === "Work" ? "bg-primary/10 text-primary"
                      : task.category === "Wellness" ? "bg-tertiary/10 text-tertiary"
                      : "bg-secondary/10 text-secondary"
                    )}>{task.category}</span>
                  </div>
                  <p className="text-on-surface-variant text-xs line-clamp-1">{task.description}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-[9px] font-bold text-on-surface-variant uppercase">Pts</p>
                  <p className="text-base md:text-lg font-black text-tertiary">+{task.points}</p>
                </div>
              </div>

              {/* In-progress proof CTA - full width tap target */}
              {task.status === "in-progress" && (
                <button
                  onClick={() => openProof(task)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 hover:bg-primary/20 active:bg-primary/30 text-primary text-xs font-black uppercase tracking-widest transition-all border-t border-primary/10"
                >
                  <Image size={12} /> Tap to Upload Proof &amp; Complete
                </button>
              )}
            </motion.div>
          ))}
        {filteredTasks.length === 0 && (
          <div className="text-center py-20 bg-surface-container-low/30 rounded-lg border border-dashed border-outline-variant/20">
            <CheckSquare className="w-12 h-12 text-outline-variant mx-auto mb-4" />
            <p className="text-on-surface-variant font-bold">No missions found.</p>
          </div>
        )}
      </div>
    </div>
  );
}


function LeaderboardView({ users }: { users: UserProfile[] }) {
  const [view, setView] = useState<"individual" | "department">("individual");
  
  const sortedUsers = [...users].sort((a, b) => b.points - a.points);

  const departmentStats = useMemo(() => {
    const stats: Record<string, { points: number, members: number }> = {};
    users.forEach(u => {
      const dept = u.department || "Unassigned";
      if (!stats[dept]) stats[dept] = { points: 0, members: 0 };
      stats[dept].points += u.points;
      stats[dept].members += 1;
    });
    return Object.entries(stats)
      .map(([name, data]) => ({ name, ...data, avg: Math.round(data.points / data.members) }))
      .sort((a, b) => b.points - a.points);
  }, [users]);

  return (
    <div className="max-w-2xl mx-auto space-y-5 md:space-y-8">
      <div className="text-center space-y-3">
        <h3 className="text-2xl md:text-3xl font-black tracking-tight">The Leaderboard</h3>
        <div className="flex justify-center gap-2">
          <button 
            onClick={() => setView("individual")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
              view === "individual" ? "bg-primary text-white shadow-md" : "bg-surface-container-low text-on-surface-variant"
            )}
          >
            Individual
          </button>
          <button 
            onClick={() => setView("department")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
              view === "department" ? "bg-primary text-white shadow-md" : "bg-surface-container-low text-on-surface-variant"
            )}
          >
            Department
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-[32px] shadow-xl border border-outline-variant/10 overflow-hidden">
        {view === "individual" ? (
          sortedUsers.map((u, i) => (
            <div 
              key={u.uid} 
              className={cn(
                "flex items-center gap-3 md:gap-4 p-4 md:p-6 transition-all border-b border-outline-variant/5",
                i === 0 ? "bg-tertiary-container/10" : "hover:bg-surface-container-low"
              )}
            >
              <div className="w-8 text-center font-black text-on-surface-variant">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
              </div>
              <ProfileAvatar photoURL={u.photoURL} displayName={u.displayName} size="md" className="border-2 border-surface" />
              <div className="flex-1">
                <p className="font-black text-sm md:text-lg leading-tight">{u.displayName}</p>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">{u.department || "Unassigned"}</p>
              </div>
              <div className="text-right">
                <p className="text-base md:text-xl font-black text-primary">{u.points.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Points</p>
              </div>
            </div>
          ))
        ) : (
          departmentStats.map((dept, i) => (
            <div 
              key={dept.name} 
              className={cn(
                "flex items-center gap-4 p-6 transition-all border-b border-outline-variant/5",
                i === 0 ? "bg-secondary-container/10" : "hover:bg-surface-container-low"
              )}
            >
              <div className="w-8 text-center font-black text-on-surface-variant">
                {i + 1}
              </div>
              <div className="w-12 h-12 bg-surface-container-low rounded-2xl flex items-center justify-center">
                <Building2 className="text-primary" size={24} />
              </div>
              <div className="flex-1">
                <p className="font-black text-lg">{dept.name}</p>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">{dept.members} Members</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-secondary">{dept.points.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Total Points</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
function SocialView({ feed, userId }: { feed: FeedItem[], userId: string }) {
  const [newPost, setNewPost] = useState("");
  const [media, setMedia] = useState<{ url: string, type: "image" | "video" } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) {
      alert("File is too large. Please select a file smaller than 800KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const type = file.type.startsWith("video") ? "video" : "image";
      setMedia({ url, type });
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    console.log("handlePost called with:", newPost.trim());
    if (!newPost.trim()) {
      console.log("No text to post");
      return;
    }
    
    // Check if user is authenticated
    if (!auth.currentUser) {
      console.log("User not authenticated");
      alert("You must be logged in to post.");
      return;
    }
    
    console.log("User authenticated:", auth.currentUser.uid);
    setLoading(true);
    try {
      console.log("Calling createFeedItem...");
      await createFeedItem(newPost, "post", media?.url, media?.type);
      console.log("Post created successfully");
      setNewPost("");
      setMedia(null);
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-8">
      <div className="bg-surface-container-lowest p-4 md:p-6 rounded-2xl md:rounded-lg shadow-sm border border-outline-variant/10 space-y-4">
        <textarea 
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Share your momentum..."
          className="w-full bg-surface-container-low border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary transition-all resize-none"
          rows={3}
        />
        
        {media && (
          <div className="relative rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/10">
            {media.type === "image" ? (
              <img src={media.url} className="w-full h-auto max-h-96 object-cover" alt="Preview" />
            ) : (
              <video src={media.url} className="w-full h-auto max-h-96 object-cover" controls />
            )}
            <button 
              onClick={() => setMedia(null)}
              className="absolute top-2 right-2 p-1.5 bg-surface/80 backdrop-blur-md rounded-full text-on-surface hover:text-error transition-all"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <label className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full cursor-pointer transition-all">
              <Image size={20} />
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
            <label className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full cursor-pointer transition-all">
              <Video size={20} />
              <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
          <button 
            onClick={handlePost}
            disabled={!newPost.trim() || loading}
            className="bg-primary text-white font-bold py-2 px-6 rounded-full shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? "Posting..." : "Post Update"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {feed.map((item) => (
          <div key={item.id} className="bg-surface-container-lowest p-4 md:p-6 rounded-2xl md:rounded-lg shadow-sm border border-outline-variant/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ProfileAvatar photoURL={item.authorPhoto} displayName={item.authorName} size="md" />
                <div>
                  <p className="font-bold text-sm">{item.authorName}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">
                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button className="text-on-surface-variant hover:text-on-surface">
                <MoreVertical size={18} />
              </button>
            </div>
            
            <p className="text-on-surface leading-relaxed">{item.content}</p>

            {item.mediaUrl && (
              <div className="rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/10">
                {item.mediaType === "image" ? (
                  <img src={item.mediaUrl} className="w-full h-auto max-h-[500px] object-cover" alt="Post media" referrerPolicy="no-referrer" />
                ) : (
                  <video src={item.mediaUrl} className="w-full h-auto max-h-[500px] object-cover" controls />
                )}
              </div>
            )}

            {item.type === 'milestone' && (
              <div className="bg-tertiary-container/20 p-4 rounded-xl flex items-center gap-4 border border-tertiary-container/30">
                <Award className="text-tertiary w-8 h-8" />
                <div>
                  <p className="text-xs font-bold text-tertiary uppercase">Milestone Unlocked</p>
                  <p className="text-sm font-black">{item.content}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/10">
              <button 
                onClick={() => toggleLike(item.id, userId)}
                className={cn(
                  "flex items-center gap-1.5 text-sm font-bold transition-colors px-3 py-1.5 rounded-full hover:bg-surface-container",
                  item.likes.includes(userId) ? "text-error" : "text-on-surface-variant hover:text-error"
                )}
              >
                <Heart size={18} className={item.likes.includes(userId) ? "fill-error" : ""} />
                {item.likes.length}
              </button>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => toggleReaction(item.id, userId, 'thumbsup')}
                  className={cn(
                    "p-1.5 rounded-full transition-all flex items-center gap-1",
                    item.reactions?.thumbsup?.includes(userId) ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                  )}
                >
                  <ThumbsUp size={16} className={item.reactions?.thumbsup?.includes(userId) ? "fill-primary" : ""} />
                  <span className="text-[10px] font-bold">{item.reactions?.thumbsup?.length || 0}</span>
                </button>
                <button 
                  onClick={() => toggleReaction(item.id, userId, 'rocket')}
                  className={cn(
                    "p-1.5 rounded-full transition-all flex items-center gap-1",
                    item.reactions?.rocket?.includes(userId) ? "bg-secondary/10 text-secondary" : "text-on-surface-variant hover:bg-surface-container hover:text-secondary"
                  )}
                >
                  <Rocket size={16} className={item.reactions?.rocket?.includes(userId) ? "fill-secondary" : ""} />
                  <span className="text-[10px] font-bold">{item.reactions?.rocket?.length || 0}</span>
                </button>
                <button 
                  onClick={() => toggleReaction(item.id, userId, 'party')}
                  className={cn(
                    "p-1.5 rounded-full transition-all flex items-center gap-1",
                    item.reactions?.party?.includes(userId) ? "bg-tertiary/10 text-tertiary" : "text-on-surface-variant hover:bg-surface-container hover:text-tertiary"
                  )}
                >
                  <PartyPopper size={16} className={item.reactions?.party?.includes(userId) ? "fill-tertiary" : ""} />
                  <span className="text-[10px] font-bold">{item.reactions?.party?.length || 0}</span>
                </button>
              </div>

              <div className="flex-1" />

              <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary text-sm font-bold transition-colors">
                <MessageSquare size={18} />
              </button>
              <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary text-sm font-bold transition-colors">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {feed.length === 0 && (
          <div className="text-center py-20 bg-surface-container-low/30 rounded-3xl border-2 border-dashed border-outline-variant/20">
            <MessageSquare className="w-12 h-12 text-outline-variant mx-auto mb-4 opacity-20" />
            <p className="text-on-surface-variant font-bold">No updates yet. Be the first to share!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminView({ allUsers, tasks }: { allUsers: UserProfile[], tasks: WorkspaceTask[] }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [points, setPoints] = useState(100);
  const [category, setCategory] = useState<TaskCategory>("Work");
  const [difficulty, setDifficulty] = useState<TaskDifficulty>("Intermediate");
  const [generating, setGenerating] = useState(false);
  const [view, setView] = useState<"tasks" | "users" | "teams" | "rewards">("tasks");

  // Rewards state
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [rewardName, setRewardName] = useState("");
  const [rewardDesc, setRewardDesc] = useState("");
  const [rewardPoints, setRewardPoints] = useState(100);
  const [rewardCategory, setRewardCategory] = useState<Reward['category']>("Gift Cards");

  useEffect(() => {
    if (view === "rewards") {
      loadRewards();
      loadRedemptions();
    }
  }, [view]);

  const loadRewards = async () => {
    try {
      const rewardsData = await getRewards();
      setRewards(rewardsData);
    } catch (error) {
      console.error("Failed to load rewards:", error);
    }
  };

  const loadRedemptions = async () => {
    try {
      const redemptionsData = await getRedemptions();
      setRedemptions(redemptionsData);
    } catch (error) {
      console.error("Failed to load redemptions:", error);
    }
  };

  const handleCreateReward = async () => {
    if (!rewardName || !rewardDesc) return;
    
    if (!auth.currentUser) {
      alert("You must be logged in to create a reward");
      return;
    }
    
    try {
      // Refresh token to ensure custom claims are up to date
      await auth.currentUser.getIdToken(true);
      console.log("Token refreshed. Creating reward...");
      
      const createdByUid = auth.currentUser.uid;
      console.log("Creating reward with createdBy:", createdByUid);
      
      await createReward({
        name: rewardName,
        description: rewardDesc,
        pointsCost: rewardPoints,
        category: rewardCategory,
        available: true,
        createdBy: createdByUid
      });
      setRewardName("");
      setRewardDesc("");
      loadRewards();
      alert("Reward created!");
    } catch (error) {
      console.error("Failed to create reward:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Error details:", errorMsg);
      alert(`Failed to create reward: ${errorMsg}`);
    }
  };

  const handleSeedRewards = async () => {
    const sampleRewards = [
      {
        name: "Amazon Gift Card - $25",
        description: "Redeem for a $25 Amazon gift card. Perfect for online shopping and digital purchases.",
        pointsCost: 250,
        category: "Gift Cards" as const,
        available: true,
        createdBy: "admin"
      },
      {
        name: "Extra Day Off",
        description: "Get an additional day of paid time off. Use it whenever you need a break!",
        pointsCost: 500,
        category: "Extra Time Off" as const,
        available: true,
        createdBy: "admin"
      },
      {
        name: "Noise-Cancelling Headphones",
        description: "High-quality wireless headphones for focused work and calls.",
        pointsCost: 800,
        category: "Equipment" as const,
        available: true,
        createdBy: "admin"
      },
      {
        name: "Team Lunch Voucher",
        description: "Treat your team to lunch! Valid at local restaurants.",
        pointsCost: 300,
        category: "Experiences" as const,
        available: true,
        createdBy: "admin"
      },
      {
        name: "Employee of the Month Recognition",
        description: "Get featured on the company newsletter and receive a special badge.",
        pointsCost: 150,
        category: "Recognition" as const,
        available: true,
        createdBy: "admin"
      }
    ];

    try {
      for (const reward of sampleRewards) {
        await createReward(reward);
      }
      loadRewards();
      alert("Sample rewards added!");
    } catch (error) {
      console.error("Failed to seed rewards:", error);
      alert("Failed to add sample rewards");
    }
  };

  const handleUpdateRedemption = async (redemptionId: string, status: RewardRedemption['status']) => {
    try {
      await updateRedemptionStatus(redemptionId, status, "admin");
      loadRedemptions();
      alert(`Redemption ${status}!`);
    } catch (error) {
      console.error("Failed to update redemption:", error);
      alert("Failed to update redemption");
    }
  };

  const handleCreate = async () => {
    if (!title) return;
    await createTask({
      title,
      description: desc,
      points,
      category,
      difficulty,
      assignedTo: ["Engineering"],
      status: "todo"
    });
    setTitle("");
    setDesc("");
    alert("Mission published!");
  };

  const handleAIGenerate = async () => {
    if (!title) {
      alert("Please enter a title first.");
      return;
    }
    setGenerating(true);
    const aiDesc = await generateTaskDescription(title, category);
    setDesc(aiDesc);
    setGenerating(false);
  };

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    await updateUserProfile(uid, { role: newRole });
  };

  const handleDepartmentChange = async (uid: string, newDept: string) => {
    await updateUserProfile(uid, { department: newDept });
  };

  const getTeamMetrics = () => {
    const metrics: Record<string, { points: number, users: number, avgStreak: number, totalTasks: number, completedTasks: number }> = {};
    
    allUsers.forEach(u => {
      const dept = u.department || "Unassigned";
      if (!metrics[dept]) {
        metrics[dept] = { points: 0, users: 0, avgStreak: 0, totalTasks: 0, completedTasks: 0 };
      }
      metrics[dept].points += u.points || 0;
      metrics[dept].users += 1;
      metrics[dept].avgStreak += u.streak || 0;
    });

    tasks.forEach(t => {
      if (t.assignedTo) {
        t.assignedTo.forEach(dept => {
          if (metrics[dept]) {
            metrics[dept].totalTasks += 1;
            if (t.status === "completed") {
              metrics[dept].completedTasks += 1;
            }
          }
        });
      }
    });

    return Object.entries(metrics).map(([name, data]) => ({
      name,
      ...data,
      avgStreak: Math.round(data.avgStreak / data.users),
      avgPoints: Math.round(data.points / data.users),
      completionRate: data.totalTasks > 0 ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0
    }));
  };

  const teamMetrics = getTeamMetrics();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex gap-2 border-b border-outline-variant/10 pb-4 overflow-x-auto scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
        {[
          { key: "tasks", label: "Missions" },
          { key: "users", label: "Users" },
          { key: "teams", label: "Teams" },
          { key: "rewards", label: "Rewards" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key as any)}
            className={cn("px-4 py-2 rounded-full font-bold text-xs md:text-sm whitespace-nowrap flex-shrink-0 transition-all", view === tab.key ? "bg-primary text-white shadow-md" : "text-on-surface-variant bg-surface-container-low hover:bg-surface-container")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "tasks" && (
        <div className="bg-surface-container-lowest p-4 md:p-8 rounded-2xl md:rounded-lg shadow-sm border border-outline-variant/10 space-y-5 md:space-y-8">
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight">Create New Mission</h3>
            <p className="text-on-surface-variant text-sm">Design engaging challenges to boost productivity.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Title</label>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary"
                placeholder="e.g., Quarterly Performance Review"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Description</label>
                <button 
                  onClick={handleAIGenerate}
                  disabled={generating}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase text-primary hover:bg-primary/10 px-2 py-1 rounded transition-all disabled:opacity-50"
                >
                  <Sparkles size={12} /> {generating ? "Generating..." : "AI Generate"}
                </button>
              </div>
              <textarea 
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                placeholder="Describe the goals..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary"
                >
                  <option value="Work">Work</option>
                  <option value="Fun">Fun</option>
                  <option value="Wellness">Wellness</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Difficulty</label>
                <select 
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary"
                >
                  <option value="Entry">Entry</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Epic">Epic</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Point Value</label>
              <input 
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value))}
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary"
              />
            </div>

            <button 
              onClick={handleCreate}
              className="w-full bg-primary text-white font-black py-4 rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Publish Mission
            </button>
          </div>

          <div className="pt-12 border-t border-outline-variant/10">
            <h4 className="text-lg font-black mb-6">Active Missions</h4>
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task.id} className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-white",
                      task.category === 'Work' ? "bg-primary" : task.category === 'Fun' ? "bg-secondary" : "bg-tertiary"
                    )}>
                      <CheckSquare size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{task.title}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium">{task.category} • {task.points} PTS</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <LucideIcons.Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "users" && (
        <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-outline-variant/10">
          <div className="space-y-2 mb-8">
            <h3 className="text-2xl font-black tracking-tight">User Directory</h3>
            <p className="text-on-surface-variant text-sm">Manage roles and workspace access.</p>
          </div>

          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/10 text-[10px] uppercase font-bold text-on-surface-variant tracking-widest">
                  <th className="pb-4">User</th>
                  <th className="pb-4">Department</th>
                  <th className="pb-4">Role</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {allUsers.map((u) => (
                  <tr key={u.uid} className="group">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <ProfileAvatar photoURL={u.photoURL} displayName={u.displayName} size="sm" />
                        <div>
                          <p className="text-sm font-bold">{u.displayName}</p>
                          <p className="text-[10px] text-on-surface-variant">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <select 
                        value={u.department || ""}
                        onChange={(e) => handleDepartmentChange(u.uid, e.target.value)}
                        className="bg-surface-container-low border-none rounded-lg text-xs font-bold p-2 focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Unassigned</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Design">Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="HR">HR</option>
                        <option value="Sales">Sales</option>
                      </select>
                    </td>
                    <td className="py-4">
                      <select 
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.uid, e.target.value as any)}
                        className="bg-surface-container-low border-none rounded-lg text-xs font-bold p-2 focus:ring-1 focus:ring-primary"
                      >
                        <option value="member">Member</option>
                        <option value="hr">HR</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        u.onboarded ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {u.onboarded ? "Active" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "teams" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Total Teams</p>
              <h4 className="text-3xl font-black text-primary">{teamMetrics.length}</h4>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Top Department</p>
              <h4 className="text-3xl font-black text-secondary">
                {teamMetrics.sort((a, b) => b.points - a.points)[0]?.name || "—"}
              </h4>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Total Members</p>
              <h4 className="text-3xl font-black text-tertiary">{allUsers.length}</h4>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
            <h3 className="text-xl font-black tracking-tight mb-6">Department Performance</h3>
            <div className="space-y-6">
              {teamMetrics.map((team) => (
                <div key={team.name} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <h5 className="font-black text-sm">{team.name}</h5>
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                        {team.users} Members • {team.avgStreak}d Avg Streak
                      </p>
                    </div>
                    <span className="text-sm font-black text-primary">{team.points} PTS</span>
                  </div>
                  <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((team.points / (Math.max(...teamMetrics.map(t => t.points)) || 1)) * 100, 100)}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
              <h3 className="text-xl font-black tracking-tight mb-6">Avg Points per Member</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamMetrics}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--on-surface-variant)' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--on-surface-variant)' }} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="avgPoints" radius={[8, 8, 0, 0]}>
                      {teamMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--color-primary)' : 'var(--color-secondary)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
              <h3 className="text-xl font-black tracking-tight mb-6">Task Completion Rate (%)</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamMetrics}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--on-surface-variant)' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--on-surface-variant)' }} 
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="completionRate" radius={[8, 8, 0, 0]}>
                      {teamMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--color-tertiary)' : 'var(--color-primary)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
              <h3 className="text-lg font-black tracking-tight mb-4">Engagement Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamMetrics}>
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="points" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
              <h3 className="text-lg font-black tracking-tight mb-4">Team Consistency</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamMetrics}>
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="avgStreak" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === "rewards" && (
        <div className="space-y-8">
          {/* Create Reward */}
          <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-outline-variant/10 space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tight">Create New Reward</h3>
              <p className="text-on-surface-variant text-sm">Add exciting rewards for your team members.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Reward Name</label>
                  <input 
                    value={rewardName}
                    onChange={(e) => setRewardName(e.target.value)}
                    placeholder="e.g., Amazon Gift Card"
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Points Cost</label>
                  <input 
                    type="number"
                    value={rewardPoints}
                    onChange={(e) => setRewardPoints(Number(e.target.value))}
                    placeholder="100"
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Category</label>
                  <select 
                    value={rewardCategory}
                    onChange={(e) => setRewardCategory(e.target.value as Reward['category'])}
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary"
                  >
                    <option value="Gift Cards">Gift Cards</option>
                    <option value="Extra Time Off">Extra Time Off</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Experiences">Experiences</option>
                    <option value="Recognition">Recognition</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Description</label>
                  <textarea 
                    value={rewardDesc}
                    onChange={(e) => setRewardDesc(e.target.value)}
                    placeholder="Describe what this reward includes..."
                    rows={6}
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <button 
                  onClick={handleCreateReward}
                  disabled={!rewardName || !rewardDesc}
                  className="w-full bg-primary text-white font-black py-4 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  Create Reward
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleSeedRewards}
                className="bg-secondary text-on-secondary font-bold px-6 py-3 rounded-xl shadow-lg shadow-secondary/20 transition-all active:scale-95"
              >
                Add Sample Rewards
              </button>
            </div>
          </div>

          {/* Existing Rewards */}
          <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-outline-variant/10">
            <h3 className="text-xl font-black tracking-tight mb-6">Available Rewards</h3>
            {rewards.length === 0 ? (
              <p className="text-on-surface-variant font-medium italic">No rewards created yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map(reward => (
                  <div key={reward.id} className="bg-surface rounded-3xl p-6 border border-outline-variant/10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                      <Gift className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-black mb-2">{reward.name}</h4>
                    <p className="text-sm text-on-surface-variant mb-4">{reward.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-black">{reward.pointsCost} PTS</span>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-bold",
                        reward.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {reward.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Redemption Requests */}
          <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-outline-variant/10">
            <h3 className="text-xl font-black tracking-tight mb-6">Redemption Requests</h3>
            {redemptions.length === 0 ? (
              <p className="text-on-surface-variant font-medium italic">No redemption requests yet.</p>
            ) : (
              <div className="space-y-4">
                {redemptions.map(redemption => (
                  <div key={redemption.id} className="bg-surface p-6 rounded-xl border border-outline-variant/10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-black">{redemption.rewardName}</h4>
                        <p className="text-sm text-on-surface-variant">
                          Requested by {redemption.userName} ({redemption.userEmail})
                        </p>
                        <p className="text-sm text-on-surface-variant">
                          {redemption.pointsSpent} points • {new Date(redemption.requestedAt.toDate()).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase",
                        redemption.status === "approved" ? "bg-green-100 text-green-700" :
                        redemption.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        redemption.status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      )}>
                        {redemption.status}
                      </div>
                    </div>
                    {redemption.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateRedemption(redemption.id, "approved")}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateRedemption(redemption.id, "rejected")}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsView({ profile, theme, onToggleTheme, accentColor, onSetAccentColor }: { 
  profile: UserProfile | null, 
  theme: 'light' | 'dark', 
  onToggleTheme: () => void,
  accentColor: string,
  onSetAccentColor: (color: string) => void
}) {
  const colors = [
    { name: "Indigo Pulse", value: "#4a40e0" },
    { name: "Emerald Energy", value: "#10b981" },
    { name: "Rose Radiance", value: "#f43f5e" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 md:space-y-8">
      <h3 className="text-lg font-black tracking-tight flex items-center gap-3">
        <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center text-2xl font-black" style={{ backgroundColor: 'var(--primary, #4a40e0)' }}>
          {profile?.displayName?.charAt(0).toUpperCase()}
        </div>
        Profile
      </h3>
      <div className="bg-surface-container-lowest p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-xl border border-outline-variant/10 space-y-6 md:space-y-8">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative">
            <ProfileAvatar photoURL={profile?.photoURL} displayName={profile?.displayName} size="lg" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight">{profile?.displayName}</h3>
            <p className="text-on-surface-variant font-medium">{profile?.email}</p>
            <div className="flex gap-2 mt-3">
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                {profile?.role}
              </span>
              <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest rounded-full">
                {profile?.department}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-8 border-t border-outline-variant/10">
          <h4 className="text-sm font-black uppercase tracking-widest text-on-surface-variant">Your Badges</h4>
          <BadgeList badgeIds={profile?.badges || []} />
        </div>

        <div className="space-y-6 pt-8 border-t border-outline-variant/10">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-on-surface">Dark Mode</h4>
              <p className="text-xs text-on-surface-variant font-medium">Switch between light and dark themes</p>
            </div>
            <button 
              onClick={onToggleTheme}
              className={cn(
                "w-14 h-8 rounded-full p-1 transition-all duration-300 flex items-center",
                theme === 'dark' ? "bg-primary" : "bg-outline-variant"
              )}
            >
              <motion.div 
                layout
                className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center"
                animate={{ x: theme === 'dark' ? 24 : 0 }}
              >
                {theme === 'dark' ? <Moon size={12} className="text-primary" /> : <Sun size={12} className="text-outline" />}
              </motion.div>
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-on-surface-variant">Accent Color</h4>
            <div className="grid grid-cols-3 gap-4">
              {colors.map((c) => (
                <div 
                  key={c.value}
                  onClick={() => onSetAccentColor(c.value)}
                  className={cn(
                    "p-4 rounded-2xl text-center cursor-pointer transition-all group",
                    accentColor === c.value ? "bg-primary/10 border-2 border-primary" : "bg-surface-container-low border-2 border-transparent hover:bg-surface-container"
                  )}
                >
                  <div 
                    className="w-8 h-8 rounded-xl mx-auto mb-2 shadow-lg group-hover:scale-110 transition-transform" 
                    style={{ backgroundColor: c.value }}
                  />
                  <span className="text-[10px] font-black uppercase tracking-tighter">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8">
          <button className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            Save Profile Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function RewardsView({ userId, userProfile }: { userId: string, userProfile: UserProfile | null }) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    loadRewards();
    loadRedemptions();
  }, []);

  const loadRewards = async () => {
    try {
      const rewardsData = await getRewards();
      setRewards(rewardsData.filter(r => r.available));
    } catch (error) {
      console.error("Failed to load rewards:", error);
    }
  };

  const loadRedemptions = async () => {
    try {
      const redemptionsData = await getRedemptions();
      setRedemptions(redemptionsData.filter(r => r.userId === userId));
    } catch (error) {
      console.error("Failed to load redemptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (!userProfile || userProfile.points < reward.pointsCost) {
      alert("Insufficient points!");
      return;
    }

    try {
      await redeemReward(reward.id, userId, userProfile.displayName, userProfile.email);
      alert("Reward redemption request submitted! HR will review it.");
      loadRedemptions(); // Refresh redemptions
      // Note: Points are deducted in the redeemReward function
    } catch (error) {
      console.error("Failed to redeem reward:", error);
      alert("Failed to redeem reward. Please try again.");
    }
  };

  const filteredRewards = selectedCategory === "all" 
    ? rewards 
    : rewards.filter(r => r.category === selectedCategory);

  const categories = ["all", ...Array.from(new Set(rewards.map(r => r.category)))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-black tracking-tight">Rewards Store</h1>
          <p className="text-on-surface-variant mt-2">Redeem your hard-earned points for amazing rewards!</p>
        </div>
        <div className="bg-primary/10 px-4 py-2 rounded-xl">
          <span className="text-primary font-black">{userProfile?.points || 0} PTS</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "px-4 py-2 rounded-xl font-bold text-sm transition-all",
              selectedCategory === category
                ? "bg-primary text-white"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            {category === "all" ? "All Rewards" : category}
          </button>
        ))}
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {filteredRewards.map(reward => (
          <div key={reward.id} className="bg-surface-container-low rounded-2xl md:rounded-3xl p-4 md:p-6 border border-outline-variant/10 hover:shadow-xl active:scale-[0.98] transition-all">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Gift className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-black mb-2">{reward.name}</h3>
            <p className="text-on-surface-variant text-sm mb-4 leading-relaxed">{reward.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-primary font-black text-lg">{reward.pointsCost} PTS</span>
              <button
                onClick={() => handleRedeem(reward)}
                disabled={!userProfile || userProfile.points < reward.pointsCost}
                className="bg-primary text-white px-4 py-2 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Redeem
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* My Redemptions */}
      <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-outline-variant/10">
        <h3 className="text-lg font-black tracking-tight mb-6">My Redemption History</h3>
        {redemptions.length === 0 ? (
          <p className="text-on-surface-variant font-medium italic">No redemptions yet. Start earning points to unlock rewards!</p>
        ) : (
          <div className="space-y-4">
            {redemptions.map(redemption => (
              <div key={redemption.id} className="flex items-center justify-between p-4 bg-surface rounded-xl">
                <div>
                  <h4 className="font-bold">{redemption.rewardName}</h4>
                  <p className="text-sm text-on-surface-variant">
                    {redemption.pointsSpent} points • {redemption.status}
                  </p>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase",
                  redemption.status === "approved" ? "bg-green-100 text-green-700" :
                  redemption.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                  redemption.status === "rejected" ? "bg-red-100 text-red-700" :
                  "bg-blue-100 text-blue-700"
                )}>
                  {redemption.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
