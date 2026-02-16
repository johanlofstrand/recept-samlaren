import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Recipe, RecipeFormData } from '../types/Recipe';
import { RichTextInstructionEditor } from './RichTextInstructionEditor';

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
    <Dialog open onClose={onCancel} maxWidth="md" fullWidth scroll="paper">
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {recipe ? 'Redigera recept' : initialData ? 'Importerat recept' : 'Nytt recept'}
        </DialogTitle>

        <DialogContent dividers>
          <TextField
            label="Titel"
            required
            fullWidth
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Beskrivning"
            required
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Förberedelsetid (min)"
                type="number"
                fullWidth
                value={formData.prepTime || ''}
                onChange={(e) =>
                  setFormData({ ...formData, prepTime: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Tillagningstid (min)"
                type="number"
                fullWidth
                value={formData.cookTime || ''}
                onChange={(e) =>
                  setFormData({ ...formData, cookTime: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Portioner"
                type="number"
                fullWidth
                value={formData.servings || ''}
                onChange={(e) =>
                  setFormData({ ...formData, servings: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Grid>
          </Grid>

          <Autocomplete
            freeSolo
            options={existingCategories}
            value={formData.category || ''}
            onInputChange={(_e, newValue) => setFormData({ ...formData, category: newValue })}
            renderInput={(params) => (
              <TextField {...params} label="Kategori" placeholder="t.ex. Huvudrätt, Dessert, Sallad" />
            )}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Bild URL"
            type="url"
            fullWidth
            value={formData.imageUrl || ''}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://exempel.se/bild.jpg"
            sx={{ mb: 3 }}
          />

          {/* Ingredients */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Ingredienser *
              </Typography>
              <Button startIcon={<AddIcon />} onClick={addIngredient} variant="contained" size="small">
                Lägg till
              </Button>
            </Box>
            {formData.ingredients.map((ingredient, index) => (
              <Stack key={index} direction="row" spacing={1} sx={{ mb: 1 }} alignItems="center">
                <TextField
                  fullWidth
                  value={ingredient}
                  onChange={(e) => updateIngredient(index, e.target.value)}
                  placeholder="t.ex. 2 dl mjöl"
                  required={index === 0}
                />
                {formData.ingredients.length > 1 && (
                  <IconButton color="error" onClick={() => removeIngredient(index)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Stack>
            ))}
          </Paper>

          {/* Instructions */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Instruktioner *
              </Typography>
              <Button startIcon={<AddIcon />} onClick={addInstruction} variant="contained" size="small">
                Lägg till
              </Button>
            </Box>
            {formData.instructions.map((instruction, index) => (
              <Stack key={index} direction="row" spacing={1} sx={{ mb: 1 }} alignItems="flex-start">
                <Typography sx={{ pt: 1, fontWeight: 700, color: 'primary.main', minWidth: '2rem' }}>
                  {index + 1}.
                </Typography>
                <RichTextInstructionEditor
                  value={instruction}
                  onChange={(value) => updateInstruction(index, value)}
                  placeholder="Beskriv steget och använd formatering vid behov."
                />
                {formData.instructions.length > 1 && (
                  <IconButton color="error" onClick={() => removeInstruction(index)} sx={{ mt: 0.5 }}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Stack>
            ))}
          </Paper>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onCancel} disabled={saving}>
            Avbryt
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            sx={{
              background: 'linear-gradient(135deg, #5b6df6 0%, #7b61ff 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #4558e8 0%, #6a4ef5 100%)' },
            }}
          >
            {saving ? 'Sparar...' : recipe ? 'Uppdatera' : 'Spara'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
