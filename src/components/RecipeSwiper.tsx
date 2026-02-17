import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import Link from '@mui/material/Link';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TimerIcon from '@mui/icons-material/Timer';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import PeopleIcon from '@mui/icons-material/People';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { keyframes } from '@emotion/react';
import type { Recipe } from '../types/Recipe';
import DOMPurify from 'dompurify';

interface RecipeSwiperProps {
  recipes: Recipe[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isIngredientChecked: (recipeId: string, ingredientIndex: number) => boolean;
  onToggleIngredient: (recipeId: string, ingredientIndex: number) => void;
  canEdit?: boolean;
}

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const toInstructionHtml = (instruction: string): string => {
  if (!instruction?.trim()) return '<p></p>';
  if (/<[a-z][\s\S]*>/i.test(instruction)) return instruction;
  return `<p>${escapeHtml(instruction).replace(/\n/g, '<br />')}</p>`;
};

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-50px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideLeft = keyframes`
  from { opacity: 0; transform: translateX(50px); }
  to { opacity: 1; transform: translateX(0); }
`;

const slideRight = keyframes`
  from { opacity: 0; transform: translateX(-50px); }
  to { opacity: 1; transform: translateX(0); }
`;

const animationMap = { up: slideUp, down: slideDown, left: slideLeft, right: slideRight };

export const RecipeSwiper = ({
  recipes,
  currentIndex,
  onIndexChange,
  onEdit,
  onDelete,
  onToggleFavorite,
  isIngredientChecked,
  onToggleIngredient,
  canEdit,
}: RecipeSwiperProps) => {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, Set<number>>>({});
  const [ingredientsCollapsed, setIngredientsCollapsed] = useState(false);

  const isStepChecked = useCallback(
    (recipeId: string, stepIndex: number) => checkedSteps[recipeId]?.has(stepIndex) ?? false,
    [checkedSteps]
  );

  const toggleStep = useCallback((recipeId: string, stepIndex: number) => {
    setCheckedSteps((prev) => {
      const set = new Set(prev[recipeId]);
      if (set.has(stepIndex)) set.delete(stepIndex);
      else set.add(stepIndex);
      return { ...prev, [recipeId]: set };
    });
  }, []);

  const currentRecipe = recipes[currentIndex];
  const currentCategory = currentRecipe?.category;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateUp();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateDown();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateLeft();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, recipes]);

  const navigateUp = () => {
    if (currentIndex > 0) {
      setDirection('up');
      setTimeout(() => {
        onIndexChange(currentIndex - 1);
        setDirection(null);
      }, 300);
    }
  };

  const navigateDown = () => {
    if (currentIndex < recipes.length - 1) {
      setDirection('down');
      setTimeout(() => {
        onIndexChange(currentIndex + 1);
        setDirection(null);
      }, 300);
    }
  };

  const navigateLeft = () => {
    const categoryRecipes = recipes.filter(r => r.category === currentCategory);
    if (categoryRecipes.length > 1) {
      const currentInCategory = categoryRecipes.findIndex(r => r.id === currentRecipe.id);
      const prevInCategory = currentInCategory > 0 ? currentInCategory - 1 : categoryRecipes.length - 1;
      const targetRecipe = categoryRecipes[prevInCategory];
      const targetIndex = recipes.findIndex(r => r.id === targetRecipe.id);

      setDirection('left');
      setTimeout(() => {
        onIndexChange(targetIndex);
        setDirection(null);
      }, 300);
    }
  };

  const navigateRight = () => {
    const categoryRecipes = recipes.filter(r => r.category === currentCategory);
    if (categoryRecipes.length > 1) {
      const currentInCategory = categoryRecipes.findIndex(r => r.id === currentRecipe.id);
      const nextInCategory = currentInCategory < categoryRecipes.length - 1 ? currentInCategory + 1 : 0;
      const targetRecipe = categoryRecipes[nextInCategory];
      const targetIndex = recipes.findIndex(r => r.id === targetRecipe.id);

      setDirection('right');
      setTimeout(() => {
        onIndexChange(targetIndex);
        setDirection(null);
      }, 300);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      navigateDown();
    }

    if (touchStart - touchEnd < -50) {
      navigateUp();
    }
  };

  if (!currentRecipe) {
    return (
      <Box
        className="recipe-swiper"
        sx={{ width: '100%', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <RestaurantIcon sx={{ fontSize: 80, mb: 2, opacity: 0.5, color: 'text.secondary' }} />
          <Typography variant="h5" gutterBottom>
            Inga recept än
          </Typography>
          <Typography color="text.secondary">
            Lägg till ditt första recept!
          </Typography>
        </Box>
      </Box>
    );
  }

  const categoryRecipes = recipes.filter(r => r.category === currentCategory);
  const hasCategoryNavigation = currentCategory && categoryRecipes.length > 1;

  return (
    <Box
      className="recipe-swiper"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{
        width: '100%',
        height: '100dvh',
        position: 'relative',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <Card
        elevation={0}
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          pb: 9,
          width: '100%',
          maxWidth: 980,
          mx: 'auto',
          border: 1,
          borderColor: 'rgba(227, 233, 245, 0.75)',
          boxShadow: '0 10px 35px rgba(20, 29, 61, 0.08)',
          borderRadius: { xs: 0, md: '18px' },
          overflow: { md: 'hidden' },
          mt: { md: 1.5, lg: 2 },
          ...(direction && {
            animation: `${animationMap[direction]} 0.3s ease-out`,
          }),
        }}
      >
        {currentRecipe.imageUrl && (
          <Box sx={{ position: 'relative', width: '100%', height: { xs: '30vh', sm: 'min(44vh, 380px)', xl: 'min(46vh, 420px)' }, overflow: 'hidden' }}>
            <CardMedia
              component="img"
              image={currentRecipe.imageUrl}
              alt={currentRecipe.title}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 100,
                background: 'linear-gradient(to top, rgba(255,255,255,1) 10%, rgba(255,255,255,0) 100%)',
              }}
            />
          </Box>
        )}

        {/* Header */}
        <Box sx={{ px: { xs: 2, lg: 4 }, pt: { xs: 2, lg: 3 }, pb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            {currentRecipe.category && (
              <Chip
                label={currentRecipe.category}
                sx={{
                  background: 'linear-gradient(135deg, #5b6df6 0%, #7b61ff 100%)',
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              />
            )}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton
                onClick={() => onToggleFavorite(currentRecipe.id)}
                title={currentRecipe.isFavorite ? 'Ta bort från favoriter' : 'Lägg till i favoriter'}
                sx={{ border: 1, borderColor: 'divider' }}
              >
                {currentRecipe.isFavorite ? <StarIcon color="warning" /> : <StarBorderIcon />}
              </IconButton>
              {canEdit && (
                <>
                  <IconButton
                    onClick={() => onEdit(currentRecipe)}
                    title="Redigera"
                    sx={{ border: 1, borderColor: 'divider', bgcolor: '#edf5ff' }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => onDelete(currentRecipe.id)}
                    title="Ta bort"
                    sx={{ border: 1, borderColor: 'divider', bgcolor: '#fff0f0' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </>
              )}
            </Box>
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
              mb: 0.75,
              fontSize: { xs: '1.42rem', sm: 'clamp(1.5rem, 2vw + 0.8rem, 2.1rem)' },
            }}
          >
            {currentRecipe.title}
          </Typography>

          {currentRecipe.sourceUrl && (
            <Link
              href={currentRecipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: 'inline-block', fontSize: '0.85rem', mb: 0.5 }}
            >
              {new URL(currentRecipe.sourceUrl).hostname.replace(/^www\./, '')}
            </Link>
          )}

          <Typography color="text.secondary" sx={{ mb: 2, lineHeight: 1.6, fontSize: { xs: '0.96rem', sm: '1.05rem' } }}>
            {currentRecipe.description}
          </Typography>

          {(currentRecipe.prepTime || currentRecipe.cookTime || currentRecipe.servings) && (
            <Stack
              direction="row"
              divider={<Divider orientation="vertical" flexItem />}
              spacing={2}
              sx={{ py: 1.5, borderTop: 1, borderBottom: 1, borderColor: 'divider' }}
            >
              {currentRecipe.prepTime && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <TimerIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">{currentRecipe.prepTime} min</Typography>
                </Stack>
              )}
              {currentRecipe.cookTime && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <LocalFireDepartmentIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">{currentRecipe.cookTime} min</Typography>
                </Stack>
              )}
              {currentRecipe.servings && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PeopleIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">{currentRecipe.servings} port.</Typography>
                </Stack>
              )}
            </Stack>
          )}
        </Box>

        {/* Ingredients & Instructions */}
        <Box sx={{ px: { xs: 2, lg: 4 }, pb: 2, flex: 1 }}>
          {/* Ingredients - collapsible */}
          <Box sx={{ mb: 3 }}>
            <Box
              onClick={() => setIngredientsCollapsed((v) => !v)}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', userSelect: 'none', mb: 1 }}
            >
              <Typography variant="h6" fontWeight={700}>
                Ingredienser
              </Typography>
              <ExpandMoreIcon
                sx={{
                  color: 'text.secondary',
                  transition: 'transform 0.2s',
                  transform: ingredientsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                }}
              />
            </Box>
            <Collapse in={!ingredientsCollapsed}>
              <List disablePadding>
                {currentRecipe.ingredients.map((ingredient, i) => {
                  const checked = isIngredientChecked(currentRecipe.id, i);
                  return (
                    <ListItem
                      key={i}
                      dense
                      sx={{
                        bgcolor: checked ? '#eefaf2' : '#fafcff',
                        border: 1,
                        borderColor: checked ? '#d5eadc' : 'divider',
                        borderRadius: 2,
                        mb: 0.5,
                        cursor: 'pointer',
                      }}
                      onClick={() => onToggleIngredient(currentRecipe.id, i)}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Checkbox
                          edge="start"
                          checked={checked}
                          tabIndex={-1}
                          disableRipple
                          color="primary"
                          size="small"
                        />
                      </ListItemIcon>
                      <ListItemText primary={ingredient} />
                      {checked && (
                        <Chip label="har hemma" size="small" color="success" variant="outlined" sx={{ ml: 1 }} />
                      )}
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </Box>

          {/* Instructions */}
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              Instruktioner
            </Typography>
            <List disablePadding>
              {currentRecipe.instructions.map((instruction, i) => {
                const checked = isStepChecked(currentRecipe.id, i);
                return (
                  <ListItem
                    key={i}
                    dense
                    sx={{
                      bgcolor: '#fafcff',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 1,
                      alignItems: 'flex-start',
                      opacity: checked ? 0.55 : 1,
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleStep(currentRecipe.id, i)}
                  >
                    <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                      <Checkbox
                        edge="start"
                        checked={checked}
                        tabIndex={-1}
                        disableRipple
                        color="primary"
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          component="span"
                          sx={{
                            lineHeight: 1.7,
                            textDecoration: checked ? 'line-through' : 'none',
                            color: checked ? 'text.secondary' : 'text.primary',
                            '& p': { m: 0, mb: 0.75 },
                            '& p:last-child': { mb: 0 },
                            '& ul, & ol': { m: '0.4rem 0 0.6rem 1.25rem' },
                          }}
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(toInstructionHtml(instruction)) }}
                        />
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Box>
      </Card>

      {/* Navigation hints */}
      <Box
        sx={{
          position: 'fixed',
          right: { xs: '0.6rem', sm: '1rem' },
          bottom: { xs: '4.4rem', sm: '1rem' },
          zIndex: 120,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(120px, auto))' },
          gap: 0.5,
          alignItems: 'end',
        }}
      >
        {currentIndex > 0 && (
          <Box
            onClick={navigateUp}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              justifyContent: 'center',
              minHeight: { xs: 34, sm: 42 },
              px: { xs: 0.5, sm: 1 },
              bgcolor: 'rgba(21, 29, 54, 0.8)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              borderRadius: 2,
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(17, 24, 39, 0.9)' },
              gridColumn: { sm: 1 },
              gridRow: { sm: 1 },
            }}
          >
            <ArrowUpwardIcon fontSize="small" />
            <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'inline' }, color: 'inherit' }}>Föregående</Typography>
          </Box>
        )}
        {currentIndex < recipes.length - 1 && (
          <Box
            onClick={navigateDown}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              justifyContent: 'center',
              minHeight: { xs: 34, sm: 42 },
              px: { xs: 0.5, sm: 1 },
              bgcolor: 'rgba(21, 29, 54, 0.8)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              borderRadius: 2,
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(17, 24, 39, 0.9)' },
              gridColumn: { sm: 2 },
              gridRow: { sm: 1 },
            }}
          >
            <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'inline' }, color: 'inherit' }}>Nästa</Typography>
            <ArrowDownwardIcon fontSize="small" />
          </Box>
        )}
        {hasCategoryNavigation && (
          <>
            <Box
              onClick={navigateLeft}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                justifyContent: 'center',
                minHeight: { xs: 34, sm: 42 },
                px: { xs: 0.5, sm: 1 },
                bgcolor: 'rgba(21, 29, 54, 0.8)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                borderRadius: 2,
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(17, 24, 39, 0.9)' },
                gridColumn: { sm: 1 },
                gridRow: { sm: 2 },
              }}
            >
              <ArrowBackIcon fontSize="small" />
              <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'inline' }, color: 'inherit' }}>
                Föregående i {currentCategory}
              </Typography>
            </Box>
            <Box
              onClick={navigateRight}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                justifyContent: 'center',
                minHeight: { xs: 34, sm: 42 },
                px: { xs: 0.5, sm: 1 },
                bgcolor: 'rgba(21, 29, 54, 0.8)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                borderRadius: 2,
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(17, 24, 39, 0.9)' },
                gridColumn: { sm: 2 },
                gridRow: { sm: 2 },
              }}
            >
              <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'inline' }, color: 'inherit' }}>
                Nästa i {currentCategory}
              </Typography>
              <ArrowForwardIcon fontSize="small" />
            </Box>
          </>
        )}
      </Box>

      {/* Progress indicator */}
      <Chip
        label={`${currentIndex + 1} / ${recipes.length}`}
        sx={{
          position: 'fixed',
          bottom: '0.95rem',
          left: '50%',
          transform: 'translateX(-50%)',
          bgcolor: 'rgba(17, 24, 39, 0.86)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          fontWeight: 600,
          zIndex: 130,
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      />
    </Box>
  );
};
