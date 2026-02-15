import type { OfflineOperation, OperationType } from '../types/OfflineQueue';
import type { Recipe } from '../types/Recipe';

const QUEUE_PREFIX = 'recept-samlaren-offline-queue';

function getQueueKey(userId?: string): string {
  return userId ? `${QUEUE_PREFIX}-${userId}` : QUEUE_PREFIX;
}

export const offlineQueueService = {
  enqueue(operation: OperationType, data: any, recipeId?: string, userId?: string): void {
    const queue = this.getAll(userId);
    const newOperation: OfflineOperation = {
      id: `${Date.now()}-${Math.random()}`,
      operation,
      data,
      timestamp: Date.now(),
      recipeId,
    };
    queue.push(newOperation);
    localStorage.setItem(getQueueKey(userId), JSON.stringify(queue));
  },

  getAll(userId?: string): OfflineOperation[] {
    const stored = localStorage.getItem(getQueueKey(userId));
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse offline queue:', error);
      return [];
    }
  },

  async processQueue(
    userId: string | undefined,
    recipeService: {
      addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>, userId?: string) => Promise<string>;
      updateRecipe: (id: string, recipe: Partial<Recipe>, userId?: string) => Promise<void>;
      deleteRecipe: (id: string, userId?: string) => Promise<void>;
      updateFavorite: (id: string, isFavorite: boolean, userId?: string) => Promise<void>;
    }
  ): Promise<void> {
    const queue = this.getAll(userId);
    if (queue.length === 0) return;

    const errors: Array<{ operation: OfflineOperation; error: any }> = [];

    for (const operation of queue) {
      try {
        switch (operation.operation) {
          case 'add':
            await recipeService.addRecipe(operation.data, userId);
            break;
          case 'update':
            await recipeService.updateRecipe(operation.recipeId!, operation.data, userId);
            break;
          case 'delete':
            await recipeService.deleteRecipe(operation.recipeId!, userId);
            break;
          case 'toggleFavorite':
            await recipeService.updateFavorite(
              operation.recipeId!,
              operation.data.isFavorite,
              userId
            );
            break;
        }
      } catch (error) {
        console.error('Failed to process offline operation:', operation, error);
        errors.push({ operation, error });
      }
    }

    if (errors.length === 0) {
      this.clear(userId);
    } else {
      // Keep failed operations in queue
      const failedOperations = errors.map(e => e.operation);
      localStorage.setItem(getQueueKey(userId), JSON.stringify(failedOperations));
    }
  },

  clear(userId?: string): void {
    localStorage.removeItem(getQueueKey(userId));
  },

  count(userId?: string): number {
    return this.getAll(userId).length;
  },
};
