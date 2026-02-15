import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RecipeProvider } from './contexts/RecipeContext';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RecipeProvider>
      <App />
    </RecipeProvider>
  </StrictMode>
);
