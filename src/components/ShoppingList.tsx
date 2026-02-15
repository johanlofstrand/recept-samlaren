import { useState, useMemo } from 'react';
import { categorizeIngredient, type IngredientCategory } from '../utils/ingredientCategories';
import './ShoppingList.css';

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
      // Fallback: try clipboard
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

  return (
    <div className="shopping-overlay" onClick={onClose}>
      <div className="shopping-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shopping-header">
          <h2>Inköpslista</h2>
          <div className="shopping-header-actions">
            {hasCheckedItems && (
              <button
                className="header-btn clear-checked"
                onClick={handleClearChecked}
                title="Rensa avbockade"
              >
                🗑️
              </button>
            )}
            <button
              className="header-btn share"
              onClick={handleShare}
              title="Dela inköpslista"
            >
              📤
            </button>
            <button
              className="header-btn group-toggle"
              onClick={toggleGroupBy}
              title={`Gruppera per ${groupBy === 'recipe' ? 'kategori' : 'recept'}`}
            >
              {groupBy === 'recipe' ? '📝' : '🏷️'}
            </button>
            <button className="header-btn close" onClick={onClose} title="Stäng">
              ✕
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="shopping-empty">Allt är ikryssat. Du har allt hemma.</p>
        ) : (
          <div className="shopping-content">
            {groupedItems.map((group) => (
              <div key={group.title} className="shopping-group">
                <h3 className="group-title">{group.title}</h3>
                {group.merged ? (
                  <ul className="shopping-items">
                    {group.merged.map((mergedItem) => (
                      <li key={mergedItem.baseName} className={mergedItem.entries.length > 1 ? 'merged-item' : ''}>
                        {mergedItem.entries.length === 1 ? (
                          <>
                            <div className="item-info">
                              <div className="shopping-ingredient">{mergedItem.entries[0].ingredient}</div>
                              <div className="shopping-recipe">{mergedItem.entries[0].recipeTitle}</div>
                            </div>
                            <button
                              className="shopping-check-btn"
                              onClick={() => onToggle(mergedItem.entries[0].recipeId, mergedItem.entries[0].ingredientIndex)}
                            >
                              Har hemma
                            </button>
                          </>
                        ) : (
                          <div className="merged-info">
                            {mergedItem.entries.map((entry) => (
                              <div key={`${entry.recipeId}-${entry.ingredientIndex}`} className="merged-entry">
                                <div className="item-info">
                                  <div className="shopping-ingredient">{entry.ingredient}</div>
                                  <div className="shopping-recipe">{entry.recipeTitle}</div>
                                </div>
                                <button
                                  className="shopping-check-btn"
                                  onClick={() => onToggle(entry.recipeId, entry.ingredientIndex)}
                                >
                                  Har hemma
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="shopping-items">
                    {group.items.map((item) => (
                      <li key={`${item.recipeId}-${item.ingredientIndex}`}>
                        <div className="item-info">
                          <div className="shopping-ingredient">{item.ingredient}</div>
                        </div>
                        <button
                          className="shopping-check-btn"
                          onClick={() => onToggle(item.recipeId, item.ingredientIndex)}
                        >
                          Har hemma
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
