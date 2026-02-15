import { useState, useEffect } from 'react';
import type { Recipe } from '../types/Recipe';
import './RecipeSwiper.css';

interface RecipeSwiperProps {
  recipes: Recipe[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
}

export const RecipeSwiper = ({ recipes, currentIndex, onIndexChange, onEdit, onDelete }: RecipeSwiperProps) => {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);

  const currentRecipe = recipes[currentIndex];
  const currentCategory = currentRecipe?.category;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateUp();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateDown();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateLeft();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, recipes]);

  const navigateUp = () => {
    if (currentIndex > 0) {
      setDirection('up');
      setTimeout(() => {
        onIndexChange(currentIndex - 1);
        setDirection(null);
      }, 300);
    }
  };

  const navigateDown = () => {
    if (currentIndex < recipes.length - 1) {
      setDirection('down');
      setTimeout(() => {
        onIndexChange(currentIndex + 1);
        setDirection(null);
      }, 300);
    }
  };

  const navigateLeft = () => {
    const categoryRecipes = recipes.filter(r => r.category === currentCategory);
    if (categoryRecipes.length > 1) {
      const currentInCategory = categoryRecipes.findIndex(r => r.id === currentRecipe.id);
      const prevInCategory = currentInCategory > 0 ? currentInCategory - 1 : categoryRecipes.length - 1;
      const targetRecipe = categoryRecipes[prevInCategory];
      const targetIndex = recipes.findIndex(r => r.id === targetRecipe.id);

      setDirection('left');
      setTimeout(() => {
        onIndexChange(targetIndex);
        setDirection(null);
      }, 300);
    }
  };

  const navigateRight = () => {
    const categoryRecipes = recipes.filter(r => r.category === currentCategory);
    if (categoryRecipes.length > 1) {
      const currentInCategory = categoryRecipes.findIndex(r => r.id === currentRecipe.id);
      const nextInCategory = currentInCategory < categoryRecipes.length - 1 ? currentInCategory + 1 : 0;
      const targetRecipe = categoryRecipes[nextInCategory];
      const targetIndex = recipes.findIndex(r => r.id === targetRecipe.id);

      setDirection('right');
      setTimeout(() => {
        onIndexChange(targetIndex);
        setDirection(null);
      }, 300);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      navigateDown();
    }

    if (touchStart - touchEnd < -50) {
      navigateUp();
    }
  };

  if (!currentRecipe) {
    return (
      <div className="recipe-swiper empty">
        <div className="empty-state">
          <div className="empty-icon">🍳</div>
          <h2>Inga recept än</h2>
          <p>Lägg till ditt första recept!</p>
        </div>
      </div>
    );
  }

  const categoryRecipes = recipes.filter(r => r.category === currentCategory);
  const hasCategoryNavigation = currentCategory && categoryRecipes.length > 1;

  return (
    <div
      className={`recipe-swiper ${direction || ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="recipe-content">
        {currentRecipe.imageUrl && (
          <div className="recipe-image">
            <img src={currentRecipe.imageUrl} alt={currentRecipe.title} />
            <div className="image-overlay" />
          </div>
        )}

        <div className="recipe-header">
          <div className="header-top">
            {currentRecipe.category && (
              <span className="category-badge">{currentRecipe.category}</span>
            )}
            <div className="recipe-actions">
              <button className="action-btn edit" onClick={() => onEdit(currentRecipe)} title="Redigera">
                ✏️
              </button>
              <button className="action-btn delete" onClick={() => onDelete(currentRecipe.id)} title="Ta bort">
                🗑️
              </button>
            </div>
          </div>
          <h1>{currentRecipe.title}</h1>
          <p className="description">{currentRecipe.description}</p>

          {(currentRecipe.prepTime || currentRecipe.cookTime || currentRecipe.servings) && (
            <div className="meta-info">
              {currentRecipe.prepTime && (
                <div className="meta-item">
                  <span className="icon">⏱️</span>
                  <span>{currentRecipe.prepTime} min</span>
                </div>
              )}
              {currentRecipe.cookTime && (
                <div className="meta-item">
                  <span className="icon">🔥</span>
                  <span>{currentRecipe.cookTime} min</span>
                </div>
              )}
              {currentRecipe.servings && (
                <div className="meta-item">
                  <span className="icon">👥</span>
                  <span>{currentRecipe.servings} port.</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="recipe-details">
          <div className="section">
            <h2>Ingredienser</h2>
            <ul className="ingredients">
              {currentRecipe.ingredients.map((ingredient, i) => (
                <li key={i}>
                  <span className="check">✓</span>
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          <div className="section">
            <h2>Instruktioner</h2>
            <ol className="instructions">
              {currentRecipe.instructions.map((instruction, i) => (
                <li key={i}>
                  <span className="step-number">{i + 1}</span>
                  <span className="step-text">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="navigation-hints">
        {currentIndex > 0 && (
          <div className="hint hint-up" onClick={navigateUp}>
            <span className="arrow">↑</span>
            <span className="hint-text">Föregående</span>
          </div>
        )}
        {currentIndex < recipes.length - 1 && (
          <div className="hint hint-down" onClick={navigateDown}>
            <span className="hint-text">Nästa</span>
            <span className="arrow">↓</span>
          </div>
        )}
        {hasCategoryNavigation && (
          <>
            <div className="hint hint-left" onClick={navigateLeft}>
              <span className="arrow">←</span>
              <span className="hint-text">Föregående i {currentCategory}</span>
            </div>
            <div className="hint hint-right" onClick={navigateRight}>
              <span className="hint-text">Nästa i {currentCategory}</span>
              <span className="arrow">→</span>
            </div>
          </>
        )}
      </div>

      <div className="progress-indicator">
        <span>{currentIndex + 1}</span>
        <span className="separator">/</span>
        <span>{recipes.length}</span>
      </div>
    </div>
  );
};
