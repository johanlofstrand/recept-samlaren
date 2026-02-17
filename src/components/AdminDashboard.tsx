import { useState, useEffect, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Collapse from '@mui/material/Collapse';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import { adminService, type UserStats } from '../services/adminService';
import type { UserRole } from '../types/Role';

interface AdminDashboardProps {
  onClose: () => void;
  currentUserId: string;
}

function formatDate(date: Date | null): string {
  if (!date) return '–';
  return date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysSince(date: Date | null): string {
  if (!date) return '–';
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Idag';
  if (days === 1) return 'Igår';
  if (days < 7) return `${days} dagar sedan`;
  if (days < 30) return `${Math.floor(days / 7)} veckor sedan`;
  if (days < 365) return `${Math.floor(days / 30)} månader sedan`;
  return `${Math.floor(days / 365)} år sedan`;
}

function RoleIcon({ role }: { role: UserRole }) {
  switch (role) {
    case 'admin': return <AdminPanelSettingsIcon fontSize="small" />;
    case 'editor': return <EditIcon fontSize="small" />;
    default: return <PersonIcon fontSize="small" />;
  }
}

function roleAvatarColor(role: UserRole): string {
  switch (role) {
    case 'admin': return 'primary.main';
    case 'editor': return 'success.main';
    default: return 'grey.400';
  }
}

export const AdminDashboard = ({ onClose, currentUserId }: AdminDashboardProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    adminService.getUserStats().then(
      (stats) => {
        setUsers(stats.sort((a, b) => b.recipeCount - a.recipeCount));
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load admin stats:', err);
        setError('Kunde inte ladda statistik.');
        setLoading(false);
      }
    );
  }, []);

  const totals = useMemo(() => {
    const totalRecipes = users.reduce((sum, u) => sum + u.recipeCount, 0);
    const totalFavorites = users.reduce((sum, u) => sum + u.favoriteCount, 0);
    const totalAdmins = users.filter((u) => u.role === 'admin').length;
    const totalEditors = users.filter((u) => u.role === 'editor').length;
    const totalViewers = users.filter((u) => u.role === 'viewer').length;
    const allCategories: Record<string, number> = {};
    users.forEach((u) => {
      Object.entries(u.categories).forEach(([cat, count]) => {
        allCategories[cat] = (allCategories[cat] || 0) + count;
      });
    });
    return { totalRecipes, totalFavorites, totalAdmins, totalEditors, totalViewers, totalUsers: users.length, allCategories };
  }, [users]);

  const handleSetRole = async (uid: string, newRole: UserRole) => {
    if (uid === currentUserId) return;
    try {
      await adminService.setUserRole(uid, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error('Failed to update user role:', err);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminPanelSettingsIcon color="primary" />
          <Typography variant="h6" component="span">Admin</Typography>
        </Box>
        <IconButton onClick={onClose} title="Stäng">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress size={40} />
            <Typography color="text.secondary" sx={{ mt: 2 }}>Laddar statistik...</Typography>
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ textAlign: 'center', py: 4 }}>{error}</Typography>
        ) : (
          <>
            {/* Summary cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 3 }}>
              <Paper
                elevation={0}
                sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white', borderRadius: 3 }}
              >
                <PeopleIcon sx={{ fontSize: 28, mb: 0.5, opacity: 0.85 }} />
                <Typography variant="h5" fontWeight={700}>{totals.totalUsers}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>Användare</Typography>
              </Paper>
              <Paper
                elevation={0}
                sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white', borderRadius: 3 }}
              >
                <RestaurantIcon sx={{ fontSize: 28, mb: 0.5, opacity: 0.85 }} />
                <Typography variant="h5" fontWeight={700}>{totals.totalRecipes}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>Recept totalt</Typography>
              </Paper>
              <Paper
                elevation={0}
                sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'white', borderRadius: 3 }}
              >
                <StarIcon sx={{ fontSize: 28, mb: 0.5, opacity: 0.85 }} />
                <Typography variant="h5" fontWeight={700}>{totals.totalFavorites}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>Favoriter</Typography>
              </Paper>
              <Paper
                elevation={0}
                sx={{ p: 2, textAlign: 'center', bgcolor: 'info.main', color: 'white', borderRadius: 3 }}
              >
                <AdminPanelSettingsIcon sx={{ fontSize: 28, mb: 0.5, opacity: 0.85 }} />
                <Typography variant="h5" fontWeight={700}>
                  {totals.totalAdmins} / {totals.totalEditors} / {totals.totalViewers}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>Admin / Redaktör / Läsare</Typography>
              </Paper>
            </Box>

            {/* Top categories */}
            {Object.keys(totals.allCategories).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Populära kategorier</Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {Object.entries(totals.allCategories)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([cat, count]) => (
                      <Chip
                        key={cat}
                        label={`${cat} (${count})`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                </Stack>
              </Box>
            )}

            <Divider sx={{ mb: 2 }} />

            {/* User list */}
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              Användare ({users.length})
            </Typography>

            <Stack spacing={1.5}>
              {users.map((u) => {
                const isExpanded = expandedUser === u.uid;
                const isCurrentUser = u.uid === currentUserId;

                return (
                  <Paper
                    key={u.uid}
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      overflow: 'hidden',
                      borderColor: isCurrentUser ? 'primary.main' : 'divider',
                      borderWidth: isCurrentUser ? 2 : 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => setExpandedUser(isExpanded ? null : u.uid)}
                    >
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: roleAvatarColor(u.role),
                          fontSize: '0.9rem',
                        }}
                      >
                        <RoleIcon role={u.role} />
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Typography fontWeight={600} fontSize="0.9rem" noWrap>
                            {u.displayName || 'Okänd'}
                          </Typography>
                          {isCurrentUser && (
                            <Chip label="Du" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {u.email}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={0.75} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                        <Chip
                          icon={<RestaurantIcon />}
                          label={u.recipeCount}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<StarIcon />}
                          label={u.favoriteCount}
                          size="small"
                          variant="outlined"
                          color="warning"
                        />
                      </Stack>

                      <ExpandMoreIcon
                        sx={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                          color: 'text.secondary',
                        }}
                      />
                    </Box>

                    <Collapse in={isExpanded}>
                      <Divider />
                      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                        {/* Stats row for mobile (shown inline above for desktop) */}
                        <Stack
                          direction="row"
                          spacing={0.75}
                          sx={{ mb: 1.5, display: { xs: 'flex', sm: 'none' } }}
                        >
                          <Chip icon={<RestaurantIcon />} label={`${u.recipeCount} recept`} size="small" variant="outlined" />
                          <Chip icon={<StarIcon />} label={`${u.favoriteCount} favoriter`} size="small" variant="outlined" color="warning" />
                        </Stack>

                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 1,
                            mb: 1.5,
                          }}
                        >
                          <Box>
                            <Typography variant="caption" color="text.secondary">Roll</Typography>
                            <Box sx={{ mt: 0.25 }}>
                              <Select
                                value={u.role}
                                size="small"
                                disabled={isCurrentUser}
                                onChange={(e) => void handleSetRole(u.uid, e.target.value as UserRole)}
                                sx={{ minWidth: 120, fontSize: '0.85rem' }}
                              >
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="editor">Redaktör</MenuItem>
                                <MenuItem value="viewer">Läsare</MenuItem>
                              </Select>
                            </Box>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Recept</Typography>
                            <Typography fontWeight={600} fontSize="0.9rem">{u.recipeCount}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Senaste recept</Typography>
                            <Typography fontSize="0.85rem">{daysSince(u.lastRecipeDate)}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Medlem sedan</Typography>
                            <Typography fontSize="0.85rem">{formatDate(u.firstRecipeDate)}</Typography>
                          </Box>
                        </Box>

                        {Object.keys(u.categories).length > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                              Kategorier
                            </Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {Object.entries(u.categories)
                                .sort(([, a], [, b]) => b - a)
                                .map(([cat, count]) => (
                                  <Chip
                                    key={cat}
                                    label={`${cat} (${count})`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.75rem', height: 24 }}
                                  />
                                ))}
                            </Stack>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </Paper>
                );
              })}
            </Stack>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
