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
import type { Recipe } from '../types/Recipe';
import type { UserRole } from '../types/Role';

const SEED_ADMIN_EMAIL = 'johan.lofstrand@gmail.com';

export interface UserRecord {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface UserStats {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  recipeCount: number;
  favoriteCount: number;
  categories: Record<string, number>;
  lastRecipeDate: Date | null;
  firstRecipeDate: Date | null;
}

export const adminService = {
  async getOrCreateUser(user: User): Promise<{ role: UserRole }> {
    if (!db) throw new Error('Firebase not configured');

    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data.role) {
        return { role: data.role as UserRole };
      }
      // Lazy migration: old doc has isAdmin but no role
      const role: UserRole = data.isAdmin ? 'admin' : 'viewer';
      await updateDoc(userRef, { role });
      return { role };
    }

    const role: UserRole = user.email === SEED_ADMIN_EMAIL ? 'admin' : 'viewer';
    await setDoc(userRef, {
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      role,
    });

    return { role };
  },

  async setUserRole(uid: string, role: UserRole): Promise<void> {
    if (!db) throw new Error('Firebase not configured');
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role });
  },

  async getAllUsers(): Promise<UserRecord[]> {
    if (!db) throw new Error('Firebase not configured');
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        email: data.email ?? '',
        displayName: data.displayName ?? '',
        role: (data.role as UserRole) || (data.isAdmin ? 'admin' : 'viewer'),
      };
    });
  },

  async getUserStats(): Promise<UserStats[]> {
    if (!db) throw new Error('Firebase not configured');

    const [usersSnap, recipesSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'recipes')),
    ]);

    const recipes: (Recipe & { ownerId: string })[] = recipesSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ownerId: data.ownerId ?? '',
        title: data.title ?? '',
        description: data.description ?? '',
        ingredients: data.ingredients ?? [],
        instructions: data.instructions ?? [],
        imageUrl: data.imageUrl,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        servings: data.servings,
        category: data.category,
        sourceUrl: data.sourceUrl,
        isFavorite: data.isFavorite ?? false,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
      };
    });

    const recipesByOwner = new Map<string, typeof recipes>();
    recipes.forEach((r) => {
      if (!recipesByOwner.has(r.ownerId)) recipesByOwner.set(r.ownerId, []);
      recipesByOwner.get(r.ownerId)!.push(r);
    });

    return usersSnap.docs.map((d) => {
      const data = d.data();
      const uid = d.id;
      const userRecipes = recipesByOwner.get(uid) || [];

      const categories: Record<string, number> = {};
      let favoriteCount = 0;
      let lastRecipeDate: Date | null = null;
      let firstRecipeDate: Date | null = null;

      userRecipes.forEach((r) => {
        const cat = r.category || 'Okategoriserad';
        categories[cat] = (categories[cat] || 0) + 1;
        if (r.isFavorite) favoriteCount++;
        if (!lastRecipeDate || r.createdAt > lastRecipeDate) lastRecipeDate = r.createdAt;
        if (!firstRecipeDate || r.createdAt < firstRecipeDate) firstRecipeDate = r.createdAt;
      });

      return {
        uid,
        email: data.email ?? '',
        displayName: data.displayName ?? '',
        role: (data.role as UserRole) || (data.isAdmin ? 'admin' : 'viewer'),
        recipeCount: userRecipes.length,
        favoriteCount,
        categories,
        lastRecipeDate,
        firstRecipeDate,
      };
    });
  },
};
