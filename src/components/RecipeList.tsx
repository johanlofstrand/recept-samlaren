import { Recipe } from '../types/Recipe';
import { RecipeCard } from './RecipeCard';
import './RecipeList.css';

interface RecipeListProps {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onView: (recipe: Recipe) => void;
}

export const RecipeList = ({ recipes, onEdit, onDelete, onView }: RecipeListProps) => {
  if (recipes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🍳</div>
        <h2>Inga recept än</h2>
        <p>Klicka på "Nytt recept" för att lägga till ditt första recept!</p>
      </div>
    );
  }

  return (
    <div className="recipe-list">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} onEdit={onEdit} onDelete={onDelete} onView={onView} />
      ))}
    </div>
  );
};
