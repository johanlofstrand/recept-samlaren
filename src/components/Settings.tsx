import { useState, useMemo } from 'react';
import type { User } from 'firebase/auth';
import type { UserSettings } from '../types/Settings';
import './Settings.css';

interface SettingsProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
  user: User | null;
  onSignOut: () => Promise<void>;
  onClose: () => void;
  shoppingListText: string;
}

export const Settings = ({
  settings,
  onSettingsChange,
  user,
  onSignOut,
  onClose,
  shoppingListText,
}: SettingsProps) => {
  const [phoneNumber, setPhoneNumber] = useState(settings.phoneNumber);
  const [defaultServings, setDefaultServings] = useState(settings.defaultServings);

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
