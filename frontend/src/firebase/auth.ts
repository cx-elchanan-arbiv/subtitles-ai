import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth, googleProvider, appleProvider } from './config';

export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by browser. Please allow popups for this site.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('Domain not authorized for OAuth operations.');
    } else {
      throw new Error(`Google sign-in failed: ${error.message}`);
    }
  }
};

export const signInWithApple = async (): Promise<UserCredential> => {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    return result;
  } catch (error: any) {
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by browser. Please allow popups for this site.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('Domain not authorized for OAuth operations.');
    } else {
      throw new Error(`Apple sign-in failed: ${error.message}`);
    }
  }
};

export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth };
export type { User };