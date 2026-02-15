import { useMemo } from 'react';
import type { Recipe } from '../types/Recipe';
import type { FilterState } from '../types/Filters';

interface UseRecipeFiltersParams {
  recipes: Recipe[];
  filters: FilterState;
  searchQuery: string;
  ingredientChecks: Record<string, Record<number, boolean>>;
}

export function useRecipeFilters({
  recipes,
  filters,
  searchQuery,
  ingredientChecks,
}: UseRecipeFiltersParams): Recipe[] {
  return useMemo(() => {
    return recipes.filter((recipe) => {
      // 1. Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          recipe.title.toLowerCase().includes(query) ||
          recipe.description.toLowerCase().includes(query) ||
          recipe.category?.toLowerCase().includes(query) ||
          recipe.ingredients.some((ing) => ing.toLowerCase().includes(query));

        if (!matchesSearch) return false;
      }

      // 2. Category filter
      if (filters.categories.length > 0) {
        if (!recipe.category || !filters.categories.includes(recipe.category)) {
          return false;
        }
      }

      // 3. Time range filter
      if (filters.timeRange.min !== undefined || filters.timeRange.max !== undefined) {
        const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

        if (filters.timeRange.min !== undefined && totalTime < filters.timeRange.min) {
          return false;
        }

        if (
          filters.timeRange.max !== undefined &&
          filters.timeRange.max !== Infinity &&
          totalTime > filters.timeRange.max
        ) {
          return false;
        }

        // For 60+ range
        if (filters.timeRange.max === Infinity && totalTime < (filters.timeRange.min || 0)) {
          return false;
        }
      }

      // 4. "Can make with what I have" filter
      if (filters.canMakeWithWhatIHave) {
        const recipeChecks = ingredientChecks[recipe.id];
        if (!recipeChecks) return false;

        // Check if all ingredients are checked
        const allIngredientsChecked = recipe.ingredients.every((_, index) => {
          return recipeChecks[index] === true;
        });

        if (!allIngredientsChecked) return false;
      }

      // 5. Favorites filter
      if (filters.favoritesOnly) {
        if (recipe.isFavorite !== true) return false;
      }

      return true;
    });
  }, [recipes, filters, searchQuery, ingredientChecks]);
}
