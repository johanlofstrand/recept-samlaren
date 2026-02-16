import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import TimerIcon from '@mui/icons-material/Timer';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import type { FilterState } from '../types/Filters';
import type { Recipe } from '../types/Recipe';

interface FilterChipsProps {
  recipes: Recipe[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const TIME_RANGES = [
  { label: '< 15 min', min: 0, max: 15 },
  { label: '15-30 min', min: 15, max: 30 },
  { label: '30-60 min', min: 30, max: 60 },
  { label: '60+ min', min: 60, max: Infinity },
];

export const FilterChips = ({
  recipes,
  filters,
  onFilterChange,
}: FilterChipsProps) => {
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    recipes.forEach((recipe) => {
      if (recipe.category) {
        uniqueCategories.add(recipe.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [recipes]);

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFilterChange({ ...filters, categories: newCategories });
  };

  const toggleTimeRange = (min: number, max: number) => {
    const isSameRange =
      filters.timeRange.min === min && filters.timeRange.max === max;

    onFilterChange({
      ...filters,
      timeRange: isSameRange ? {} : { min, max },
    });
  };

  const toggleCanMake = () => {
    onFilterChange({
      ...filters,
      canMakeWithWhatIHave: !filters.canMakeWithWhatIHave,
    });
  };

  const toggleFavoritesOnly = () => {
    onFilterChange({
      ...filters,
      favoritesOnly: !filters.favoritesOnly,
    });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.timeRange.min !== undefined ||
    filters.timeRange.max !== undefined ||
    filters.canMakeWithWhatIHave ||
    filters.favoritesOnly;

  const clearAllFilters = () => {
    onFilterChange({
      categories: [],
      timeRange: {},
      canMakeWithWhatIHave: false,
      favoritesOnly: false,
    });
  };

  return (
    <Box
      sx={{
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        borderBottom: 1,
        borderColor: 'divider',
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ px: 2, py: 1.5, minWidth: 'min-content' }}
      >
        {hasActiveFilters && (
          <Chip
            label="Rensa filter"
            color="error"
            onDelete={clearAllFilters}
            deleteIcon={<CloseIcon />}
            onClick={clearAllFilters}
          />
        )}

        <Chip
          icon={filters.favoritesOnly ? <StarIcon /> : <StarBorderIcon />}
          label="Favoriter"
          color={filters.favoritesOnly ? 'primary' : 'default'}
          variant={filters.favoritesOnly ? 'filled' : 'outlined'}
          onClick={toggleFavoritesOnly}
        />

        <Chip
          icon={<CheckIcon />}
          label="Kan laga"
          color={filters.canMakeWithWhatIHave ? 'primary' : 'default'}
          variant={filters.canMakeWithWhatIHave ? 'filled' : 'outlined'}
          onClick={toggleCanMake}
        />

        {TIME_RANGES.map((range) => {
          const isActive =
            filters.timeRange.min === range.min &&
            filters.timeRange.max === range.max;
          return (
            <Chip
              key={range.label}
              icon={<TimerIcon />}
              label={range.label}
              color={isActive ? 'primary' : 'default'}
              variant={isActive ? 'filled' : 'outlined'}
              onClick={() => toggleTimeRange(range.min, range.max)}
            />
          );
        })}

        {categories.map((category) => {
          const isActive = filters.categories.includes(category);
          return (
            <Chip
              key={category}
              label={category}
              color={isActive ? 'primary' : 'default'}
              variant={isActive ? 'filled' : 'outlined'}
              onClick={() => toggleCategory(category)}
            />
          );
        })}
      </Stack>
    </Box>
  );
};
