# 🍳 Receptsamlaren

En modern webbapplikation för att samla och organisera dina favoritrecept.

## Funktioner

- ✨ Lägga till, redigera och ta bort recept
- 📷 Lägg till bilder till dina recept
- 🔍 Sök bland dina recept
- 📝 Detaljerad receptvy med ingredienser och instruktioner
- 💾 Automatisk lagring i localStorage
- 📱 Responsiv design som fungerar på alla enheter

## Teknisk stack

- **React** - UI-bibliotek
- **TypeScript** - Typsäkerhet
- **Vite** - Snabb build-tool
- **pnpm** - Pakethanterare

## Kom igång

### Installation

```bash
pnpm install
```

### Utveckling

```bash
pnpm dev
```

Öppna [http://localhost:5173](http://localhost:5173) i din webbläsare.

### Bygga för produktion

```bash
pnpm build
```

### Förhandsgranska produktionsbygget

```bash
pnpm preview
```

## Projektstruktur

```
src/
├── components/        # React-komponenter
│   ├── RecipeCard.tsx
│   ├── RecipeDetail.tsx
│   ├── RecipeForm.tsx
│   └── RecipeList.tsx
├── contexts/          # React Context för state management
│   └── RecipeContext.tsx
├── types/             # TypeScript-typer
│   └── Recipe.ts
├── App.tsx            # Huvudkomponent
└── main.tsx          # Ingångspunkt
```

## Användning

1. Klicka på "Nytt recept" för att lägga till ett recept
2. Fyll i receptets detaljer, ingredienser och instruktioner
3. Klicka på ett recept för att se detaljerna
4. Redigera eller ta bort recept efter behov
5. Använd sökfältet för att hitta specifika recept

## Licens

MIT
