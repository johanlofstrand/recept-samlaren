import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import CardMedia from '@mui/material/CardMedia';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import CloseIcon from '@mui/icons-material/Close';
import TimerIcon from '@mui/icons-material/Timer';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import PeopleIcon from '@mui/icons-material/People';
import LabelIcon from '@mui/icons-material/Label';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Recipe } from '../types/Recipe';

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const RecipeDetail = ({ recipe, onClose, onEdit, onDelete }: RecipeDetailProps) => {
  const metaItems = [
    recipe.prepTime && { icon: <TimerIcon />, label: 'Förberedelsetid', value: `${recipe.prepTime} min` },
    recipe.cookTime && { icon: <LocalFireDepartmentIcon />, label: 'Tillagningstid', value: `${recipe.cookTime} min` },
    recipe.servings && { icon: <PeopleIcon />, label: 'Portioner', value: `${recipe.servings}` },
    recipe.category && { icon: <LabelIcon />, label: 'Kategori', value: recipe.category },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <IconButton
        onClick={onClose}
        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10, bgcolor: 'background.paper' }}
      >
        <CloseIcon />
      </IconButton>

      {recipe.imageUrl && (
        <CardMedia
          component="img"
          image={recipe.imageUrl}
          alt={recipe.title}
          sx={{ height: { xs: 250, sm: 400 } }}
        />
      )}

      <DialogContent sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {recipe.title}
        </Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.6, mb: 3 }}>
          {recipe.description}
        </Typography>

        {metaItems.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {metaItems.map((item) => (
              <Grid size={{ xs: 6, sm: 3 }} key={item.label}>
                <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ color: 'primary.main' }}>{item.icon}</Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                    <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        <Typography variant="h5" fontWeight={600} gutterBottom>
          Ingredienser
        </Typography>
        <List disablePadding>
          {recipe.ingredients.map((ingredient, index) => (
            <ListItem key={index} sx={{ bgcolor: 'grey.50', mb: 0.5, borderRadius: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckIcon color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={ingredient} />
            </ListItem>
          ))}
        </List>

        <Typography variant="h5" fontWeight={600} sx={{ mt: 4 }} gutterBottom>
          Instruktioner
        </Typography>
        <List disablePadding>
          {recipe.instructions.map((instruction, index) => (
            <ListItem key={index} sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 1, alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 44, mt: 0.5 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                  {index + 1}
                </Avatar>
              </ListItemIcon>
              <ListItemText primary={instruction} sx={{ '& .MuiListItemText-primary': { lineHeight: 1.6 } }} />
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit}>
          Redigera recept
        </Button>
        <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={onDelete}>
          Ta bort recept
        </Button>
      </DialogActions>
    </Dialog>
  );
};
