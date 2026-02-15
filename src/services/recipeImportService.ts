import type { RecipeFormData } from '../types/Recipe';

type ErrorCode = 'INVALID_URL' | 'NETWORK_ERROR' | 'NO_RECIPE_FOUND' | 'PARSE_ERROR';

export class RecipeImportError extends Error {
  code: ErrorCode;
  constructor(message: string, code: ErrorCode) {
    super(message);
    this.name = 'RecipeImportError';
    this.code = code;
  }
}

interface SchemaRecipe {
  '@type': string | string[];
  name?: string;
  description?: string;
  recipeIngredient?: string[];
  recipeInstructions?: unknown;
  recipeYield?: string | string[] | number;
  prepTime?: string;
  cookTime?: string;
  recipeCategory?: string | string[];
}

function isRecipeType(type: string | string[]): boolean {
  if (Array.isArray(type)) return type.some((t) => t === 'Recipe');
  return type === 'Recipe';
}

function findRecipeInJsonLd(data: unknown): SchemaRecipe | null {
  if (!data || typeof data !== 'object') return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeInJsonLd(item);
      if (found) return found;
    }
    return null;
  }

  const obj = data as Record<string, unknown>;

  if (obj['@type'] && isRecipeType(obj['@type'] as string | string[])) {
    return obj as unknown as SchemaRecipe;
  }

  if (obj['@graph'] && Array.isArray(obj['@graph'])) {
    return findRecipeInJsonLd(obj['@graph']);
  }

  return null;
}

function parseIsoDuration(duration: string | undefined): number | undefined {
  if (!duration) return undefined;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return undefined;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const total = hours * 60 + minutes;
  return total > 0 ? total : undefined;
}

function parseServings(value: string | string[] | number | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return value;
  const str = Array.isArray(value) ? value[0] : value;
  if (!str) return undefined;
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

function parseInstructions(value: unknown): string[] {
  if (!value) return [];

  if (typeof value === 'string') {
    return value
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (Array.isArray(value)) {
    const result: string[] = [];
    for (const item of value) {
      if (typeof item === 'string') {
        result.push(item.trim());
      } else if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        // HowToStep
        if (obj.text) {
          result.push(String(obj.text).trim());
        }
        // HowToSection
        if (obj.itemListElement && Array.isArray(obj.itemListElement)) {
          for (const step of obj.itemListElement) {
            if (typeof step === 'string') {
              result.push(step.trim());
            } else if (step && typeof step === 'object' && (step as Record<string, unknown>).text) {
              result.push(String((step as Record<string, unknown>).text).trim());
            }
          }
        }
      }
    }
    return result.filter(Boolean);
  }

  return [];
}

function parseCategory(value: string | string[] | undefined): string {
  if (!value) return '';
  if (Array.isArray(value)) return value[0] || '';
  return value;
}

export async function importRecipeFromUrl(url: string): Promise<RecipeFormData & { sourceUrl: string }> {
  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new RecipeImportError('Ogiltig URL', 'INVALID_URL');
  }

  // Fetch HTML via Cloud Function
  let html: string;
  try {
    const functionUrl = `https://europe-west1-recept-samlaren-487508.cloudfunctions.net/fetchRecipePage?url=${encodeURIComponent(url)}`;
    const response = await fetch(functionUrl);
    if (!response.ok) {
      const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.status === 429) {
        throw new RecipeImportError(errorData?.error || 'Daglig gräns nådd. Försök igen imorgon.', 'NETWORK_ERROR');
      }
      throw new Error(errorData?.error || `HTTP ${response.status}`);
    }
    const data = (await response.json()) as { contents: string };
    html = data.contents;
  } catch (error) {
    if (error instanceof RecipeImportError) throw error;
    throw new RecipeImportError('Kunde inte hämta sidan. Kontrollera URL:en och försök igen.', 'NETWORK_ERROR');
  }

  // Parse HTML and find JSON-LD scripts
  let recipe: SchemaRecipe | null = null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');

    for (const script of scripts) {
      try {
        const json: unknown = JSON.parse(script.textContent || '');
        recipe = findRecipeInJsonLd(json);
        if (recipe) break;
      } catch {
        // Skip invalid JSON-LD blocks
      }
    }
  } catch {
    throw new RecipeImportError('Kunde inte tolka sidans innehåll.', 'PARSE_ERROR');
  }

  if (!recipe) {
    throw new RecipeImportError('Hittade ingen receptdata på den angivna sidan.', 'NO_RECIPE_FOUND');
  }

  // Map to RecipeFormData
  const ingredients = recipe.recipeIngredient || [];
  const instructions = parseInstructions(recipe.recipeInstructions);

  return {
    title: recipe.name || '',
    description: typeof recipe.description === 'string' ? recipe.description.trim() : '',
    ingredients: ingredients.length > 0 ? ingredients : [''],
    instructions: instructions.length > 0 ? instructions : [''],
    prepTime: parseIsoDuration(recipe.prepTime),
    cookTime: parseIsoDuration(recipe.cookTime),
    servings: parseServings(recipe.recipeYield),
    category: parseCategory(recipe.recipeCategory),
    sourceUrl: url,
  };
}
