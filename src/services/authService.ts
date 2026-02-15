import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import { auth } from '../config/firebase';

const googleProvider = new GoogleAuthProvider();
const popupFallbackCodes = new Set([
  'auth/popup-blocked',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
]);

export const authService = {
  onUserChanged(callback: (user: User | null) => void): Unsubscribe {
    if (!auth) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  },

  async signInWithGoogle(): Promise<void> {
    if (!auth) throw new Error('Firebase auth not initialized');

    const isLocalhost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // In local dev, popup flow is usually more reliable than redirect.
    if (isLocalhost) {
      try {
        await signInWithPopup(auth, googleProvider);
        return;
      } catch (error: any) {
        if (!popupFallbackCodes.has(error?.code)) {
          throw error;
        }
      }
    }

    // Redirect as fallback or for production domains.
    await signInWithRedirect(auth, googleProvider);
  },

  async signOut(): Promise<void> {
    if (!auth) return;
    await signOut(auth);
  },

  async resolveRedirectResult(): Promise<User | null> {
    if (!auth) return null;
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  },

  getCurrentUser(): User | null {
    if (!auth) return null;
    return auth.currentUser;
  },
};
