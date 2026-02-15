import { useState } from 'react';
import { useRecipes } from './contexts/RecipeContext';
import { RecipeList } from './components/RecipeList';
import { RecipeForm } from './components/RecipeForm';
import { RecipeDetail } from './components/RecipeDetail';
import { Recipe, RecipeFormData } from './types/Recipe';
import './App.css';

function App() {
  const { recipes, addRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>();
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

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
    setViewingRecipe(undefined);
  };

  const handleDeleteRecipe = (id: string) => {
    if (confirm('Är du säker på att du vill ta bort detta recept?')) {
      deleteRecipe(id);
      setViewingRecipe(undefined);
    }
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setViewingRecipe(recipe);
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

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>🍳 Receptsamlaren</h1>
            <p>Samla och organisera dina favoritrecept</p>
          </div>
          <button
            className="btn-new-recipe"
            onClick={() => {
              setEditingRecipe(undefined);
              setShowForm(true);
            }}
          >
            + Nytt recept
          </button>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Sök recept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <RecipeList
            recipes={filteredRecipes}
            onEdit={handleEditRecipe}
            onDelete={handleDeleteRecipe}
            onView={handleViewRecipe}
          />
        </div>
      </main>

      {showForm && (
        <RecipeForm recipe={editingRecipe} onSave={handleSaveRecipe} onCancel={handleCloseForm} />
      )}

      {viewingRecipe && (
        <RecipeDetail
          recipe={viewingRecipe}
          onClose={() => setViewingRecipe(undefined)}
          onEdit={() => handleEditRecipe(viewingRecipe)}
          onDelete={() => handleDeleteRecipe(viewingRecipe.id)}
        />
      )}
    </div>
  );
}

export default App;
