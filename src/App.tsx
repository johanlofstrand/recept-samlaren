import { useEffect, useMemo, useState } from 'react';
import { useRecipes } from './contexts/RecipeContext';
import { RecipeSwiper } from './components/RecipeSwiper';
import { RecipeForm } from './components/RecipeForm';
import type { Recipe, RecipeFormData } from './types/Recipe';
import './App.css';

type IngredientChecks = Record<string, Record<number, boolean>>;
const INGREDIENT_CHECKS_KEY = 'recept-samlaren-ingredient-checks';

function App() {
  const { recipes, addRecipe, updateRecipe, deleteRecipe, loading, usingFirebase } = useRecipes();
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [ingredientChecks, setIngredientChecks] = useState<IngredientChecks>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(INGREDIENT_CHECKS_KEY);
      if (stored) {
        setIngredientChecks(JSON.parse(stored) as IngredientChecks);
      }
    } catch (error) {
      console.warn('Failed to load ingredient checks:', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(INGREDIENT_CHECKS_KEY, JSON.stringify(ingredientChecks));
  }, [ingredientChecks]);

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
  };

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayRecipes = searchQuery ? filteredRecipes : recipes;

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

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Laddar recept...</p>
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
          {usingFirebase && <span className="firebase-badge" title="Synkas med molnet">☁️</span>}
        </div>
        <div className="header-actions">
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

      <main className="app-main">
        <RecipeSwiper
          recipes={displayRecipes}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
          onEdit={handleEditRecipe}
          onDelete={handleDeleteRecipe}
          isIngredientChecked={isIngredientChecked}
          onToggleIngredient={toggleIngredient}
        />
      </main>

      {showShoppingList && (
        <div className="shopping-overlay" onClick={() => setShowShoppingList(false)}>
          <div className="shopping-modal" onClick={(event) => event.stopPropagation()}>
            <div className="shopping-header">
              <h2>Inköpslista</h2>
              <button className="header-btn" onClick={() => setShowShoppingList(false)} title="Stäng">
                ✕
              </button>
            </div>
            {shoppingListItems.length === 0 ? (
              <p className="shopping-empty">Allt är ikryssat. Du har allt hemma.</p>
            ) : (
              <ul className="shopping-items">
                {shoppingListItems.map((item) => (
                  <li key={`${item.recipeId}-${item.ingredientIndex}`}>
                    <div>
                      <div className="shopping-ingredient">{item.ingredient}</div>
                      <div className="shopping-recipe">{item.recipeTitle}</div>
                    </div>
                    <button
                      className="shopping-check-btn"
                      onClick={() => toggleIngredient(item.recipeId, item.ingredientIndex)}
                    >
                      Har hemma
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <RecipeForm
          recipe={editingRecipe}
          onSave={handleSaveRecipe}
          onCancel={handleCloseForm}
          saving={saving}
        />
      )}
    </div>
  );
}

export default App;
