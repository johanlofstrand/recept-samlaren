import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import type { Recipe } from '../types/Recipe';
import { RecipeCard } from './RecipeCard';

interface RecipeListProps {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onView: (recipe: Recipe) => void;
}

export const RecipeList = ({ recipes, onEdit, onDelete, onView }: RecipeListProps) => {
  if (recipes.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, px: 4 }}>
        <RestaurantIcon sx={{ fontSize: 80, mb: 2, opacity: 0.5, color: 'text.secondary' }} />
        <Typography variant="h5" gutterBottom>
          Inga recept än
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Klicka på "Nytt recept" för att lägga till ditt första recept!
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3} sx={{ py: 4 }}>
      {recipes.map((recipe) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={recipe.id}>
          <RecipeCard recipe={recipe} onEdit={onEdit} onDelete={onDelete} onView={onView} />
        </Grid>
      ))}
    </Grid>
  );
};
