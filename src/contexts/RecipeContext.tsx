import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import type { Recipe, RecipeFormData } from '../types/Recipe';
import { isFirebaseConfigured } from '../config/firebase';
import { authService } from '../services/authService';
import { recipeService } from '../services/recipeService';
import { RateLimitError } from '../utils/rateLimiter';

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: RecipeFormData) => Promise<void>;
  updateRecipe: (id: string, recipe: RecipeFormData) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  getRecipe: (id: string) => Recipe | undefined;
  loading: boolean;
  authLoading: boolean;
  usingFirebase: boolean;
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  rateLimitError: string | null;
  clearRateLimitError: () => void;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const STORAGE_KEY = 'recept-samlaren-recipes';

export const RecipeProvider = ({ children }: { children: ReactNode }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const usingFirebase = isFirebaseConfigured();

  const clearRateLimitError = useCallback(() => setRateLimitError(null), []);

  const loadLocalRecipes = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setRecipes([]);
      return;
    }

    const parsed = JSON.parse(stored);
    const localRecipes = parsed.map((recipe: Recipe) => ({
      ...recipe,
      createdAt: new Date(recipe.createdAt),
      updatedAt: new Date(recipe.updatedAt),
    }));
    setRecipes(localRecipes);
    console.log('✅ Loaded recipes from localStorage');
  }, []);

  // Subscribe to auth state when using Firebase
  useEffect(() => {
    if (!usingFirebase) {
      setAuthLoading(false);
      return;
    }

    authService.resolveRedirectResult().catch((error) => {
      console.error('Redirect sign-in result error:', error);
    });

    let settled = false;
    const unsubscribe = authService.onUserChanged((nextUser) => {
      settled = true;
      setUser(nextUser);
      setAuthLoading(false);
    });

    // Safety fallback: some browsers/extensions can delay auth listener indefinitely.
    const fallbackTimer = window.setTimeout(() => {
      if (!settled) {
        setUser(authService.getCurrentUser());
        setAuthLoading(false);
        console.warn('Auth state listener timeout fallback used');
      }
    }, 3000);

    return () => {
      window.clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, [usingFirebase]);

  // Save to localStorage when recipes change (fallback)
  useEffect(() => {
    if (!usingFirebase && recipes.length >= 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
    }
  }, [recipes, usingFirebase]);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    try {
      if (usingFirebase) {
        if (!user) {
          setRecipes([]);
          return;
        }
        // Load from Firebase
        const firebaseRecipes = await recipeService.getAll(user.uid);
        setRecipes(firebaseRecipes);
        console.log('✅ Loaded recipes from Firebase');
      } else {
        // Load from localStorage
        loadLocalRecipes();
      }
    } catch (error) {
      console.error('Failed to load recipes:', error);
      // Fallback to localStorage if Firebase fails
      if (usingFirebase) {
        loadLocalRecipes();
        console.log('⚠️ Fell back to localStorage');
      }
    } finally {
      setLoading(false);
    }
  }, [loadLocalRecipes, user, usingFirebase]);

  // Reload recipes when auth state changes
  useEffect(() => {
    if (authLoading) return;
    loadRecipes();
  }, [authLoading, loadRecipes]);

  const addRecipe = async (recipeData: RecipeFormData) => {
    try {
      if (usingFirebase) {
        if (!user) throw new Error('Du måste vara inloggad för att spara recept');
        // Add to Firebase
        const newRecipe = await recipeService.add(recipeData, user.uid);
        setRecipes((prev) => [newRecipe, ...prev]);
      } else {
        // Add to localStorage
        const newRecipe: Recipe = {
          ...recipeData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setRecipes((prev) => [newRecipe, ...prev]);
      }
    } catch (error) {
      if (error instanceof RateLimitError) {
        setRateLimitError(error.message);
      }
      console.error('Failed to add recipe:', error);
      throw error;
    }
  };

  const updateRecipe = async (id: string, recipeData: RecipeFormData) => {
    try {
      if (usingFirebase) {
        if (!user) throw new Error('Du måste vara inloggad för att uppdatera recept');
        // Update in Firebase
        await recipeService.update(id, recipeData, user.uid);
        setRecipes((prev) =>
          prev.map((recipe) =>
            recipe.id === id
              ? { ...recipeData, id, createdAt: recipe.createdAt, updatedAt: new Date() }
              : recipe
          )
        );
      } else {
        // Update in localStorage
        setRecipes((prev) =>
          prev.map((recipe) =>
            recipe.id === id
              ? { ...recipeData, id, createdAt: recipe.createdAt, updatedAt: new Date() }
              : recipe
          )
        );
      }
    } catch (error) {
      if (error instanceof RateLimitError) {
        setRateLimitError(error.message);
      }
      console.error('Failed to update recipe:', error);
      throw error;
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      if (usingFirebase) {
        if (!user) throw new Error('Du måste vara inloggad för att ta bort recept');
        // Delete from Firebase
        await recipeService.delete(id, user.uid);
        setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
      } else {
        // Delete from localStorage
        setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
      }
    } catch (error) {
      if (error instanceof RateLimitError) {
        setRateLimitError(error.message);
      }
      console.error('Failed to delete recipe:', error);
      throw error;
    }
  };

  const getRecipe = (id: string) => {
    return recipes.find((recipe) => recipe.id === id);
  };

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  const signOut = async () => {
    await authService.signOut();
  };

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        getRecipe,
        loading,
        authLoading,
        usingFirebase,
        user,
        signInWithGoogle,
        signOut,
        rateLimitError,
        clearRateLimitError,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};
