export interface FilterState {
  categories: string[];
  timeRange: { min?: number; max?: number };
  canMakeWithWhatIHave: boolean;
  favoritesOnly: boolean;
}
