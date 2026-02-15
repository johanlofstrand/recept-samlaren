import { useState, useEffect, useMemo } from 'react';
import type { User } from 'firebase/auth';
import type { UserSettings } from '../types/Settings';
import type { RecipeFormData } from '../types/Recipe';
import { importRecipeFromUrl, RecipeImportError } from '../services/recipeImportService';
import { adminService, type UserRecord } from '../services/adminService';
import './Settings.css';

interface SettingsProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
  user: User | null;
  onSignOut: () => Promise<void>;
  onClose: () => void;
  shoppingListText: string;
  onImportRecipe: (recipe: RecipeFormData) => void;
  isAdmin: boolean;
}

export const Settings = ({
  settings,
  onSettingsChange,
  user,
  onSignOut,
  onClose,
  shoppingListText,
  onImportRecipe,
  isAdmin,
}: SettingsProps) => {
  const [phoneNumber, setPhoneNumber] = useState(settings.phoneNumber);
  const [defaultServings, setDefaultServings] = useState(settings.defaultServings);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    adminService.getAllUsers().then(
      (allUsers) => { setUsers(allUsers); setLoadingUsers(false); },
      (err) => { console.error('Failed to load users:', err); setLoadingUsers(false); }
    );
  }, [isAdmin]);

  const handleToggleAdmin = async (uid: string, currentIsAdmin: boolean) => {
    try {
      await adminService.setAdmin(uid, !currentIsAdmin);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, isAdmin: !currentIsAdmin } : u))
      );
    } catch (err) {
      console.error('Failed to update admin status:', err);
    }
  };

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
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Inställningar</h2>
          <button className="settings-close-btn" onClick={onClose} title="Stäng">
            ✕
          </button>
        </div>

        <div className="settings-section">
          <label>Telefonnummer för inköpslista</label>
          <span className="settings-hint">
            Spara ett nummer för att snabbt skicka inköpslistan via SMS
          </span>
          <div className="settings-phone-row">
            <input
              type="tel"
              placeholder="07X XXX XX XX"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
            />
            <button
              className="settings-send-sms-btn"
              onClick={handleSendSms}
              disabled={!canSendSms}
              title={!canSendSms ? 'Ange ett nummer och ha ingredienser i listan' : 'Skicka SMS'}
            >
              Skicka
            </button>
          </div>
        </div>

        <div className="settings-section">
          <label>Standardportioner</label>
          <span className="settings-hint">
            Antal portioner som föreslås för nya recept
          </span>
          <input
            className="settings-servings-input"
            type="number"
            min={1}
            max={99}
            value={defaultServings}
            onChange={(e) => handleServingsChange(parseInt(e.target.value, 10) || 4)}
          />
        </div>

        {isAdmin && (
          <div className="settings-section">
            <label>Importera recept från URL</label>
            <span className="settings-hint">
              Klistra in en länk till ett recept från t.ex. ICA, Coop eller Köket.se
            </span>
            <div className="settings-import-row">
              <input
                type="url"
                placeholder="https://www.ica.se/recept/..."
                value={importUrl}
                onChange={(e) => {
                  setImportUrl(e.target.value);
                  setImportError('');
                }}
                disabled={importing}
              />
              <button
                className="settings-import-btn"
                onClick={() => void handleImport()}
                disabled={importing || importUrl.trim().length === 0}
              >
                {importing ? 'Hämtar...' : 'Importera'}
              </button>
            </div>
            {importError && <p className="settings-import-error">{importError}</p>}
          </div>
        )}

        {isAdmin && (
          <div className="settings-admin-section">
            <label>Adminhantering</label>
            <span className="settings-hint">Hantera vilka användare som har admin-behörighet</span>
            {loadingUsers ? (
              <p className="settings-hint">Laddar användare...</p>
            ) : (
              <div className="settings-user-list">
                {users.map((u) => (
                  <div key={u.uid} className="settings-user-row">
                    <div className="settings-user-info">
                      <span className="settings-user-name">{u.displayName || 'Okänd'}</span>
                      <span className="settings-user-email">{u.email}</span>
                    </div>
                    <button
                      className={`settings-admin-toggle ${u.isAdmin ? 'active' : ''}`}
                      onClick={() => void handleToggleAdmin(u.uid, u.isAdmin)}
                      disabled={u.uid === user?.uid}
                      title={u.uid === user?.uid ? 'Du kan inte ändra din egen admin-status' : ''}
                    >
                      {u.isAdmin ? 'Admin' : 'Användare'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {user && (
          <>
            <hr className="settings-divider" />
            <button
              className="settings-logout-btn"
              onClick={() => void handleLogout()}
            >
              Logga ut ({user.displayName || user.email || 'användare'})
            </button>
          </>
        )}
      </div>
    </div>
  );
};
