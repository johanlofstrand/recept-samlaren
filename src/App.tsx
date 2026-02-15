import { useState } from 'react';
import { useRecipes } from './contexts/RecipeContext';
import { RecipeSwiper } from './components/RecipeSwiper';
import { RecipeForm } from './components/RecipeForm';
import type { Recipe, RecipeFormData } from './types/Recipe';
import './App.css';

function App() {
  const { recipes, addRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleSaveRecipe = (recipeData: RecipeFormData) => {
    if (editingRecipe) {
      updateRecipe(editingRecipe.id, recipeData);
    } else {
      addRecipe(recipeData);
    }
    setShowForm(false);
    setEditingRecipe(undefined);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const handleDeleteRecipe = (id: string) => {
    if (confirm('Är du säker på att du vill ta bort detta recept?')) {
      deleteRecipe(id);
      if (currentIndex >= recipes.length - 1 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
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

  return (
    <div className="app">
      <header className="app-header">
        <button className="header-btn" onClick={() => setShowSearch(!showSearch)} title="Sök">
          🔍
        </button>
        <h1 className="app-title">Receptsamlaren</h1>
        <button className="header-btn add-btn" onClick={() => {
          setEditingRecipe(undefined);
          setShowForm(true);
        }} title="Nytt recept">
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
        <RecipeForm recipe={editingRecipe} onSave={handleSaveRecipe} onCancel={handleCloseForm} />
      )}
    </div>
  );
}

export default App;
