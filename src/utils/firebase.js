import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ── Firebase Configuration ──────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ── Config Validation ───────────────────────────────────────────────
const REQUIRED_KEYS = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = REQUIRED_KEYS.filter(key => !firebaseConfig[key]);
export const isFirebaseConfigured = missingKeys.length === 0;

if (!isFirebaseConfigured) {
  console.warn(
    `[Kidzy] Firebase not configured — missing: ${missingKeys.join(', ')}. ` +
    'Auth disabled. Set VITE_FIREBASE_* in .env.local to enable.'
  );
}

// ── Firebase Init ───────────────────────────────────────────────────
let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.error('[Kidzy] Failed to set auth persistence:', err.code);
    });
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (error) {
    console.error('[Kidzy] Firebase initialization failed:', error.message);
  }
}

// Export Firestore instance
export { db };

// ── Auth Error Messages ─────────────────────────────────────────────
const AUTH_ERROR_MESSAGES = {
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'Pop-up blocked. Please allow pop-ups for this site.',
  'auth/cancelled-popup-request': 'Only one sign-in window at a time.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/unauthorized-domain': 'Domain not authorized for sign-in.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Try again or reset it.',
  'auth/invalid-credential': 'Invalid email or password.',
};

function getAuthErrorMessage(error) {
  return AUTH_ERROR_MESSAGES[error.code] || `Auth error: ${error.message}`;
}

// ── Sanitize Firebase User ──────────────────────────────────────────
function sanitizeUser(user) {
  return {
    uid: user.uid,
    name: user.displayName || 'Parent',
    email: user.email || '',
    avatar: user.photoURL || null,
    providerId: user.providerData?.[0]?.providerId || 'unknown',
  };
}

// ── Auth Functions ──────────────────────────────────────────────────

/** Sign up with email + password */
export async function signUpWithEmail(email, password, displayName) {
  if (!auth) throw new Error('Firebase is not configured.');
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    return sanitizeUser(result.user);
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
}

/** Sign in with email + password */
export async function signInWithEmail(email, password) {
  if (!auth) throw new Error('Firebase is not configured.');
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return sanitizeUser(result.user);
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
}

/** Sign in with Google popup */
export async function signInWithGoogle() {
  if (!auth || !googleProvider) throw new Error('Google Sign-In not available.');
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return sanitizeUser(result.user);
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
}

/** Send password reset email */
export async function resetPassword(email) {
  if (!auth) throw new Error('Firebase is not configured.');
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
}

/** Sign out */
export async function firebaseSignOut() {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('[Kidzy] Sign-out error:', error.code);
  }
}

/** Subscribe to auth state changes */
export function onAuthChange(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    callback(user ? sanitizeUser(user) : null);
  }, (error) => {
    console.error('[Kidzy] Auth state error:', error.code);
    callback(null);
  });
}

/** Get current user synchronously */
export function getCurrentUser() {
  return auth?.currentUser ? sanitizeUser(auth.currentUser) : null;
}
