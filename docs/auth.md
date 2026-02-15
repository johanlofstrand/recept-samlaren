# Auth Setup & Troubleshooting (Firebase + GitHub Pages)

Denna guide sammanfattar hur auth är uppsatt i projektet och vad som behövs för att login ska fungera stabilt i både localhost och produktion.

## Översikt

- Appen hostas på GitHub Pages: `https://johanlofstrand.github.io/recept-samlaren/`
- Firebase används för:
  - Authentication (Google Sign-In)
  - Firestore
  - Security Rules
- Recept är knutna till användare via `ownerId` (Firebase `uid`).

## Viktigt koncept

Även om frontend hostas på GitHub Pages använder Firebase Auth en redirect-handler under:

- `https://<project>.firebaseapp.com/__/auth/handler`

Det betyder att Firebase Hosting måste vara initierat/deployat i projektet (minst en gång), annars kan auth flödet brytas.

## 1) Firebase Console-inställningar

### Authentication

1. Gå till **Build -> Authentication**
2. Klicka **Get started** (om det behövs)
3. Under **Sign-in method**:
   - Aktivera **Google**
   - Välj support-email

### Authorized domains

I **Authentication -> Settings -> Authorized domains**, säkerställ att följande domäner finns:

- `localhost`
- `127.0.0.1`
- `johanlofstrand.github.io`
- `recept-samlaren-487508.firebaseapp.com`

## 2) Firebase CLI (minimum)

Installera CLI:

```bash
npm install -g firebase-tools
```

Logga in:

```bash
firebase login
```

Initiera projekt mot existerande Firebase-projekt:

```bash
firebase init
```

Välj:

- `Use an existing project`
- projekt: `recept-samlaren-487508`
- inkludera `Hosting`
- när du får `File dist/index.html already exists. Overwrite?` -> välj `N`
- `Configure as single-page app?` -> `No`
- `Set up automatic builds/deploys with GitHub?` -> `No` (repo har redan GitHub Actions)

Deploy Hosting (viktigt för auth helper-endpoints):

```bash
firebase deploy --only hosting
```

Deploy Firestore rules (om rules ändras):

```bash
firebase deploy --only firestore:rules
```

## 3) Verifiera auth helper endpoint

Kontrollera att denna URL inte returnerar 404:

- `https://recept-samlaren-487508.firebaseapp.com/__/firebase/init.json`

Om den ger 404:

- Hosting är inte korrekt deployat/aktiverat än.

## 4) Lokalt testflöde

1. Starta app:

```bash
pnpm dev
```

2. Öppna:

- `http://localhost:5173/recept-samlaren/`

3. Klicka **Fortsätt med Google**
4. Efter tillåt i Google ska du returnera till appen och vara inloggad.

## 5) Vanliga fel och lösningar

### A) Blank vit sida på `__/auth/handler`

Orsak:

- Auth callback-sida öppnas separat, eller hosting helper saknas.

Lösning:

- Säkerställ hosting deploy (`firebase deploy --only hosting`)
- Stäng handlerfliken och gå tillbaka till appfliken
- Hårduppdatera (`Cmd+Shift+R`)

### B) Login-loop (kommer tillbaka till "Fortsätt med Google")

Checklista:

1. Google provider är enabled
2. Alla authorized domains finns
3. `__/firebase/init.json` svarar OK (inte 404)
4. Testa i vanlig browser (ej inbyggd webview)
5. Rensa site-data för:
   - `localhost:5173`
   - `recept-samlaren-487508.firebaseapp.com`

### C) Firestore permission denied

Orsak:

- Dokument saknar `ownerId` eller rules kräver `ownerId == request.auth.uid`.

Lösning:

- Nya dokument får `ownerId` automatiskt i appen.
- Gamla dokument kan behöva migreras manuellt med korrekt `ownerId`.

## 6) Nuvarande auth-implementation i koden

- Firebase init + auth: `src/config/firebase.ts`
- Auth API: `src/services/authService.ts`
- Auth state + app state: `src/contexts/RecipeContext.tsx`
- Login UI: `src/App.tsx` + `src/App.css`
- Firestore rules: `firestore.rules`

## 7) Driftrekommendationer

- Behåll GitHub Pages för frontend.
- Behåll Firebase Hosting aktiverat för auth helper-endpoints.
- Testa auth i både localhost och produktions-URL efter ändringar.
- Vid auth-förändringar: deploya rules och verifiera domains igen.
