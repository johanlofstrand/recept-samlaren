import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRecipes } from './contexts/RecipeContext';
import { RecipeSwiper } from './components/RecipeSwiper';
import { RecipeForm } from './components/RecipeForm';
import { FilterChips } from './components/FilterChips';
import { ShoppingList } from './components/ShoppingList';
import { Settings } from './components/Settings';
import { useRecipeFilters } from './hooks/useRecipeFilters';
import type { Recipe, RecipeFormData } from './types/Recipe';
import type { FilterState } from './types/Filters';
import type { UserSettings } from './types/Settings';
import './App.css';

type IngredientChecks = Record<string, Record<number, boolean>>;
const INGREDIENT_CHECKS_KEY = 'recept-samlaren-ingredient-checks';
const FILTERS_KEY = 'recept-samlaren-filters';
const SETTINGS_KEY = 'recept-samlaren-settings';

const DEFAULT_SETTINGS: UserSettings = {
  phoneNumber: '',
  defaultServings: 4,
};

function App() {
  const {
    recipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    toggleFavorite,
    loading,
    authLoading,
    usingFirebase,
    user,
    signInWithGoogle,
    signOut,
    syncStatus,
    isAdmin,
  } = useRecipes();
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [ingredientChecks, setIngredientChecks] = useState<IngredientChecks>({});
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    timeRange: {},
    canMakeWithWhatIHave: false,
    favoritesOnly: false,
  });
  const [importedRecipeData, setImportedRecipeData] = useState<RecipeFormData | undefined>();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in failed:', error);
      alert('Kunde inte logga in med Google just nu. Försök igen.');
    }
  };

  const ingredientChecksKey = `${INGREDIENT_CHECKS_KEY}-${user?.uid || 'guest'}`;
  const filtersKey = `${FILTERS_KEY}-${user?.uid || 'guest'}`;
  const settingsKey = `${SETTINGS_KEY}-${user?.uid || 'guest'}`;

  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ingredientChecksKey);
      if (stored) {
        setIngredientChecks(JSON.parse(stored) as IngredientChecks);
      } else {
        setIngredientChecks({});
      }
    } catch (error) {
      console.warn('Failed to load ingredient checks:', error);
    }
  }, [ingredientChecksKey]);

  useEffect(() => {
    localStorage.setItem(ingredientChecksKey, JSON.stringify(ingredientChecks));
  }, [ingredientChecks, ingredientChecksKey]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(filtersKey);
      if (stored) {
        const loadedFilters = JSON.parse(stored) as FilterState;
        setFilters(loadedFilters);
        setShowFavoritesOnly(loadedFilters.favoritesOnly);
      }
    } catch (error) {
      console.warn('Failed to load filters:', error);
    }
  }, [filtersKey]);

  useEffect(() => {
    localStorage.setItem(filtersKey, JSON.stringify(filters));
  }, [filters, filtersKey]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(settingsKey);
      if (stored) {
        setUserSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(stored) as UserSettings) });
      } else {
        setUserSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
  }, [settingsKey]);

  const handleSettingsChange = useCallback(
    (newSettings: UserSettings) => {
      setUserSettings(newSettings);
      localStorage.setItem(settingsKey, JSON.stringify(newSettings));
    },
    [settingsKey]
  );

  const handleImportRecipe = useCallback((recipeData: RecipeFormData) => {
    setShowSettings(false);
    setImportedRecipeData(recipeData);
    setEditingRecipe(undefined);
    setShowForm(true);
  }, []);

  const isIngredientChecked = (recipeId: string, ingredientIndex: number) =>
    !!ingredientChecks[recipeId]?.[ingredientIndex];

  const toggleIngredient = (recipeId: string, ingredientIndex: number) => {
    setIngredientChecks((prev) => ({
      ...prev,
      [recipeId]: {
        ...(prev[recipeId] || {}),
        [ingredientIndex]: !prev[recipeId]?.[ingredientIndex],
      },
    }));
  };

  const handleSaveRecipe = async (recipeData: RecipeFormData) => {
    setSaving(true);
    try {
      if (editingRecipe) {
        await updateRecipe(editingRecipe.id, recipeData);
      } else {
        await addRecipe(recipeData);
      }
      setShowForm(false);
      setEditingRecipe(undefined);
      setImportedRecipeData(undefined);
    } catch (error) {
      alert('Kunde inte spara recept. Försök igen.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const handleDeleteRecipe = async (id: string) => {
    if (confirm('Är du säker på att du vill ta bort detta recept?')) {
      try {
        await deleteRecipe(id);
        if (currentIndex >= recipes.length - 1 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      } catch (error) {
        alert('Kunde inte ta bort recept. Försök igen.');
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecipe(undefined);
    setImportedRecipeData(undefined);
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavorite(id);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleClearChecked = () => {
    const newChecks: IngredientChecks = {};
    Object.keys(ingredientChecks).forEach((recipeId) => {
      const recipeChecks = ingredientChecks[recipeId];
      const uncheckedItems: Record<number, boolean> = {};
      Object.keys(recipeChecks).forEach((indexStr) => {
        const index = parseInt(indexStr, 10);
        if (!recipeChecks[index]) {
          uncheckedItems[index] = false;
        }
      });
      if (Object.keys(uncheckedItems).length > 0) {
        newChecks[recipeId] = uncheckedItems;
      }
    });
    setIngredientChecks(newChecks);
  };

  // Sync favorites filter with button state
  const effectiveFilters = {
    ...filters,
    favoritesOnly: showFavoritesOnly,
  };

  // Use filter hook
  const displayRecipes = useRecipeFilters({
    recipes,
    filters: effectiveFilters,
    searchQuery,
    ingredientChecks,
  });

  // Reset index when filtered list changes so we don't point beyond the end
  useEffect(() => {
    if (currentIndex >= displayRecipes.length && displayRecipes.length > 0) {
      setCurrentIndex(0);
    }
  }, [displayRecipes.length, currentIndex]);

  const shoppingListItems = useMemo(
    () =>
      recipes.flatMap((recipe) =>
        recipe.ingredients
          .map((ingredient, ingredientIndex) => ({
            recipeId: recipe.id,
            recipeTitle: recipe.title,
            ingredientIndex,
            ingredient,
          }))
          .filter(
            (item) =>
              item.ingredient.trim() !== '' && !isIngredientChecked(recipe.id, item.ingredientIndex)
          )
      ),
    [recipes, ingredientChecks]
  );

  const shoppingListText = useMemo(() => {
    if (shoppingListItems.length === 0) return '';
    const groups = new Map<string, string[]>();
    shoppingListItems.forEach((item) => {
      if (!groups.has(item.recipeTitle)) groups.set(item.recipeTitle, []);
      groups.get(item.recipeTitle)!.push(item.ingredient);
    });
    let text = 'Inköpslista\n\n';
    groups.forEach((ingredients, title) => {
      text += `${title}\n`;
      ingredients.forEach((ing) => { text += `• ${ing}\n`; });
      text += '\n';
    });
    return text;
  }, [shoppingListItems]);

  if (loading || (usingFirebase && authLoading)) {
    return (
      <div className="app loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{usingFirebase ? 'Verifierar konto...' : 'Laddar recept...'}</p>
        </div>
      </div>
    );
  }

  if (usingFirebase && !user) {
    return (
      <div className="app auth-screen">
        <div className="auth-card">
          <h1>Receptsamlaren</h1>
          <p>Logga in med Google för att se och spara dina recept i molnet.</p>
          <button className="auth-google-btn" onClick={() => void handleGoogleSignIn()}>
            Fortsätt med Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <button className="header-btn" onClick={() => setShowSearch(!showSearch)} title="Sök">
          🔍
        </button>
        <div className="header-center">
          <h1 className="app-title">Receptsamlaren</h1>
          {usingFirebase && syncStatus === 'error' && (
            <span className="sync-error-badge" title="Synkfel – försöker igen">⚠️</span>
          )}
        </div>
        <div className="header-actions">
          <button
            className="header-btn"
            onClick={() => setShowSettings(true)}
            title="Inställningar"
          >
            ⚙️
          </button>
          <button
            className={`header-btn ${showFavoritesOnly ? 'active' : ''}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            title={showFavoritesOnly ? "Visa alla recept" : "Visa favoriter"}
          >
            {showFavoritesOnly ? '⭐' : '☆'}
          </button>
          <button className="header-btn" onClick={() => setShowShoppingList(true)} title="Inköpslista">
            🛒
          </button>
          <button
            className="header-btn add-btn"
            onClick={() => {
              setEditingRecipe(undefined);
              setShowForm(true);
            }}
            title="Nytt recept"
          >
            +
          </button>
        </div>
      </header>

      {showSearch && (
        <div className="search-panel">
          <input
            type="text"
            placeholder="Sök recept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
      )}

      <FilterChips
        recipes={recipes}
        filters={filters}
        onFilterChange={setFilters}
      />

      <main className="app-main">
        <RecipeSwiper
          recipes={displayRecipes}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
          onEdit={handleEditRecipe}
          onDelete={handleDeleteRecipe}
          onToggleFavorite={handleToggleFavorite}
          isIngredientChecked={isIngredientChecked}
          onToggleIngredient={toggleIngredient}
        />
      </main>

      {showShoppingList && (
        <ShoppingList
          items={shoppingListItems}
          onToggle={toggleIngredient}
          onClearChecked={handleClearChecked}
          onClose={() => setShowShoppingList(false)}
          ingredientChecks={ingredientChecks}
        />
      )}

      {showSettings && (
        <Settings
          settings={userSettings}
          onSettingsChange={handleSettingsChange}
          user={user}
          onSignOut={signOut}
          onClose={() => setShowSettings(false)}
          shoppingListText={shoppingListText}
          onImportRecipe={handleImportRecipe}
          isAdmin={isAdmin}
        />
      )}

      {showForm && (
        <RecipeForm
          recipe={editingRecipe}
          onSave={handleSaveRecipe}
          onCancel={handleCloseForm}
          saving={saving}
          initialData={importedRecipeData}
        />
      )}
    </div>
  );
}

export default App;
