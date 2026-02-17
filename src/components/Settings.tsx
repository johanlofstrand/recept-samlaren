import { useState, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import type { User } from 'firebase/auth';
import type { UserSettings } from '../types/Settings';
import type { RecipeFormData } from '../types/Recipe';
import type { UserRole } from '../types/Role';
import { canEditRecipes, canManageUsers } from '../types/Role';
import { importRecipeFromUrl, RecipeImportError } from '../services/recipeImportService';

interface SettingsProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
  user: User | null;
  onSignOut: () => Promise<void>;
  onClose: () => void;
  shoppingListText: string;
  onImportRecipe: (recipe: RecipeFormData) => void;
  userRole: UserRole;
  onOpenAdmin: () => void;
}

export const Settings = ({
  settings,
  onSettingsChange,
  user,
  onSignOut,
  onClose,
  shoppingListText,
  onImportRecipe,
  userRole,
  onOpenAdmin,
}: SettingsProps) => {
  const [phoneNumber, setPhoneNumber] = useState(settings.phoneNumber);
  const [defaultServings, setDefaultServings] = useState(settings.defaultServings);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    onSettingsChange({ ...settings, phoneNumber: value });
  };

  const handleServingsChange = (value: number) => {
    const clamped = Math.max(1, Math.min(99, value));
    setDefaultServings(clamped);
    onSettingsChange({ ...settings, defaultServings: clamped });
  };

  const handleSendSms = () => {
    const body = encodeURIComponent(shoppingListText);
    window.location.href = `sms:${phoneNumber}?body=${body}`;
  };

  const canSendSms = useMemo(
    () => phoneNumber.trim().length > 0 && shoppingListText.trim().length > 0,
    [phoneNumber, shoppingListText]
  );

  const handleImport = async () => {
    setImportError('');
    setImporting(true);
    try {
      const recipeData = await importRecipeFromUrl(importUrl.trim());
      onImportRecipe(recipeData);
    } catch (error) {
      if (error instanceof RecipeImportError) {
        setImportError(error.message);
      } else {
        setImportError('Ett oväntat fel inträffade.');
      }
    } finally {
      setImporting(false);
    }
  };

  const handleLogout = async () => {
    await onSignOut();
    onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        Inställningar
        <IconButton onClick={onClose} title="Stäng">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Telefonnummer för inköpslista
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Spara ett nummer för att snabbt skicka inköpslistan via SMS
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              type="tel"
              placeholder="07X XXX XX XX"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              color="success"
              onClick={handleSendSms}
              disabled={!canSendSms}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Skicka
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Standardportioner
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Antal portioner som föreslås för nya recept
          </Typography>
          <TextField
            type="number"
            slotProps={{ htmlInput: { min: 1, max: 99 } }}
            value={defaultServings}
            onChange={(e) => handleServingsChange(parseInt(e.target.value, 10) || 4)}
            sx={{ width: 80 }}
          />
        </Box>

        {canEditRecipes(userRole) && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Importera recept från URL
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Klistra in en länk till ett recept från t.ex. Coop eller Köket.se
            </Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                type="url"
                placeholder="https://www.koket.se/recept/..."
                value={importUrl}
                onChange={(e) => {
                  setImportUrl(e.target.value);
                  setImportError('');
                }}
                disabled={importing}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={() => void handleImport()}
                disabled={importing || importUrl.trim().length === 0}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {importing ? 'Hämtar...' : 'Importera'}
              </Button>
            </Stack>
            {importError && (
              <Typography color="error" variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                {importError}
              </Typography>
            )}
          </Box>
        )}

        {canManageUsers(userRole) && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AdminPanelSettingsIcon />}
              onClick={onOpenAdmin}
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              Adminpanel — Användare & statistik
            </Button>
          </Box>
        )}

        {user && (
          <>
            <Divider sx={{ my: 2 }} />
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={() => void handleLogout()}
            >
              Logga ut ({user.displayName || user.email || 'användare'})
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
