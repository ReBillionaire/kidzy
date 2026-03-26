import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword,
  firebaseSignOut, onAuthChange, isFirebaseConfigured,
} from '../utils/firebase';
import { setUserProfile, getUserFamilies, getFamilies } from '../utils/firestore';

const AuthContext = createContext(null);

/**
 * AuthProvider — manages Firebase auth state + family selection.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [authError, setAuthError] = useState(null);
  const [families, setFamilies] = useState([]);
  const [currentFamilyId, setCurrentFamilyId] = useState(() => {
    try { return localStorage.getItem('kidzy_current_family') || null; } catch { return null; }
  });

  // Persist selected family
  useEffect(() => {
    try {
      if (currentFamilyId) localStorage.setItem('kidzy_current_family', currentFamilyId);
      else localStorage.removeItem('kidzy_current_family');
    } catch {}
  }, [currentFamilyId]);

  // Load user's families
  const refreshFamilies = useCallback(async (uid) => {
    if (!uid) { setFamilies([]); return; }
    try {
      const familyIds = await getUserFamilies(uid);
      const familyList = await getFamilies(familyIds);
      setFamilies(familyList);

      // Auto-select if only one family or previous selection still valid
      if (familyList.length === 1) {
        setCurrentFamilyId(familyList[0].id);
      } else if (currentFamilyId && !familyList.find(f => f.id === currentFamilyId)) {
        setCurrentFamilyId(familyList.length > 0 ? familyList[0].id : null);
      }
    } catch (err) {
      console.error('[Kidzy] Failed to load families:', err);
    }
  }, [currentFamilyId]);

  // Subscribe to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Update user profile in Firestore
        await setUserProfile(firebaseUser.uid, firebaseUser);
        await refreshFamilies(firebaseUser.uid);
      } else {
        setFamilies([]);
        setCurrentFamilyId(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth Methods ──────────────────────────────────────────────────

  const emailSignUp = useCallback(async (email, password, displayName) => {
    setAuthError(null);
    try {
      const u = await signUpWithEmail(email, password, displayName);
      return u;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }, []);

  const emailSignIn = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const u = await signInWithEmail(email, password);
      return u;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }, []);

  const googleSignIn = useCallback(async () => {
    setAuthError(null);
    try {
      const u = await signInWithGoogle();
      return u;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }, []);

  const passwordReset = useCallback(async (email) => {
    setAuthError(null);
    try {
      await resetPassword(email);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setAuthError(null);
    await firebaseSignOut();
    setCurrentFamilyId(null);
    setFamilies([]);
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  const value = {
    user,
    loading,
    families,
    currentFamilyId,
    setCurrentFamilyId,
    emailSignUp,
    emailSignIn,
    googleSignIn,
    passwordReset,
    signOut: signOutUser,
    authError,
    clearError,
    isConfigured: isFirebaseConfigured,
    refreshFamilies: () => refreshFamilies(user?.uid),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
