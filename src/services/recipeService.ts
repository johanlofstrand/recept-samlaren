import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
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
  async getAll(): Promise<Recipe[]> {
    if (!db) throw new Error('Firebase not initialized');

    readLimiter.check();

    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    readLimiter.record();

    return snapshot.docs.map((doc) => ({
      ...convertTimestamps(doc.data()),
      id: doc.id,
    })) as Recipe[];
  },

  // Add new recipe
  async add(recipeData: RecipeFormData): Promise<Recipe> {
    if (!db) throw new Error('Firebase not initialized');

    writeLimiter.check();

    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...recipeData,
      createdAt: now,
      updatedAt: now,
    });

    writeLimiter.record();

    return {
      id: docRef.id,
      ...recipeData,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  },

  // Update recipe
  async update(id: string, recipeData: RecipeFormData): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');

    writeLimiter.check();

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...recipeData,
      updatedAt: Timestamp.now(),
    });

    writeLimiter.record();
  },

  // Delete recipe
  async delete(id: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');

    deleteLimiter.check();

    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);

    deleteLimiter.record();
  },
};
