export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RecipeFormData = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;
