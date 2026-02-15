import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  collection,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../config/firebase';

const SEED_ADMIN_EMAIL = 'johan.lofstrand@gmail.com';

export interface UserRecord {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

export const adminService = {
  async getOrCreateUser(user: User): Promise<{ isAdmin: boolean }> {
    if (!db) throw new Error('Firebase not configured');

    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      return { isAdmin: snap.data().isAdmin === true };
    }

    const isAdmin = user.email === SEED_ADMIN_EMAIL;
    await setDoc(userRef, {
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      isAdmin,
    });

    return { isAdmin };
  },

  async setAdmin(uid: string, isAdmin: boolean): Promise<void> {
    if (!db) throw new Error('Firebase not configured');
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { isAdmin });
  },

  async getAllUsers(): Promise<UserRecord[]> {
    if (!db) throw new Error('Firebase not configured');
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => ({
      uid: d.id,
      email: d.data().email ?? '',
      displayName: d.data().displayName ?? '',
      isAdmin: d.data().isAdmin === true,
    }));
  },
};
