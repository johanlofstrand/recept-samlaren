import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Recipe, RecipeFormData } from '../types/Recipe';
import { readLimiter, writeLimiter, deleteLimiter } from '../utils/rateLimiter';

const COLLECTION_NAME = 'recipes';

// Convert Firestore timestamp to Date
const convertTimestamps = (data: any): Recipe => {
  return {
    ...data,
    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
    updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
  };
};

export const recipeService = {
  // Get all recipes
  async getAll(userId: string): Promise<Recipe[]> {
    if (!db) throw new Error('Firebase not initialized');
    if (!userId) throw new Error('User not authenticated');

    readLimiter.check();

    const q = query(collection(db, COLLECTION_NAME), where('ownerId', '==', userId));
    const snapshot = await getDocs(q);

    readLimiter.record();

    const recipes = snapshot.docs.map((doc) => ({
      ...convertTimestamps(doc.data()),
      id: doc.id,
    })) as Recipe[];

    return recipes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  // Add new recipe
  async add(recipeData: RecipeFormData, userId: string): Promise<Recipe> {
    if (!db) throw new Error('Firebase not initialized');
    if (!userId) throw new Error('User not authenticated');

    writeLimiter.check();

    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ownerId: userId,
      ...recipeData,
      createdAt: now,
      updatedAt: now,
    });

    writeLimiter.record();

    return {
      id: docRef.id,
      ownerId: userId,
      ...recipeData,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  },

  // Update recipe
  async update(id: string, recipeData: RecipeFormData, userId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    if (!userId) throw new Error('User not authenticated');

    writeLimiter.check();

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ownerId: userId,
      ...recipeData,
      updatedAt: Timestamp.now(),
    });

    writeLimiter.record();
  },

  // Delete recipe
  async delete(id: string, userId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    if (!userId) throw new Error('User not authenticated');

    deleteLimiter.check();

    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);

    deleteLimiter.record();
  },
};
