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

export const authInstance = isLocalFallback ? localAuth : auth;
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
  if (isLocalFallback) return localAuth.signOut();
  return signOut(auth);
};

export const loginWithGoogle = () => {
  if (isLocalFallback) return localAuth.signInWithPopup();
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const subscribeToAuth = (callback) => {
  if (isLocalFallback) return localAuth.onAuthStateChanged(callback);
  return onAuthStateChanged(auth, callback);
};

// Firestore helper abstracts
export const getDocument = async (col, docId) => {
  if (isLocalFallback) return localDb.getDoc(col, docId);
  const snap = await getDoc(doc(db, col, docId));
  return snap;
};

export const setDocument = async (col, docId, data) => {
  if (isLocalFallback) return localDb.setDoc(col, docId, data);
  return setDoc(doc(db, col, docId), data, { merge: true });
};

export const createDocument = async (col, data) => {
  if (isLocalFallback) return localDb.addDoc(col, data);
  return addDoc(collection(db, col), data);
};

export const updateDocument = async (col, docId, data) => {
  if (isLocalFallback) return localDb.updateDoc(col, docId, data);
  return updateDoc(doc(db, col, docId), data);
};

export const deleteDocument = async (col, docId) => {
  if (isLocalFallback) return localDb.deleteDoc(col, docId);
  return deleteDoc(doc(db, col, docId));
};

export const queryDocuments = async (col, ...conditions) => {
  if (isLocalFallback) {
    // Map Firestore conditions into simple format
    const localConditions = conditions.map(c => {
      // Very basic translation for where clauses
      if (c && c._query) {
        // Fallback or skip if complicated
      }
      return c;
    });
    return localDb.getDocs(col, localConditions);
  }
  
  const q = query(collection(db, col), ...conditions);
  return getDocs(q);
};

export const streamDocuments = (col, conditions, callback) => {
  if (isLocalFallback) {
    return localDb.onSnapshot(col, conditions, callback);
  }
  const q = query(collection(db, col), ...conditions);
  return onSnapshot(q, callback);
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
