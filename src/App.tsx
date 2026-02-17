import { useCallback, useEffect, useMemo, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Fab from '@mui/material/Fab';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import GoogleIcon from '@mui/icons-material/Google';
import { useRecipes } from './contexts/RecipeContext';
import { RecipeSwiper } from './components/RecipeSwiper';
import { RecipeForm } from './components/RecipeForm';
import { FilterChips } from './components/FilterChips';
import { ShoppingList } from './components/ShoppingList';
import { Settings } from './components/Settings';
import { AdminDashboard } from './components/AdminDashboard';
import { useRecipeFilters } from './hooks/useRecipeFilters';
import type { Recipe, RecipeFormData } from './types/Recipe';
import type { FilterState } from './types/Filters';
import type { UserSettings } from './types/Settings';
import { canEditRecipes, canManageUsers } from './types/Role';

type IngredientChecks = Record<string, Record<number, boolean>>;
const INGREDIENT_CHECKS_KEY = 'recept-samlaren-ingredient-checks';
const FILTERS_KEY = 'recept-samlaren-filters';
const SETTINGS_KEY = 'recept-samlaren-settings';

const DEFAULT_SETTINGS: UserSettings = {
  phoneNumber: '',
  defaultServings: 4,
};

function App() {
  const {
    recipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    toggleFavorite,
    loading,
    authLoading,
    usingFirebase,
    user,
    signInWithGoogle,
    signOut,
    syncStatus,
    userRole,
  } = useRecipes();
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [ingredientChecks, setIngredientChecks] = useState<IngredientChecks>({});
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    timeRange: {},
    canMakeWithWhatIHave: false,
    favoritesOnly: false,
  });
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [importedRecipeData, setImportedRecipeData] = useState<RecipeFormData | undefined>();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in failed:', error);
      alert('Kunde inte logga in med Google just nu. Försök igen.');
    }
  };

  const ingredientChecksKey = `${INGREDIENT_CHECKS_KEY}-${user?.uid || 'guest'}`;
  const filtersKey = `${FILTERS_KEY}-${user?.uid || 'guest'}`;
  const settingsKey = `${SETTINGS_KEY}-${user?.uid || 'guest'}`;

  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ingredientChecksKey);
      if (stored) {
        setIngredientChecks(JSON.parse(stored) as IngredientChecks);
      } else {
        setIngredientChecks({});
      }
    } catch (error) {
      console.warn('Failed to load ingredient checks:', error);
    }
  }, [ingredientChecksKey]);

  useEffect(() => {
    localStorage.setItem(ingredientChecksKey, JSON.stringify(ingredientChecks));
  }, [ingredientChecks, ingredientChecksKey]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(filtersKey);
      if (stored) {
        const loadedFilters = JSON.parse(stored) as FilterState;
        setFilters(loadedFilters);
        setShowFavoritesOnly(loadedFilters.favoritesOnly);
      }
    } catch (error) {
      console.warn('Failed to load filters:', error);
    }
  }, [filtersKey]);

  useEffect(() => {
    localStorage.setItem(filtersKey, JSON.stringify(filters));
  }, [filters, filtersKey]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(settingsKey);
      if (stored) {
        setUserSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(stored) as UserSettings) });
      } else {
        setUserSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
  }, [settingsKey]);

  const handleSettingsChange = useCallback(
    (newSettings: UserSettings) => {
      setUserSettings(newSettings);
      localStorage.setItem(settingsKey, JSON.stringify(newSettings));
    },
    [settingsKey]
  );

  const handleImportRecipe = useCallback((recipeData: RecipeFormData) => {
    setShowSettings(false);
    setImportedRecipeData(recipeData);
    setEditingRecipe(undefined);
    setShowForm(true);
  }, []);

  const isIngredientChecked = (recipeId: string, ingredientIndex: number) =>
    !!ingredientChecks[recipeId]?.[ingredientIndex];

  const toggleIngredient = (recipeId: string, ingredientIndex: number) => {
    setIngredientChecks((prev) => ({
      ...prev,
      [recipeId]: {
        ...(prev[recipeId] || {}),
        [ingredientIndex]: !prev[recipeId]?.[ingredientIndex],
      },
    }));
  };

  const handleSaveRecipe = async (recipeData: RecipeFormData) => {
    setSaving(true);
    try {
      if (editingRecipe) {
        await updateRecipe(editingRecipe.id, recipeData);
      } else {
        await addRecipe(recipeData);
      }
      setShowForm(false);
      setEditingRecipe(undefined);
      setImportedRecipeData(undefined);
    } catch (error) {
      alert('Kunde inte spara recept. Försök igen.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const handleDeleteRecipe = async (id: string) => {
    if (confirm('Är du säker på att du vill ta bort detta recept?')) {
      try {
        await deleteRecipe(id);
        if (currentIndex >= recipes.length - 1 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      } catch (error) {
        alert('Kunde inte ta bort recept. Försök igen.');
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecipe(undefined);
    setImportedRecipeData(undefined);
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavorite(id);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleClearChecked = () => {
    const newChecks: IngredientChecks = {};
    Object.keys(ingredientChecks).forEach((recipeId) => {
      const recipeChecks = ingredientChecks[recipeId];
      const uncheckedItems: Record<number, boolean> = {};
      Object.keys(recipeChecks).forEach((indexStr) => {
        const index = parseInt(indexStr, 10);
        if (!recipeChecks[index]) {
          uncheckedItems[index] = false;
        }
      });
      if (Object.keys(uncheckedItems).length > 0) {
        newChecks[recipeId] = uncheckedItems;
      }
    });
    setIngredientChecks(newChecks);
  };

  const effectiveFilters = {
    ...filters,
    favoritesOnly: showFavoritesOnly,
  };

  const displayRecipes = useRecipeFilters({
    recipes,
    filters: effectiveFilters,
    searchQuery,
    ingredientChecks,
  });

  useEffect(() => {
    if (currentIndex >= displayRecipes.length && displayRecipes.length > 0) {
      setCurrentIndex(0);
    }
  }, [displayRecipes.length, currentIndex]);

  const existingCategories = useMemo(() => {
    const cats = new Set<string>();
    recipes.forEach((r) => { if (r.category) cats.add(r.category); });
    return Array.from(cats).sort();
  }, [recipes]);

  const shoppingListItems = useMemo(
    () =>
      recipes.flatMap((recipe) =>
        recipe.ingredients
          .map((ingredient, ingredientIndex) => ({
            recipeId: recipe.id,
            recipeTitle: recipe.title,
            ingredientIndex,
            ingredient,
          }))
          .filter(
            (item) =>
              item.ingredient.trim() !== '' && !isIngredientChecked(recipe.id, item.ingredientIndex)
          )
      ),
    [recipes, ingredientChecks]
  );

  const shoppingListText = useMemo(() => {
    if (shoppingListItems.length === 0) return '';
    const groups = new Map<string, string[]>();
    shoppingListItems.forEach((item) => {
      if (!groups.has(item.recipeTitle)) groups.set(item.recipeTitle, []);
      groups.get(item.recipeTitle)!.push(item.ingredient);
    });
    let text = 'Inköpslista\n\n';
    groups.forEach((ingredients, title) => {
      text += `${title}\n`;
      ingredients.forEach((ing) => { text += `• ${ing}\n`; });
      text += '\n';
    });
    return text;
  }, [shoppingListItems]);

  // Loading screen
  if (loading || (usingFirebase && authLoading)) {
    return (
      <Box sx={{ width: '100%', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={50} sx={{ mb: 2 }} />
          <Typography color="text.secondary">
            {usingFirebase ? 'Verifierar konto...' : 'Laddar recept...'}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Auth screen
  if (usingFirebase && !user) {
    return (
      <Box sx={{ width: '100%', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Card sx={{ maxWidth: 460, width: '100%', textAlign: 'center' }} elevation={4}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Receptsamlaren
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
              Logga in med Google för att se och spara dina recept i molnet.
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<GoogleIcon />}
              onClick={() => void handleGoogleSignIn()}
              sx={{
                py: 1.5,
                background: 'linear-gradient(135deg, #5b6df6 0%, #7b61ff 100%)',
                boxShadow: '0 10px 20px rgba(91, 109, 246, 0.28)',
                '&:hover': { background: 'linear-gradient(135deg, #4558e8 0%, #6a4ef5 100%)' },
              }}
            >
              Fortsätt med Google
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Main app
  return (
    <Box sx={{ width: '100%', height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(14px)',
          borderBottom: 1,
          borderColor: 'divider',
          height: { xs: 60, sm: 64 },
        }}
      >
        <Toolbar
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'auto 1fr auto', sm: '1fr auto 1fr' },
            gap: { xs: 0.5, sm: 0 },
            minHeight: { xs: 60, sm: 64 },
            px: { xs: 1, sm: 2, lg: 3 },
          }}
        >
          <IconButton onClick={() => setShowSearch(!showSearch)} title="Sök">
            <SearchIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifySelf: 'center' }}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.02em',
                fontSize: { xs: '0.98rem', sm: 'clamp(1.02rem, 1vw + 0.72rem, 1.28rem)' },
              }}
            >
              Receptsamlaren
            </Typography>
            {usingFirebase && syncStatus === 'error' && (
              <Tooltip title="Synkfel – försöker igen">
                <WarningAmberIcon color="warning" fontSize="small" />
              </Tooltip>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifySelf: 'end' }}>
            <IconButton onClick={() => setShowSettings(true)} title="Inställningar">
              <SettingsIcon />
            </IconButton>
            <IconButton
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              title={showFavoritesOnly ? 'Visa alla recept' : 'Visa favoriter'}
              color={showFavoritesOnly ? 'primary' : 'default'}
            >
              {showFavoritesOnly ? <StarIcon /> : <StarBorderIcon />}
            </IconButton>
            <IconButton onClick={() => setShowShoppingList(true)} title="Inköpslista">
              <ShoppingCartIcon />
            </IconButton>
            {canEditRecipes(userRole) && (
              <Fab
                color="primary"
                size="small"
                onClick={() => {
                  setEditingRecipe(undefined);
                  setShowForm(true);
                }}
                title="Nytt recept"
                sx={{
                  boxShadow: '0 10px 22px rgba(91, 109, 246, 0.35)',
                  background: 'linear-gradient(135deg, #5b6df6 0%, #7b61ff 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #4558e8 0%, #6a4ef5 100%)' },
                }}
              >
                <AddIcon />
              </Fab>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Collapse in={showSearch} sx={{ position: 'fixed', top: { xs: 60, sm: 64 }, left: 0, right: 0, zIndex: 999 }}>
        <Paper
          elevation={0}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(12px)',
            borderBottom: 1,
            borderColor: 'divider',
            p: '0.75rem 1rem 0.95rem',
          }}
        >
          <TextField
            fullWidth
            placeholder="Sök recept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            sx={{ maxWidth: 900, mx: 'auto', display: 'block' }}
          />
        </Paper>
      </Collapse>

      <FilterChips
        recipes={recipes}
        filters={filters}
        onFilterChange={setFilters}
      />

      <Box component="main" sx={{ flex: 1, mt: { xs: '60px', sm: '64px' }, overflow: 'hidden' }}>
        <RecipeSwiper
          recipes={displayRecipes}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
          onEdit={handleEditRecipe}
          onDelete={handleDeleteRecipe}
          onToggleFavorite={handleToggleFavorite}
          isIngredientChecked={isIngredientChecked}
          onToggleIngredient={toggleIngredient}
          canEdit={canEditRecipes(userRole)}
        />
      </Box>

      {showShoppingList && (
        <ShoppingList
          items={shoppingListItems}
          onToggle={toggleIngredient}
          onClearChecked={handleClearChecked}
          onClose={() => setShowShoppingList(false)}
          ingredientChecks={ingredientChecks}
        />
      )}

      {showSettings && (
        <Settings
          settings={userSettings}
          onSettingsChange={handleSettingsChange}
          user={user}
          onSignOut={signOut}
          onClose={() => setShowSettings(false)}
          shoppingListText={shoppingListText}
          onImportRecipe={handleImportRecipe}
          userRole={userRole}
          onOpenAdmin={() => { setShowSettings(false); setShowAdminDashboard(true); }}
        />
      )}

      {showAdminDashboard && user && canManageUsers(userRole) && (
        <AdminDashboard
          onClose={() => setShowAdminDashboard(false)}
          currentUserId={user.uid}
        />
      )}

      {showForm && (
        <RecipeForm
          recipe={editingRecipe}
          onSave={handleSaveRecipe}
          onCancel={handleCloseForm}
          saving={saving}
          initialData={importedRecipeData}
          existingCategories={existingCategories}
        />
      )}
    </Box>
  );
}

export default App;
