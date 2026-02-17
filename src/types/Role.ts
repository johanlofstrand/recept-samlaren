export type UserRole = 'admin' | 'editor' | 'viewer';
export const canEditRecipes = (role: UserRole) => role === 'admin' || role === 'editor';
export const canManageUsers = (role: UserRole) => role === 'admin';
