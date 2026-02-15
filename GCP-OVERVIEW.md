# GCP Overview - Receptsamlaren

## Project

| | |
|---|---|
| **GCP Project ID** | `recept-samlaren-487508` |
| **Region** | `europe-west1` (Belgium) |
| **Firebase Console** | https://console.firebase.google.com/project/recept-samlaren-487508 |

## Services Used

### Firebase Authentication
- **Provider:** Google OAuth
- **Sign-in flow:** Popup on localhost, redirect in production
- **Client code:** `src/services/authService.ts`

### Cloud Firestore

**Collections:**

**`/users/{userId}`**
```
email: string
displayName: string
isAdmin: boolean
```

**`/recipes/{recipeId}`**
```
ownerId: string           # User UID
title: string             # max 200 chars
description?: string      # max 2000 chars
ingredients: string[]     # max 100 items
instructions: string[]    # max 100 items
imageUrl?: string         # max 2000 chars
category?: string         # max 100 chars
sourceUrl?: string        # max 2000 chars
prepTime?: number         # minutes
cookTime?: number         # minutes
servings?: number
isFavorite: boolean
createdAt: Timestamp
updatedAt: Timestamp
```

**Security rules:** `firestore.rules`
- Users can only read/write own recipes
- Admin role checked via `get()` on `/users/{uid}`
- Seed admin: `johan.lofstrand@gmail.com`
- All recipe fields validated for type and size (max 15 fields per doc)

**Deploy rules:**
```bash
npx firebase deploy --only firestore:rules
```

### Cloud Functions

**Function:** `fetchRecipePage`
- **Endpoint:** `https://europe-west1-recept-samlaren-487508.cloudfunctions.net/fetchRecipePage?url=...`
- **Purpose:** Proxy for fetching recipe HTML from external sites (needed to parse JSON-LD)
- **Runtime:** Node.js 20
- **Memory:** 128 MB
- **Timeout:** 15s
- **Max instances:** 1
- **Rate limit:** 50 requests/day (in-memory counter)
- **Source:** `functions/src/index.ts`

**Deploy function:**
```bash
cd functions && npm run build && npm run deploy
```

### Firebase Hosting

Configured in `firebase.json` but **not actively used** - the app deploys to GitHub Pages instead via GitHub Actions.

```json
{
  "hosting": { "public": "dist" },
  "functions": { "source": "functions", "runtime": "nodejs20" },
  "firestore": { "rules": "firestore.rules" }
}
```

## Environment Variables

All defined in `.env.local` (git-ignored), template in `.env.example`:

| Variable | Source |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console > Project Settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console > Project Settings |
| `VITE_FIREBASE_PROJECT_ID` | `recept-samlaren-487508` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console > Project Settings |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console > Project Settings |
| `VITE_FIREBASE_APP_ID` | Firebase Console > Project Settings |

Same values configured as GitHub Secrets for CI/CD builds.

## CI/CD

**GitHub Actions:** `.github/workflows/deploy.yml`
- Triggers on push to `main`
- Builds with pnpm + Node.js 20
- Injects Firebase env vars from GitHub Secrets
- Deploys `dist/` to GitHub Pages

**Not in CI/CD** (manual):
- Firestore rules deploy
- Cloud Functions deploy

## Client-Side Services

| File | Purpose |
|---|---|
| `src/config/firebase.ts` | Initializes Firebase app, exports `db` and `auth` |
| `src/services/authService.ts` | Google OAuth sign-in/out, auth state listener |
| `src/services/recipeService.ts` | Firestore CRUD for recipes, with rate limiting |
| `src/services/adminService.ts` | User management, admin role checks |
| `src/services/recipeImportService.ts` | Calls Cloud Function, parses JSON-LD |
| `src/services/offlineQueueService.ts` | localStorage queue for offline operations |

## Dependencies

**Frontend** (`package.json`): `firebase: ^12.9.0`

**Functions** (`functions/package.json`): `firebase-admin: ^13.0.0`, `firebase-functions: ^6.3.0`

## Common Commands

```bash
# Deploy Firestore rules
npx firebase deploy --only firestore:rules

# Deploy Cloud Functions
cd functions && npm run build && npm run deploy

# Run functions locally
cd functions && npm run serve

# Deploy everything
npx firebase deploy
```
