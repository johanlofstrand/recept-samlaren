export type OperationType = 'add' | 'update' | 'delete' | 'toggleFavorite';

export interface OfflineOperation {
  id: string;
  operation: OperationType;
  data: any;
  timestamp: number;
  recipeId?: string;
}
