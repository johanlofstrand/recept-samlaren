import { useState, useEffect } from 'react';
import type { Recipe, RecipeFormData } from '../types/Recipe';
import { RichTextInstructionEditor } from './RichTextInstructionEditor';
import './RecipeForm.css';

interface RecipeFormProps {
  recipe?: Recipe;
  onSave: (recipe: RecipeFormData) => void;
  onCancel: () => void;
  saving?: boolean;
  initialData?: RecipeFormData;
  existingCategories?: string[];
}

export const RecipeForm = ({ recipe, onSave, onCancel, saving = false, initialData, existingCategories = [] }: RecipeFormProps) => {
  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    description: '',
    ingredients: [''],
    instructions: [''],
    imageUrl: '',
    prepTime: undefined,
    cookTime: undefined,
    servings: undefined,
    category: '',
    sourceUrl: undefined,
  });

  useEffect(() => {
    const source = recipe || initialData;
    if (source) {
      setFormData({
        title: source.title,
        description: source.description,
        ingredients: source.ingredients.length > 0 ? source.ingredients : [''],
        instructions: source.instructions.length > 0 ? source.instructions : [''],
        imageUrl: source.imageUrl,
        prepTime: source.prepTime,
        cookTime: source.cookTime,
        servings: source.servings,
        category: source.category,
        sourceUrl: source.sourceUrl,
      });
    }
  }, [recipe, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasVisibleText = (value: string) =>
      value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() !== '';

    const cleanedData = {
      ...formData,
      ingredients: formData.ingredients.filter((i) => i.trim() !== ''),
      instructions: formData.instructions.filter((i) => hasVisibleText(i)),
    };

    if (cleanedData.ingredients.length === 0 || cleanedData.instructions.length === 0) {
      alert('Du behöver minst en ingrediens och en instruktion.');
      return;
    }

    onSave(cleanedData);
  };

  const addIngredient = () => {
    setFormData({ ...formData, ingredients: [...formData.ingredients, ''] });
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const addInstruction = () => {
    setFormData({ ...formData, instructions: [...formData.instructions, ''] });
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData({ ...formData, instructions: newInstructions });
  };

  const removeInstruction = (index: number) => {
    setFormData({
      ...formData,
      instructions: formData.instructions.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="recipe-form-overlay">
      <div className="recipe-form-container">
        <h2>{recipe ? 'Redigera recept' : initialData ? 'Importerat recept' : 'Nytt recept'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Titel *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Beskrivning *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Förberedelsetid (min)</label>
              <input
                type="number"
                value={formData.prepTime || ''}
                onChange={(e) =>
                  setFormData({ ...formData, prepTime: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>

            <div className="form-group">
              <label>Tillagningstid (min)</label>
              <input
                type="number"
                value={formData.cookTime || ''}
                onChange={(e) =>
                  setFormData({ ...formData, cookTime: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>

            <div className="form-group">
              <label>Portioner</label>
              <input
                type="number"
                value={formData.servings || ''}
                onChange={(e) =>
                  setFormData({ ...formData, servings: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label>Kategori</label>
            <input
              type="text"
              list="category-suggestions"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="t.ex. Huvudrätt, Dessert, Sallad"
            />
            {existingCategories.length > 0 && (
              <datalist id="category-suggestions">
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            )}
          </div>

          <div className="form-group">
            <label>Bild URL</label>
            <input
              type="url"
              value={formData.imageUrl || ''}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://exempel.se/bild.jpg"
            />
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>Ingredienser *</h3>
              <button type="button" onClick={addIngredient} className="btn-add">
                + Lägg till
              </button>
            </div>
            {formData.ingredients.map((ingredient, index) => (
              <div key={index} className="list-item">
                <input
                  type="text"
                  value={ingredient}
                  onChange={(e) => updateIngredient(index, e.target.value)}
                  placeholder="t.ex. 2 dl mjöl"
                  required={index === 0}
                />
                {formData.ingredients.length > 1 && (
                  <button type="button" onClick={() => removeIngredient(index)} className="btn-remove">
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>Instruktioner *</h3>
              <button type="button" onClick={addInstruction} className="btn-add">
                + Lägg till
              </button>
            </div>
            {formData.instructions.map((instruction, index) => (
              <div key={index} className="list-item">
                <span className="step-number">{index + 1}.</span>
                <RichTextInstructionEditor
                  value={instruction}
                  onChange={(value) => updateInstruction(index, value)}
                  placeholder="Beskriv steget och använd formatering vid behov."
                />
                {formData.instructions.length > 1 && (
                  <button type="button" onClick={() => removeInstruction(index)} className="btn-remove">
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary" disabled={saving}>
              Avbryt
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Sparar...' : recipe ? 'Uppdatera' : 'Spara'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
