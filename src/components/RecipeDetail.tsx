import { Recipe } from '../types/Recipe';
import './RecipeDetail.css';

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const RecipeDetail = ({ recipe, onClose, onEdit, onDelete }: RecipeDetailProps) => {
  return (
    <div className="recipe-detail-overlay" onClick={onClose}>
      <div className="recipe-detail-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          ×
        </button>

        {recipe.imageUrl && (
          <div className="recipe-detail-image">
            <img src={recipe.imageUrl} alt={recipe.title} />
          </div>
        )}

        <div className="recipe-detail-content">
          <div className="recipe-header">
            <div>
              <h1>{recipe.title}</h1>
              <p className="recipe-description">{recipe.description}</p>
            </div>
          </div>

          <div className="recipe-meta-grid">
            {recipe.prepTime && (
              <div className="meta-item">
                <span className="meta-icon">⏱️</span>
                <div>
                  <div className="meta-label">Förberedelsetid</div>
                  <div className="meta-value">{recipe.prepTime} min</div>
                </div>
              </div>
            )}
            {recipe.cookTime && (
              <div className="meta-item">
                <span className="meta-icon">🔥</span>
                <div>
                  <div className="meta-label">Tillagningstid</div>
                  <div className="meta-value">{recipe.cookTime} min</div>
                </div>
              </div>
            )}
            {recipe.servings && (
              <div className="meta-item">
                <span className="meta-icon">👥</span>
                <div>
                  <div className="meta-label">Portioner</div>
                  <div className="meta-value">{recipe.servings}</div>
                </div>
              </div>
            )}
            {recipe.category && (
              <div className="meta-item">
                <span className="meta-icon">🏷️</span>
                <div>
                  <div className="meta-label">Kategori</div>
                  <div className="meta-value">{recipe.category}</div>
                </div>
              </div>
            )}
          </div>

          <div className="recipe-section">
            <h2>Ingredienser</h2>
            <ul className="ingredients-list">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>

          <div className="recipe-section">
            <h2>Instruktioner</h2>
            <ol className="instructions-list">
              {recipe.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>

          <div className="recipe-actions">
            <button className="btn-edit" onClick={onEdit}>
              Redigera recept
            </button>
            <button className="btn-delete" onClick={onDelete}>
              Ta bort recept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
