import { Recipe } from '../types/Recipe';
import './RecipeCard.css';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onView: (recipe: Recipe) => void;
}

export const RecipeCard = ({ recipe, onEdit, onDelete, onView }: RecipeCardProps) => {
  return (
    <div className="recipe-card" onClick={() => onView(recipe)}>
      {recipe.imageUrl && (
        <div className="recipe-card-image">
          <img src={recipe.imageUrl} alt={recipe.title} />
        </div>
      )}
      <div className="recipe-card-content">
        <h3>{recipe.title}</h3>
        <p className="recipe-description">{recipe.description}</p>
        <div className="recipe-meta">
          {recipe.prepTime && <span>⏱️ {recipe.prepTime} min</span>}
          {recipe.servings && <span>👥 {recipe.servings} portioner</span>}
          {recipe.category && <span className="category-tag">{recipe.category}</span>}
        </div>
        <div className="recipe-card-actions" onClick={(e) => e.stopPropagation()}>
          <button className="btn-edit" onClick={() => onEdit(recipe)}>
            Redigera
          </button>
          <button className="btn-delete" onClick={() => onDelete(recipe.id)}>
            Ta bort
          </button>
        </div>
      </div>
    </div>
  );
};
