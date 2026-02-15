# 🍳 Receptsamlaren

En modern webbapplikation för att samla och organisera dina favoritrecept med en unik bläddringsupplevelse.

## Funktioner

- ✨ Lägga till, redigera och ta bort recept
- 📷 Lägg till bilder till dina recept
- 🔍 Sök bland dina recept
- 📝 Detaljerad receptvy med ingredienser och instruktioner
- ☁️ **Firebase Firestore** - Valfri molnsynkning (free tier)
- 💾 **localStorage fallback** - Fungerar utan internet
- 📱 Optimerad för mobila webbvyer och appar
- 🔄 Synkas mellan alla enheter (med Firebase)
- 🎯 Unik navigering:
  - **↑/↓** - Bläddra mellan alla recept
  - **←/→** - Bläddra mellan recept i samma kategori
  - Swipe-stöd på mobila enheter

## Design

Applikationen använder en fullscreen-design med fokus på:
- Ren, minimalistisk layout utan distraktioner
- Vit bakgrund för bästa läsbarhet
- Smooth animationer och övergångar
- Touch-optimerad för mobil användning
- Optimerad för webbvyer i appar

## Teknisk stack

- **React** - UI-bibliotek
- **TypeScript** - Typsäkerhet
- **Vite** - Snabb build-tool
- **pnpm** - Pakethanterare
- **Firebase Firestore** - NoSQL-databas (valfritt)
- **CSS3** - Modern styling med animations

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

### Firebase Setup (Valfritt)

Applikationen fungerar utan Firebase (använder localStorage). För molnsynkning:

1. Se [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) för detaljerade instruktioner
2. Skapa `.env.local` med dina Firebase credentials
3. Starta om dev-servern

**Fördelar med Firebase:**
- ☁️ Synkas mellan alla enheter
- 💾 Backup i molnet
- 🔄 Real-time uppdateringar
- 🆓 Gratis (inom Firebase free tier)

### Bygga för produktion

```bash
pnpm build
```

### Förhandsgranska produktionsbygget

```bash
pnpm preview
```

## Navigering

### Desktop
- Använd piltangenter (↑ ↓ ← →) för att navigera
- Klicka på navigationshints för att byta recept
- Klicka på 🔍 för att söka

### Mobil
- Swipe upp/ner för att bläddra mellan recept
- Tryck på navigationshints för vänster/höger navigering
- Tryck på ✏️ för att redigera
- Tryck på 🗑️ för att ta bort

## Projektstruktur

```
src/
├── components/        # React-komponenter
│   ├── RecipeSwiper.tsx   # Huvudkomponent för navigation
│   ├── RecipeForm.tsx     # Formulär för recept
│   └── ...
├── contexts/          # React Context för state management
│   └── RecipeContext.tsx
├── types/             # TypeScript-typer
│   └── Recipe.ts
├── App.tsx            # Huvudkomponent
└── main.tsx          # Ingångspunkt
```

## Användning

1. Klicka på "+" för att lägga till ett recept
2. Fyll i receptets detaljer, ingredienser och instruktioner
3. Använd piltangenter eller swipe för att navigera mellan recept
4. Sök efter recept med sökikonen
5. Redigera eller ta bort recept direkt från receptvyn

## Licens

MIT
