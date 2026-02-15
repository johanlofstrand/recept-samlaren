import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import type { Recipe, RecipeFormData } from '../types/Recipe';
import { isFirebaseConfigured } from '../config/firebase';
import { authService } from '../services/authService';
import { recipeService } from '../services/recipeService';
import { adminService } from '../services/adminService';
import { RateLimitError } from '../utils/rateLimiter';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { offlineQueueService } from '../services/offlineQueueService';

export type SyncStatus = 'online' | 'syncing' | 'offline' | 'error';

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: RecipeFormData) => Promise<void>;
  updateRecipe: (id: string, recipe: RecipeFormData) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  getRecipe: (id: string) => Recipe | undefined;
  loading: boolean;
  authLoading: boolean;
  usingFirebase: boolean;
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  rateLimitError: string | null;
  clearRateLimitError: () => void;
  syncStatus: SyncStatus;
  isAdmin: boolean;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const STORAGE_KEY = 'recept-samlaren-recipes';

export const RecipeProvider = ({ children }: { children: ReactNode }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('online');
  const [isAdmin, setIsAdmin] = useState(false);
  const usingFirebase = isFirebaseConfigured();
  const { isOnline, wasOffline } = useNetworkStatus();

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
      isFavorite: recipe.isFavorite ?? false,
      createdAt: new Date(recipe.createdAt),
      updatedAt: new Date(recipe.updatedAt),
    }));
    setRecipes(localRecipes);
    console.log('✅ Loaded recipes from localStorage');
  }, []);

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
      if (nextUser) {
        adminService.getOrCreateUser(nextUser).then(
          ({ isAdmin: admin }) => setIsAdmin(admin),
          (err) => console.error('Failed to check admin status:', err)
        );
      } else {
        setIsAdmin(false);
      }
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

  // Update sync status based on network state
  useEffect(() => {
    if (!usingFirebase) {
      setSyncStatus('online');
      return;
    }

    if (!isOnline) {
      setSyncStatus('offline');
    } else if (offlineQueueService.count(user?.uid) > 0) {
      setSyncStatus('syncing');
    } else {
      setSyncStatus('online');
    }
  }, [isOnline, usingFirebase, user?.uid]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!usingFirebase || !wasOffline || !user) return;

    const syncQueue = async () => {
      const queueCount = offlineQueueService.count(user.uid);
      if (queueCount === 0) return;

      console.log(`🔄 Syncing ${queueCount} offline operations...`);
      setSyncStatus('syncing');

      try {
        await offlineQueueService.processQueue(user.uid, {
          addRecipe: async (recipe, userId) => {
            const result = await recipeService.add(recipe, userId!);
            return result.id;
          },
          updateRecipe: (id, recipe, userId) => recipeService.update(id, recipe as RecipeFormData, userId!),
          deleteRecipe: (id, userId) => recipeService.delete(id, userId!),
          updateFavorite: (id, isFavorite, userId) => recipeService.updateFavorite(id, isFavorite, userId!),
        });

        // Reload recipes after sync
        await loadRecipes();
        setSyncStatus('online');
        console.log('✅ Offline operations synced successfully');
      } catch (error) {
        console.error('Failed to sync offline operations:', error);
        setSyncStatus('error');
      }
    };

    syncQueue();
  }, [wasOffline, usingFirebase, user, loadRecipes]);

  // Save to localStorage when recipes change (fallback)
  useEffect(() => {
    if (!usingFirebase && recipes.length >= 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
    }
  }, [recipes, usingFirebase]);

  // Reload recipes when auth state changes
  useEffect(() => {
    if (authLoading) return;
    loadRecipes();
  }, [authLoading, loadRecipes]);

  const addRecipe = async (recipeData: RecipeFormData) => {
    try {
      if (usingFirebase) {
        if (!user) throw new Error('Du måste vara inloggad för att spara recept');

        // Create optimistic recipe
        const optimisticRecipe: Recipe = {
          ...recipeData,
          id: crypto.randomUUID(),
          ownerId: user.uid,
          isFavorite: recipeData.isFavorite ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Optimistic update
        setRecipes((prev) => [optimisticRecipe, ...prev]);

        try {
          // Add to Firebase
          const newRecipe = await recipeService.add(recipeData, user.uid);
          // Replace optimistic with real recipe
          setRecipes((prev) => prev.map(r => r.id === optimisticRecipe.id ? newRecipe : r));
        } catch (error) {
          if (!isOnline) {
            // Queue for later if offline
            offlineQueueService.enqueue('add', recipeData, undefined, user.uid);
            console.log('📥 Recipe queued for sync when online');
            setSyncStatus('offline');
          } else {
            // Remove optimistic update on error
            setRecipes((prev) => prev.filter(r => r.id !== optimisticRecipe.id));
            throw error;
          }
        }
      } else {
        // Add to localStorage
        const newRecipe: Recipe = {
          ...recipeData,
          id: crypto.randomUUID(),
          isFavorite: recipeData.isFavorite ?? false,
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

        // Optimistic update
        const oldRecipe = recipes.find(r => r.id === id);
        setRecipes((prev) =>
          prev.map((recipe) =>
            recipe.id === id
              ? { ...recipeData, id, createdAt: recipe.createdAt, updatedAt: new Date() }
              : recipe
          )
        );

        try {
          // Update in Firebase
          await recipeService.update(id, recipeData, user.uid);
        } catch (error) {
          if (!isOnline) {
            // Queue for later if offline
            offlineQueueService.enqueue('update', recipeData, id, user.uid);
            console.log('📥 Recipe update queued for sync when online');
            setSyncStatus('offline');
          } else {
            // Revert optimistic update on error
            if (oldRecipe) {
              setRecipes((prev) => prev.map(r => r.id === id ? oldRecipe : r));
            }
            throw error;
          }
        }
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

        // Optimistic delete
        const oldRecipe = recipes.find(r => r.id === id);
        setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));

        try {
          // Delete from Firebase
          await recipeService.delete(id, user.uid);
        } catch (error) {
          if (!isOnline) {
            // Queue for later if offline
            offlineQueueService.enqueue('delete', {}, id, user.uid);
            console.log('📥 Recipe deletion queued for sync when online');
            setSyncStatus('offline');
          } else {
            // Revert optimistic delete on error
            if (oldRecipe) {
              setRecipes((prev) => [...prev, oldRecipe]);
            }
            throw error;
          }
        }
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

  const toggleFavorite = async (id: string) => {
    try {
      const recipe = recipes.find(r => r.id === id);
      if (!recipe) return;

      const newFavoriteStatus = !recipe.isFavorite;

      // Optimistic update
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, isFavorite: newFavoriteStatus, updatedAt: new Date() } : r
        )
      );

      if (usingFirebase) {
        if (!user) throw new Error('Du måste vara inloggad för att ändra favoriter');

        try {
          await recipeService.updateFavorite(id, newFavoriteStatus, user.uid);
        } catch (error) {
          if (!isOnline) {
            // Queue for later if offline
            offlineQueueService.enqueue('toggleFavorite', { isFavorite: newFavoriteStatus }, id, user.uid);
            console.log('📥 Favorite toggle queued for sync when online');
            setSyncStatus('offline');
          } else {
            // Revert optimistic update on error
            setRecipes((prev) =>
              prev.map((r) => (r.id === id ? { ...r, isFavorite: recipe.isFavorite } : r))
            );
            throw error;
          }
        }
      }
    } catch (error) {
      if (error instanceof RateLimitError) {
        setRateLimitError(error.message);
      }
      console.error('Failed to toggle favorite:', error);
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
        toggleFavorite,
        getRecipe,
        loading,
        authLoading,
        usingFirebase,
        user,
        signInWithGoogle,
        signOut,
        rateLimitError,
        clearRateLimitError,
        syncStatus,
        isAdmin,
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
