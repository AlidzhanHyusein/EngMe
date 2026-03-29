import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  getDocFromServer,
  getFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import {initializeApp, getApp, getApps} from "firebase/app";
import {getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword} from "firebase/auth";
import {db, auth, googleProvider} from "../firebase";
import firebaseConfig from "../../firebase-applet-config.json";
import {UserProfile, WorkspaceTask, FeedItem, TaskStatus, Reward, RewardRedemption, Notification} from "../types";

import {BADGES, BadgeDefinition} from "../constants";

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User Profile
export async function createUserProfile(profile: UserProfile) {
  const path = `users/${profile.uid}`;
  try {
    const fullProfile = {
      ...profile,
      completedTasksCount: profile.completedTasksCount || 0,
      badges: profile.badges || [],
    };
    await setDoc(doc(db, "users", profile.uid), fullProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>) {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, "users", uid), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Tasks
export async function createTask(task: Omit<WorkspaceTask, "id" | "createdAt">) {
  const path = "tasks";
  try {
    const newDocRef = doc(collection(db, "tasks"));
    const newTask: WorkspaceTask = {
      ...task,
      id: newDocRef.id,
      createdAt: new Date() as any,
    };
    await setDoc(newDocRef, newTask);
    return newTask;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const path = `tasks/${taskId}`;
  try {
    await updateDoc(doc(db, "tasks", taskId), {status});
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function completeTaskWithPoints(taskId: string, points: number, userId: string) {
  const taskPath = `tasks/${taskId}`;
  const userPath = `users/${userId}`;
  try {
    // 1. Update task status
    await updateDoc(doc(db, "tasks", taskId), {status: "completed"});

    // 2. Update user points and task count
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      const currentPoints = data.points || 0;
      const currentCount = data.completedTasksCount || 0;
      await updateDoc(userRef, {
        points: currentPoints + points,
        completedTasksCount: currentCount + 1,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${taskPath} & ${userPath}`);
  }
}

export async function checkAndAwardBadges(userId: string): Promise<BadgeDefinition[]> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return [];

  const profile = userSnap.data() as UserProfile;
  const newlyAwarded: BadgeDefinition[] = [];
  const currentBadges = [...(profile.badges || [])];

  for (const badge of BADGES) {
    if (currentBadges.includes(badge.id)) continue;

    let qualified = false;
    if (badge.criteria.type === "points" && profile.points >= badge.criteria.value) qualified = true;
    if (badge.criteria.type === "streak" && profile.streak >= badge.criteria.value) qualified = true;
    if (badge.criteria.type === "tasks" && (profile.completedTasksCount || 0) >= badge.criteria.value) qualified = true;

    if (qualified) {
      newlyAwarded.push(badge);
      currentBadges.push(badge.id);
    }
  }

  if (newlyAwarded.length > 0) {
    await updateDoc(userRef, {badges: currentBadges});
    // Create feed items for milestones
    for (const badge of newlyAwarded) {
      await createFeedItem(`Earned the "${badge.name}" badge! 🏆`, "milestone");
    }
  }

  return newlyAwarded;
}

// Feed
export async function createFeedItem(content: string, type: FeedItem["type"], mediaUrl?: string, mediaType?: "image" | "video") {
  const path = "feed";
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    const newDocRef = doc(collection(db, "feed"));
    const newItem: FeedItem = {
      id: newDocRef.id,
      authorUid: user.uid,
      authorName: user.displayName || "Anonymous",
      authorPhoto: user.photoURL || "",
      content,
      type,
      likes: [],
      reactions: {},
      createdAt: Timestamp.now(),
    };

    // Only include media fields if they have values
    if (mediaUrl) {
      newItem.mediaUrl = mediaUrl;
    }
    if (mediaType) {
      newItem.mediaType = mediaType;
    }

    await setDoc(newDocRef, newItem);
    return newItem;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function toggleLike(itemId: string, userId: string) {
  const path = `feed/${itemId}`;
  try {
    const docRef = doc(db, "feed", itemId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as FeedItem;
      const likes = data.likes.includes(userId) ? data.likes.filter((id) => id !== userId) : [...data.likes, userId];
      await updateDoc(docRef, {likes});
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleReaction(itemId: string, userId: string, reactionType: string) {
  const path = `feed/${itemId}`;
  try {
    const docRef = doc(db, "feed", itemId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as FeedItem;
      const reactions = data.reactions || {};
      const currentUsers = reactions[reactionType] || [];

      const newUsers = currentUsers.includes(userId) ? currentUsers.filter((id) => id !== userId) : [...currentUsers, userId];

      await updateDoc(docRef, {
        [`reactions.${reactionType}`]: newUsers,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Registration by HR
// Creates the new account using a secondary Firebase app so the HR user
// stays signed-in, then writes the Firestore profile **as the new user**
// (using secondaryDb) so that request.auth.uid == userId always holds.
export async function registerUserByHR(userData: {email: string; password: string; displayName: string; department: string}) {
  const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true" || (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS !== "false");

  // Reuse or create the secondary Firebase app
  const secondaryApp = getApps().find((a) => a.name === "secondary") ?? initializeApp(firebaseConfig, "secondary");

  const secondaryAuth = getAuth(secondaryApp);
  const secondaryDb = getFirestore(secondaryApp, firebaseConfig.firestoreDatabaseId);

  // Mirror emulator settings on the secondary instances
  if (useEmulators) {
    try {
      connectAuthEmulator(secondaryAuth, "http://localhost:9099", {disableWarnings: true});
    } catch {}
    try {
      connectFirestoreEmulator(secondaryDb, "localhost", 8081);
    } catch {}
  }

  try {
    // 1. Create the Firebase Auth account (secondary app — HR stays logged in)
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, userData.password);
    const user = userCredential.user;

    // 2. Build the profile object
    const profile: UserProfile = {
      uid: user.uid,
      displayName: userData.displayName,
      email: userData.email,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
      role: "member",
      department: userData.department,
      points: 0,
      streak: 0,
      badges: [],
      completedTasksCount: 0,
      onboarded: true,
      uuid: crypto.randomUUID(),
    };

    // 3. Write the Firestore doc using secondaryDb (authenticated as the NEW user)
    //    This ensures request.auth.uid == userId in Firestore rules — always passes.
    await setDoc(doc(secondaryDb, "users", user.uid), profile);

    // 4. Optional backend notification (non-fatal)
    try {
      await fetch("/api/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.displayName,
          department: userData.department,
        }),
      });
    } catch {
      // email endpoint is optional
    }

    // 5. Sign the secondary user out
    await secondaryAuth.signOut();

    return profile;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

// Login
export async function loginWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

export async function deleteTask(taskId: string) {
  const path = `tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, "tasks", taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
// Connection Test
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}

// Rewards Management
export async function createReward(reward: Omit<Reward, "id" | "createdAt">) {
  try {
    const rewardId = doc(collection(db, "rewards")).id;
    const path = `rewards/${rewardId}`;
    const newReward: Reward = {
      ...reward,
      id: rewardId,
      createdAt: Timestamp.now(),
    };
    await setDoc(doc(db, "rewards", newReward.id), newReward);
    return newReward;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `rewards`);
  }
}

export async function getRewards(): Promise<Reward[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "rewards"));
    return querySnapshot.docs.map((doc) => doc.data() as Reward);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "rewards");
    return [];
  }
}

export async function updateReward(rewardId: string, updates: Partial<Reward>) {
  const path = `rewards/${rewardId}`;
  try {
    await updateDoc(doc(db, "rewards", rewardId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteReward(rewardId: string) {
  const path = `rewards/${rewardId}`;
  try {
    await deleteDoc(doc(db, "rewards", rewardId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Reward Redemptions
export async function redeemReward(rewardId: string, userId: string, userName: string, userEmail: string): Promise<RewardRedemption> {
  try {
    // Get reward details
    const rewardDoc = await getDoc(doc(db, "rewards", rewardId));
    if (!rewardDoc.exists()) throw new Error("Reward not found");

    const reward = rewardDoc.data() as Reward;

    // Check if user has enough points
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) throw new Error("User not found");

    const userProfile = userDoc.data() as UserProfile;
    if (userProfile.points < reward.pointsCost) {
      throw new Error("Insufficient points");
    }

    // Create redemption
    const redemption: RewardRedemption = {
      id: doc(collection(db, "redemptions")).id,
      rewardId,
      userId,
      userName,
      userEmail,
      rewardName: reward.name,
      pointsSpent: reward.pointsCost,
      status: "pending",
      requestedAt: Timestamp.now(),
    };

    await setDoc(doc(db, "redemptions", redemption.id), redemption);

    // Deduct points from user
    await updateDoc(doc(db, "users", userId), {
      points: userProfile.points - reward.pointsCost,
    });

    // Create notification for HR
    await createNotificationForHR(
      "reward_redemption",
      `New reward redemption request from ${userName}`,
      `${userName} has requested to redeem "${reward.name}" for ${reward.pointsCost} points.`,
      redemption.id,
    );

    return redemption;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `redemptions/${rewardId}`);
    throw error;
  }
}

export async function getRedemptions(): Promise<RewardRedemption[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "redemptions"));
    return querySnapshot.docs.map((doc) => doc.data() as RewardRedemption);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "redemptions");
    return [];
  }
}

export async function updateRedemptionStatus(redemptionId: string, status: RewardRedemption["status"], approvedBy?: string) {
  const path = `redemptions/${redemptionId}`;
  try {
    const updates: Partial<RewardRedemption> = {status};
    if (approvedBy) {
      updates.approvedBy = approvedBy;
      updates.approvedAt = Timestamp.now();
    }
    await updateDoc(doc(db, "redemptions", redemptionId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Notifications
export async function createNotificationForHR(type: Notification["type"], title: string, message: string, relatedId?: string) {
  try {
    // Get all HR users
    const hrQuery = query(collection(db, "users"), where("role", "in", ["hr", "admin"]));
    const hrSnapshot = await getDocs(hrQuery);

    const notifications = hrSnapshot.docs.map((hrDoc) => {
      const notification: Notification = {
        id: doc(collection(db, "notifications")).id,
        recipientUid: hrDoc.id,
        type,
        title,
        message,
        read: false,
        createdAt: Timestamp.now(),
        relatedId,
      };
      return setDoc(doc(db, "notifications", notification.id), notification);
    });

    await Promise.all(notifications);
  } catch (error) {
    console.error("Failed to create HR notifications:", error);
  }
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const q = query(collection(db, "notifications"), where("recipientUid", "==", userId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data() as Notification);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `notifications/${userId}`);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const path = `notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, "notifications", notificationId), {read: true});
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function assignRole(email: string): Promise<UserRole> {
  if (email === "alidzanhasan9@gmail.com" || email === "your-email@example.com") {
    return "admin";
  }
  return "member";
}
