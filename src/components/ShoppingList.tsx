import { useState, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ShareIcon from '@mui/icons-material/Share';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LabelIcon from '@mui/icons-material/Label';
import CloseIcon from '@mui/icons-material/Close';
import { categorizeIngredient, type IngredientCategory } from '../utils/ingredientCategories';

export type GroupBy = 'recipe' | 'category';

interface ShoppingListItem {
  recipeId: string;
  recipeTitle: string;
  ingredientIndex: number;
  ingredient: string;
}

interface MergedItem {
  baseName: string;
  entries: ShoppingListItem[];
}

const UNITS = /^[\d.,/\s]*(tsk|msk|dl|cl|ml|l|kg|hg|g|st|krm|nypa|port|paket|burk|pkt|förp|knippe|klyfta|klyft|skiva|skivor)\.?\s+/i;
const LEADING_NUM = /^[\d.,/\s]+/;

function extractBaseName(ingredient: string): string {
  let name = ingredient.trim().toLowerCase();
  name = name.replace(UNITS, '');
  name = name.replace(LEADING_NUM, '');
  name = name.replace(/\s*\(.*?\)\s*/g, ' ');
  return name.trim();
}

interface ShoppingListProps {
  items: ShoppingListItem[];
  onToggle: (recipeId: string, ingredientIndex: number) => void;
  onClearChecked: () => void;
  onClose: () => void;
  ingredientChecks: Record<string, Record<number, boolean>>;
}

const STORAGE_KEY = 'recept-samlaren-shopping-group';

export const ShoppingList = ({
  items,
  onToggle,
  onClearChecked,
  onClose,
  ingredientChecks,
}: ShoppingListProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [groupBy, setGroupBy] = useState<GroupBy>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as GroupBy) || 'recipe';
  });

  const toggleGroupBy = () => {
    const newGroupBy: GroupBy = groupBy === 'recipe' ? 'category' : 'recipe';
    setGroupBy(newGroupBy);
    localStorage.setItem(STORAGE_KEY, newGroupBy);
  };

  const groupedItems = useMemo(() => {
    if (groupBy === 'recipe') {
      const groups = new Map<string, ShoppingListItem[]>();
      items.forEach((item) => {
        const key = item.recipeTitle;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(item);
      });
      return Array.from(groups.entries()).map(([title, groupItems]) => ({
        title,
        items: groupItems,
        merged: null as MergedItem[] | null,
      }));
    } else {
      const groups = new Map<IngredientCategory, ShoppingListItem[]>();
      items.forEach((item) => {
        const category = categorizeIngredient(item.ingredient);
        if (!groups.has(category)) groups.set(category, []);
        groups.get(category)!.push(item);
      });

      const categoryOrder: IngredientCategory[] = [
        'Grönsaker', 'Frukt', 'Kött', 'Fisk', 'Mejeri', 'Spannmål', 'Kryddor', 'Övrigt',
      ];

      return categoryOrder
        .filter((cat) => groups.has(cat))
        .map((category) => {
          const catItems = groups.get(category)!;
          const byBase = new Map<string, ShoppingListItem[]>();
          catItems.forEach((item) => {
            const base = extractBaseName(item.ingredient);
            if (!byBase.has(base)) byBase.set(base, []);
            byBase.get(base)!.push(item);
          });
          const merged: MergedItem[] = Array.from(byBase.entries()).map(([baseName, entries]) => ({
            baseName,
            entries,
          }));
          return { title: category, items: catItems, merged };
        });
    }
  }, [items, groupBy]);

  const handleClearChecked = () => {
    if (
      confirm(
        'Vill du ta bort alla avbockade ingredienser från inköpslistan? Detta går inte att ångra.'
      )
    ) {
      onClearChecked();
    }
  };

  const handleShare = async () => {
    const text = generateShareText();

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Inköpslista - Receptsamlaren',
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Inköpslistan har kopierats till urklipp!');
      }
    } catch (error) {
      console.error('Failed to share:', error);
      try {
        await navigator.clipboard.writeText(text);
        alert('Inköpslistan har kopierats till urklipp!');
      } catch (clipboardError) {
        console.error('Failed to copy to clipboard:', clipboardError);
        alert('Kunde inte dela eller kopiera inköpslistan.');
      }
    }
  };

  const generateShareText = (): string => {
    let text = 'Inköpslista - Receptsamlaren\n\n';

    groupedItems.forEach((group) => {
      text += `${group.title}\n`;
      group.items.forEach((item) => {
        text += `• ${item.ingredient}\n`;
      });
      text += '\n';
    });

    return text;
  };

  const hasCheckedItems = useMemo(() => {
    return Object.values(ingredientChecks).some((recipeChecks) =>
      Object.values(recipeChecks).some((checked) => checked)
    );
  }, [ingredientChecks]);

  const renderItem = (item: ShoppingListItem) => (
    <ListItem
      key={`${item.recipeId}-${item.ingredientIndex}`}
      secondaryAction={
        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={() => onToggle(item.recipeId, item.ingredientIndex)}
        >
          Har hemma
        </Button>
      }
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <ListItemText
        primary={item.ingredient}
        secondary={item.recipeTitle}
        primaryTypographyProps={{ fontWeight: 500 }}
        secondaryTypographyProps={{ variant: 'caption' }}
      />
    </ListItem>
  );

  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Typography variant="h6" component="span">Inköpslista</Typography>
        <Box>
          {hasCheckedItems && (
            <IconButton onClick={handleClearChecked} title="Rensa avbockade" color="error">
              <DeleteSweepIcon />
            </IconButton>
          )}
          <IconButton onClick={() => void handleShare()} title="Dela inköpslista">
            <ShareIcon />
          </IconButton>
          <IconButton
            onClick={toggleGroupBy}
            title={`Gruppera per ${groupBy === 'recipe' ? 'kategori' : 'recept'}`}
          >
            {groupBy === 'recipe' ? <ListAltIcon /> : <LabelIcon />}
          </IconButton>
          <IconButton onClick={onClose} title="Stäng">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {items.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Allt är ikryssat. Du har allt hemma.
          </Typography>
        ) : (
          groupedItems.map((group) => (
            <Box key={group.title} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1, pb: 1, borderBottom: 2, borderColor: 'primary.main' }}>
                {group.title}
              </Typography>
              {group.merged ? (
                <List disablePadding>
                  {group.merged.map((mergedItem) =>
                    mergedItem.entries.length === 1 ? (
                      renderItem(mergedItem.entries[0])
                    ) : (
                      <Box
                        key={mergedItem.baseName}
                        sx={{ bgcolor: 'grey.50', borderRadius: 2, mb: 1, overflow: 'hidden', border: 1, borderColor: 'divider' }}
                      >
                        {mergedItem.entries.map((entry, idx) => (
                          <Box key={`${entry.recipeId}-${entry.ingredientIndex}`}>
                            {idx > 0 && <Divider sx={{ borderStyle: 'dashed' }} />}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, gap: 1.5 }}>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography fontWeight={500}>{entry.ingredient}</Typography>
                                <Typography variant="caption" color="text.secondary">{entry.recipeTitle}</Typography>
                              </Box>
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={() => onToggle(entry.recipeId, entry.ingredientIndex)}
                              >
                                Har hemma
                              </Button>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )
                  )}
                </List>
              ) : (
                <List disablePadding>
                  {group.items.map((item) => renderItem(item))}
                </List>
              )}
            </Box>
          ))
        )}
      </DialogContent>
    </Dialog>
  );
};
