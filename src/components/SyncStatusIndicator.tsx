import type { SyncStatus } from '../contexts/RecipeContext';
import './SyncStatusIndicator.css';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
}

const STATUS_CONFIG: Record<
  SyncStatus,
  {
    icon: string;
    label: string;
    className: string;
  }
> = {
  online: {
    icon: '✓',
    label: 'Synkad med molnet',
    className: 'status-online',
  },
  syncing: {
    icon: '↻',
    label: 'Synkar...',
    className: 'status-syncing',
  },
  offline: {
    icon: '⚠',
    label: 'Offline - ändringar sparas lokalt',
    className: 'status-offline',
  },
  error: {
    icon: '✕',
    label: 'Synkfel - försöker igen',
    className: 'status-error',
  },
};

export const SyncStatusIndicator = ({ status }: SyncStatusIndicatorProps) => {
  const config = STATUS_CONFIG[status];

  return (
    <div className={`sync-status-indicator ${config.className}`} title={config.label}>
      <span className="sync-icon">{config.icon}</span>
    </div>
  );
};
