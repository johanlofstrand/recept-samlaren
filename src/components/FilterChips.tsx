import { useMemo } from 'react';
import type { FilterState } from '../types/Filters';
import type { Recipe } from '../types/Recipe';
import './FilterChips.css';

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
  // Extract unique categories from recipes
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
    <div className="filter-chips-container">
      <div className="filter-chips">
        {/* Clear all button */}
        {hasActiveFilters && (
          <button className="filter-chip clear-all" onClick={clearAllFilters}>
            ✕ Rensa filter
          </button>
        )}

        {/* Favorites chip */}
        <button
          className={`filter-chip ${filters.favoritesOnly ? 'active' : ''}`}
          onClick={toggleFavoritesOnly}
        >
          {filters.favoritesOnly ? '⭐' : '☆'} Favoriter
        </button>

        {/* Can make chip */}
        <button
          className={`filter-chip ${filters.canMakeWithWhatIHave ? 'active' : ''}`}
          onClick={toggleCanMake}
        >
          ✓ Kan laga
        </button>

        {/* Time range chips */}
        {TIME_RANGES.map((range) => {
          const isActive =
            filters.timeRange.min === range.min &&
            filters.timeRange.max === range.max;
          return (
            <button
              key={range.label}
              className={`filter-chip ${isActive ? 'active' : ''}`}
              onClick={() => toggleTimeRange(range.min, range.max)}
            >
              ⏱️ {range.label}
            </button>
          );
        })}

        {/* Category chips */}
        {categories.map((category) => {
          const isActive = filters.categories.includes(category);
          return (
            <button
              key={category}
              className={`filter-chip ${isActive ? 'active' : ''}`}
              onClick={() => toggleCategory(category)}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
};
