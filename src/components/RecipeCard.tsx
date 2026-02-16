import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import TimerIcon from '@mui/icons-material/Timer';
import PeopleIcon from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Recipe } from '../types/Recipe';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onView: (recipe: Recipe) => void;
}

export const RecipeCard = ({ recipe, onEdit, onDelete, onView }: RecipeCardProps) => {
  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardActionArea onClick={() => onView(recipe)}>
        {recipe.imageUrl && (
          <CardMedia
            component="img"
            height={200}
            image={recipe.imageUrl}
            alt={recipe.title}
          />
        )}
        <CardContent sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            {recipe.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
            {recipe.description}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {recipe.prepTime && (
              <Chip icon={<TimerIcon />} label={`${recipe.prepTime} min`} size="small" variant="outlined" />
            )}
            {recipe.servings && (
              <Chip icon={<PeopleIcon />} label={`${recipe.servings} portioner`} size="small" variant="outlined" />
            )}
            {recipe.category && (
              <Chip label={recipe.category} size="small" color="primary" variant="outlined" />
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
      <CardActions sx={{ mt: 'auto' }}>
        <Button size="small" startIcon={<EditIcon />} onClick={() => onEdit(recipe)}>
          Redigera
        </Button>
        <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => onDelete(recipe.id)}>
          Ta bort
        </Button>
      </CardActions>
    </Card>
  );
};
