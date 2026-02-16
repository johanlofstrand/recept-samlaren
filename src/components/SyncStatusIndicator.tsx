import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import CheckIcon from '@mui/icons-material/Check';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import type { SyncStatus } from '../contexts/RecipeContext';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
}

const STATUS_CONFIG: Record<
  SyncStatus,
  {
    icon: React.ReactNode;
    label: string;
    color: string;
  }
> = {
  online: {
    icon: <CheckIcon sx={{ fontSize: 14 }} />,
    label: 'Synkad med molnet',
    color: '#27ae60',
  },
  syncing: {
    icon: null,
    label: 'Synkar...',
    color: '#f39c12',
  },
  offline: {
    icon: <WarningAmberIcon sx={{ fontSize: 14 }} />,
    label: 'Offline - ändringar sparas lokalt',
    color: '#95a5a6',
  },
  error: {
    icon: <ErrorIcon sx={{ fontSize: 14 }} />,
    label: 'Synkfel - försöker igen',
    color: '#e74c3c',
  },
};

export const SyncStatusIndicator = ({ status }: SyncStatusIndicatorProps) => {
  const config = STATUS_CONFIG[status];

  return (
    <Tooltip title={config.label}>
      {status === 'syncing' ? (
        <CircularProgress size={24} sx={{ color: config.color }} />
      ) : (
        <Avatar
          sx={{
            width: 24,
            height: 24,
            bgcolor: config.color,
            cursor: 'help',
          }}
        >
          {config.icon}
        </Avatar>
      )}
    </Tooltip>
  );
};
