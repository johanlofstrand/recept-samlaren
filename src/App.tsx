import { useState } from 'react';
import { useRecipes } from './contexts/RecipeContext';
import { RecipeSwiper } from './components/RecipeSwiper';
import { RecipeForm } from './components/RecipeForm';
import type { Recipe, RecipeFormData } from './types/Recipe';
import './App.css';

function App() {
  const { recipes, addRecipe, updateRecipe, deleteRecipe, loading, usingFirebase } = useRecipes();
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [saving, setSaving] = useState(false);

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
        />
      </main>

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
