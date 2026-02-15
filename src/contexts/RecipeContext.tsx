import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Recipe, RecipeFormData } from '../types/Recipe';
import { isFirebaseConfigured } from '../config/firebase';
import { recipeService } from '../services/recipeService';
import { RateLimitError } from '../utils/rateLimiter';

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: RecipeFormData) => Promise<void>;
  updateRecipe: (id: string, recipe: RecipeFormData) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  getRecipe: (id: string) => Recipe | undefined;
  loading: boolean;
  usingFirebase: boolean;
  rateLimitError: string | null;
  clearRateLimitError: () => void;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const STORAGE_KEY = 'recept-samlaren-recipes';

export const RecipeProvider = ({ children }: { children: ReactNode }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const usingFirebase = isFirebaseConfigured();

  const clearRateLimitError = useCallback(() => setRateLimitError(null), []);

  // Load recipes on mount
  useEffect(() => {
    loadRecipes();
  }, []);

  // Save to localStorage when recipes change (fallback)
  useEffect(() => {
    if (!usingFirebase && recipes.length >= 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
    }
  }, [recipes, usingFirebase]);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      if (usingFirebase) {
        // Load from Firebase
        const firebaseRecipes = await recipeService.getAll();
        setRecipes(firebaseRecipes);
        console.log('✅ Loaded recipes from Firebase');
      } else {
        // Load from localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const localRecipes = parsed.map((recipe: Recipe) => ({
            ...recipe,
            createdAt: new Date(recipe.createdAt),
            updatedAt: new Date(recipe.updatedAt),
          }));
          setRecipes(localRecipes);
          console.log('✅ Loaded recipes from localStorage');
        }
      }
    } catch (error) {
      console.error('Failed to load recipes:', error);
      // Fallback to localStorage if Firebase fails
      if (usingFirebase) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setRecipes(
            parsed.map((recipe: Recipe) => ({
              ...recipe,
              createdAt: new Date(recipe.createdAt),
              updatedAt: new Date(recipe.updatedAt),
            }))
          );
          console.log('⚠️ Fell back to localStorage');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const addRecipe = async (recipeData: RecipeFormData) => {
    try {
      if (usingFirebase) {
        // Add to Firebase
        const newRecipe = await recipeService.add(recipeData);
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
        // Update in Firebase
        await recipeService.update(id, recipeData);
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
        // Delete from Firebase
        await recipeService.delete(id);
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

  return (
    <RecipeContext.Provider
      value={{ recipes, addRecipe, updateRecipe, deleteRecipe, getRecipe, loading, usingFirebase, rateLimitError, clearRateLimitError }}
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
