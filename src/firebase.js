import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  addDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';

// Default Firebase Configuration (from environment variables)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if we have at least apiKey and projectId to initialize Firebase
const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app;
let auth;
let db;
let isLocalFallback = false;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase failed to initialize. Falling back to Local Storage mode:", error);
    isLocalFallback = true;
  }
} else {
  console.warn("Firebase configuration environment variables are missing. Running in Local Storage Mode.");
  isLocalFallback = true;
}

// ==========================================
// LOCAL STORAGE BACKEND FALLBACK
// ==========================================
// This mirrors the Firestore & Auth APIs so the frontend behaves identically in Local Mode.

const mockAuthListeners = new Set();
let currentUser = JSON.parse(localStorage.getItem('dg_user')) || null;

const localAuth = {
  currentUser,
  onAuthStateChanged: (callback) => {
    mockAuthListeners.add(callback);
    callback(currentUser);
    return () => mockAuthListeners.delete(callback);
  },
  signInWithEmailAndPassword: async (email) => {
    // Simulated sign in
    const users = JSON.parse(localStorage.getItem('dg_db_users') || '{}');
    const userKey = Object.keys(users).find(k => users[k].email === email);
    if (!userKey) throw new Error("auth/user-not-found");
    
    currentUser = { uid: userKey, email, displayName: users[userKey].name || email.split('@')[0] };
    localStorage.setItem('dg_user', JSON.stringify(currentUser));
    mockAuthListeners.forEach(cb => cb(currentUser));
    return { user: currentUser };
  },
  createUserWithEmailAndPassword: async (email) => {
    const users = JSON.parse(localStorage.getItem('dg_db_users') || '{}');
    const userExists = Object.keys(users).some(k => users[k].email === email);
    if (userExists) throw new Error("auth/email-already-in-use");

    const uid = 'usr_' + Math.random().toString(36).substr(2, 9);
    const newUser = { uid, email, name: email.split('@')[0], productivityScore: 100, createdAt: new Date().toISOString() };
    
    users[uid] = newUser;
    localStorage.setItem('dg_db_users', JSON.stringify(users));

    currentUser = { uid, email, displayName: newUser.name };
    localStorage.setItem('dg_user', JSON.stringify(currentUser));
    mockAuthListeners.forEach(cb => cb(currentUser));
    return { user: currentUser };
  },
  signInWithPopup: async () => {
    // Mock Google sign in
    const uid = 'google_' + Math.random().toString(36).substr(2, 9);
    const email = 'googleuser@example.com';
    const users = JSON.parse(localStorage.getItem('dg_db_users') || '{}');
    
    if (!users[uid]) {
      users[uid] = { uid, email, name: "Google User", productivityScore: 100, createdAt: new Date().toISOString() };
      localStorage.setItem('dg_db_users', JSON.stringify(users));
    }
    
    currentUser = { uid, email, displayName: "Google User" };
    localStorage.setItem('dg_user', JSON.stringify(currentUser));
    mockAuthListeners.forEach(cb => cb(currentUser));
    return { user: currentUser };
  },
  signOut: async () => {
    currentUser = null;
    localStorage.removeItem('dg_user');
    mockAuthListeners.forEach(cb => cb(null));
  }
};

const localDb = {
  // Simple document operations
  getDoc: async (collectionName, docId) => {
    const data = JSON.parse(localStorage.getItem(`dg_db_${collectionName}`) || '{}');
    return {
      exists: () => !!data[docId],
      data: () => data[docId] || null,
      id: docId
    };
  },
  setDoc: async (collectionName, docId, docData) => {
    const data = JSON.parse(localStorage.getItem(`dg_db_${collectionName}`) || '{}');
    data[docId] = { ...data[docId], ...docData, updatedAt: new Date().toISOString() };
    localStorage.setItem(`dg_db_${collectionName}`, JSON.stringify(data));
  },
  addDoc: async (collectionName, docData) => {
    const data = JSON.parse(localStorage.getItem(`dg_db_${collectionName}`) || '{}');
    const docId = collectionName.substring(0, 3) + '_' + Math.random().toString(36).substr(2, 9);
    data[docId] = { ...docData, id: docId, createdAt: new Date().toISOString() };
    localStorage.setItem(`dg_db_${collectionName}`, JSON.stringify(data));
    return { id: docId };
  },
  updateDoc: async (collectionName, docId, docData) => {
    const data = JSON.parse(localStorage.getItem(`dg_db_${collectionName}`) || '{}');
    if (!data[docId]) throw new Error("Document not found");
    data[docId] = { ...data[docId], ...docData, updatedAt: new Date().toISOString() };
    localStorage.setItem(`dg_db_${collectionName}`, JSON.stringify(data));
  },
  deleteDoc: async (collectionName, docId) => {
    const data = JSON.parse(localStorage.getItem(`dg_db_${collectionName}`) || '{}');
    delete data[docId];
    localStorage.setItem(`dg_db_${collectionName}`, JSON.stringify(data));
  },
  getDocs: async (collectionName, queryOptions = []) => {
    let items = Object.values(JSON.parse(localStorage.getItem(`dg_db_${collectionName}`) || '{}'));
    
    // Apply basic filtering if queryOptions are passed
    queryOptions.forEach(opt => {
      if (opt.type === 'where') {
        const { field, op, value } = opt;
        if (op === '==') {
          items = items.filter(item => item[field] === value);
        }
      }
    });

    return {
      docs: items.map(item => ({
        id: item.id || item.taskId || item.goalId || item.planId || item.notificationId,
        data: () => item
      }))
    };
  },
  // Real-time synchronization mockup
  onSnapshot: (collectionName, queryOptions, callback) => {
    const checkUpdate = () => {
      localDb.getDocs(collectionName, queryOptions).then(snapshot => {
        callback(snapshot);
      });
    };
    
    checkUpdate();
    
    // Poll localstorage modifications as a basic dynamic replacement
    const interval = setInterval(checkUpdate, 1500);
    return () => clearInterval(interval);
  }
};

// ==========================================
// EXPORTS WRAPPER
// ==========================================

const isGuestUser = () => {
  try {
    const guestUser = localStorage.getItem('dg_user');
    if (guestUser) {
      const parsed = JSON.parse(guestUser);
      return parsed && parsed.uid === 'usr_guest';
    }
  } catch {
    // ignore
  }
  return false;
};

const actualAuth = isLocalFallback ? localAuth : auth;
const guestAuthListeners = new Set();

export const authInstance = {
  get currentUser() {
    try {
      const guestUser = localStorage.getItem('dg_user');
      if (guestUser) {
        const parsed = JSON.parse(guestUser);
        if (parsed && parsed.uid === 'usr_guest') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return actualAuth.currentUser;
  },
  onAuthStateChanged(callback) {
    return actualAuth.onAuthStateChanged(callback);
  },
  signOut() {
    localStorage.removeItem('dg_user');
    guestAuthListeners.forEach(cb => cb(null));
    guestAuthListeners.clear();
    return actualAuth.signOut();
  }
};

export const dbInstance = isLocalFallback ? localDb : db;
export { isLocalFallback };

// Export wrappers that abstract Firebase v9 vs LocalStorage
export const loginUser = (email, password) => {
  if (isLocalFallback) return localAuth.signInWithEmailAndPassword(email, password);
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerUser = (email, password) => {
  if (isLocalFallback) return localAuth.createUserWithEmailAndPassword(email, password);
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logoutUser = () => {
  localStorage.removeItem('dg_user');
  guestAuthListeners.forEach(cb => cb(null));
  guestAuthListeners.clear();
  if (isLocalFallback) return localAuth.signOut();
  return signOut(auth);
};

export const loginWithGoogle = () => {
  if (isLocalFallback) return localAuth.signInWithPopup();
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const subscribeToAuth = (callback) => {
  try {
    const guestUser = localStorage.getItem('dg_user');
    if (guestUser) {
      const parsed = JSON.parse(guestUser);
      if (parsed && parsed.uid === 'usr_guest') {
        callback(parsed);
        guestAuthListeners.add(callback);
        return () => {
          guestAuthListeners.delete(callback);
        };
      }
    }
  } catch {
    // ignore
  }
  if (isLocalFallback) return localAuth.onAuthStateChanged(callback);
  return onAuthStateChanged(auth, callback);
};

// Firestore helper abstracts
export const getDocument = async (col, docId) => {
  if (isLocalFallback || isGuestUser()) return localDb.getDoc(col, docId);
  try {
    const snap = await getDoc(doc(db, col, docId));
    return snap;
  } catch (error) {
    console.warn(`Firestore getDocument failed for ${col}/${docId}. Falling back to LocalStorage:`, error);
    return localDb.getDoc(col, docId);
  }
};

export const setDocument = async (col, docId, data) => {
  if (isLocalFallback || isGuestUser()) return localDb.setDoc(col, docId, data);
  try {
    return await setDoc(doc(db, col, docId), data, { merge: true });
  } catch (error) {
    console.warn(`Firestore setDocument failed for ${col}/${docId}. Falling back to LocalStorage:`, error);
    return localDb.setDoc(col, docId, data);
  }
};

export const createDocument = async (col, data) => {
  if (isLocalFallback || isGuestUser()) return localDb.addDoc(col, data);
  try {
    return await addDoc(collection(db, col), data);
  } catch (error) {
    console.warn(`Firestore createDocument failed for ${col}. Falling back to LocalStorage:`, error);
    return localDb.addDoc(col, data);
  }
};

export const updateDocument = async (col, docId, data) => {
  if (isLocalFallback || isGuestUser()) return localDb.updateDoc(col, docId, data);
  try {
    return await updateDoc(doc(db, col, docId), data);
  } catch (error) {
    console.warn(`Firestore updateDocument failed for ${col}/${docId}. Falling back to LocalStorage:`, error);
    return localDb.updateDoc(col, docId, data);
  }
};

export const deleteDocument = async (col, docId) => {
  if (isLocalFallback || isGuestUser()) return localDb.deleteDoc(col, docId);
  try {
    return await deleteDoc(doc(db, col, docId));
  } catch (error) {
    console.warn(`Firestore deleteDocument failed for ${col}/${docId}. Falling back to LocalStorage:`, error);
    return localDb.deleteDoc(col, docId);
  }
};

export const queryDocuments = async (col, ...conditions) => {
  if (isLocalFallback || isGuestUser()) {
    const localConditions = conditions.map(c => c);
    return localDb.getDocs(col, localConditions);
  }
  try {
    const q = query(collection(db, col), ...conditions);
    return await getDocs(q);
  } catch (error) {
    console.warn(`Firestore queryDocuments failed for ${col}. Falling back to LocalStorage:`, error);
    const localConditions = conditions.map(c => c);
    return localDb.getDocs(col, localConditions);
  }
};

export const streamDocuments = (col, conditions, callback) => {
  if (isLocalFallback || isGuestUser()) {
    return localDb.onSnapshot(col, conditions, callback);
  }

  let activeUnsubscribe = null;
  let hasFailed = false;

  try {
    const q = query(collection(db, col), ...conditions);
    activeUnsubscribe = onSnapshot(q, callback, (error) => {
      console.warn(`Firestore streamDocuments error for ${col}. Falling back to LocalStorage:`, error);
      hasFailed = true;
      if (activeUnsubscribe) activeUnsubscribe();
      activeUnsubscribe = localDb.onSnapshot(col, conditions, callback);
    });
    
    if (hasFailed) {
      if (activeUnsubscribe) activeUnsubscribe();
      activeUnsubscribe = localDb.onSnapshot(col, conditions, callback);
    }
  } catch (error) {
    console.warn(`Firestore streamDocuments setup failed for ${col}. Falling back to LocalStorage:`, error);
    activeUnsubscribe = localDb.onSnapshot(col, conditions, callback);
  }

  return () => {
    if (activeUnsubscribe) activeUnsubscribe();
  };
};

// Standard where/orderBy builder helpers
export const whereClause = (field, op, value) => {
  if (isLocalFallback) {
    return { type: 'where', field, op, value };
  }
  return where(field, op, value);
};

export const orderByClause = (field, direction = 'asc') => {
  if (isLocalFallback) {
    return { type: 'orderBy', field, direction };
  }
  return orderBy(field, direction);
};

export const seedUserDatabase = async (userId) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(17, 0, 0, 0);

  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + (5 - nextFriday.getDay() + 7) % 7 || 7);
  nextFriday.setHours(18, 0, 0, 0);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  // 1. Update user score to 82
  await setDocument('users', userId, { 
    uid: userId,
    productivityScore: 82,
    createdAt: new Date().toISOString()
  });

  // 2. Seed Tasks
  const sampleTasks = [
    {
      id: 'tsk_1_' + userId,
      userId,
      title: 'Review physics syllabus and summary sheets',
      description: 'Need to review equations for midterm exam.',
      deadline: yesterday.toISOString(),
      priority: 'high',
      estimatedHours: 3,
      status: 'pending',
      aiGeneratedSubtasks: [
        { id: 'sub_1a', title: 'Collect formula notebook', status: 'completed', estimatedHours: 0.5 },
        { id: 'sub_1b', title: 'Solve past mock tests', status: 'pending', estimatedHours: 1.5 },
        { id: 'sub_1c', title: 'Memorize thermodynamic laws', status: 'pending', estimatedHours: 1 }
      ],
      createdAt: yesterday.toISOString()
    },
    {
      id: 'tsk_2_' + userId,
      userId,
      title: 'Build React UI for Vibe2Ship Hackathon',
      description: 'Complete the landing page, analytics dashboard, and voice settings.',
      deadline: nextFriday.toISOString(),
      priority: 'high',
      estimatedHours: 6,
      status: 'in_progress',
      aiGeneratedSubtasks: [
        { id: 'sub_2a', title: 'Configure project routers', status: 'completed', estimatedHours: 1 },
        { id: 'sub_2b', title: 'Write glassmorphic component libraries', status: 'completed', estimatedHours: 1.5 },
        { id: 'sub_2c', title: 'Integrate browser speech synthesis', status: 'pending', estimatedHours: 1.5 },
        { id: 'sub_2d', title: 'Test production deployment hosting', status: 'pending', estimatedHours: 2 }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'tsk_3_' + userId,
      userId,
      title: 'Prepare Vibe2Ship submission slideshow',
      description: 'Build slides showing Problem Selected, Tech Stack, and Agentic Depth highlights.',
      deadline: tomorrow.toISOString(),
      priority: 'medium',
      estimatedHours: 2.5,
      status: 'pending',
      aiGeneratedSubtasks: [
        { id: 'sub_3a', title: 'Write outline summary docs', status: 'pending', estimatedHours: 1 },
        { id: 'sub_3b', title: 'Design slide layouts', status: 'pending', estimatedHours: 1.5 }
      ],
      createdAt: new Date().toISOString()
    }
  ];

  for (const t of sampleTasks) {
    await setDocument('tasks', t.id, t);
  }

  // 3. Seed Goals
  const sampleGoals = [
    {
      goalId: 'go_1_' + userId,
      userId,
      title: 'Maintain 90% Deadline Compliance',
      category: 'career',
      targetDate: nextFriday.toISOString(),
      progress: 82,
      habits: [
        { name: 'Plan daily focus sessions', frequency: 'daily', history: [yesterday.toISOString().split('T')[0]] },
        { name: 'Perform weekly risk checks', frequency: 'weekly', history: [] }
      ]
    },
    {
      goalId: 'go_2_' + userId,
      userId,
      title: 'Learn Advanced Gemini Integration',
      category: 'study',
      targetDate: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 40,
      habits: [
        { name: 'Read AI SDK docs for 15m', frequency: 'daily', history: [yesterday.toISOString().split('T')[0]] }
      ]
    }
  ];

  for (const g of sampleGoals) {
    await setDocument('goals', g.goalId, g);
  }

  // 4. Seed Plans
  const todayStr = new Date().toISOString().split('T')[0];
  const samplePlan = {
    planId: 'pl_1_' + userId,
    userId,
    generatedSchedule: [
      {
        date: todayStr,
        timeBlocks: [
          { startTime: '10:00', endTime: '11:30', taskId: 'tsk_2_' + userId, subtaskId: 'sub_2c', taskTitle: 'Build React UI for Vibe2Ship', subtaskTitle: 'Integrate browser speech synthesis' },
          { startTime: '14:00', endTime: '15:30', taskId: 'tsk_3_' + userId, subtaskId: 'sub_3a', taskTitle: 'Prepare submission slideshow', subtaskTitle: 'Write outline summary docs' }
        ]
      }
    ],
    progress: 0.5,
    updatedAt: new Date().toISOString()
  };

  await setDocument('plans', samplePlan.planId, samplePlan);
};
