# Firebase Setup Guide

Följ denna guide för att aktivera Firebase och molnsynkning av recept.

## Steg 1: Skapa Firebase-projekt

1. Gå till [Firebase Console](https://console.firebase.google.com/)
2. Ditt projekt heter redan: **recept-samlaren-487508**
3. Klicka på projektet för att öppna det

## Steg 2: Lägg till en Web App

1. I Firebase Console, klicka på "⚙️ Settings" (uppe till vänster)
2. Gå till "Project settings"
3. Scrolla ner till "Your apps"
4. Klicka på "Add app" knappen
5. Välj ikonen för **Web** (`</>`)
6. Ge appen ett smeknamn: **Receptsamlaren**
7. **VIKTIGT:** Kryssa INTE i "Firebase Hosting" (vi använder GitHub Pages)
8. Klicka "Register app"

## Steg 3: Kopiera Firebase Config

Efter registrering får du en config som ser ut så här:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "recept-samlaren-487508.firebaseapp.com",
  projectId: "recept-samlaren-487508",
  storageBucket: "recept-samlaren-487508.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## Steg 4: Aktivera Firestore Database

1. I Firebase Console-menyn till vänster, klicka på "Build" → "Firestore Database"
2. Klicka "Create database"
3. Välj **Production mode** (vi lägger till regler sen)
4. Välj en Cloud Firestore location (t.ex. `europe-west1` för Europa)
5. Klicka "Enable"

## Steg 5: Sätt upp Firestore Security Rules

1. När databasen är skapad, gå till fliken "Rules"
2. Ersätt innehållet med följande:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all users to read and write recipes
    // TODO: Add authentication later for better security
    match /recipes/{recipeId} {
      allow read, write: if true;
    }
  }
}
```

3. Klicka "Publish"

**OBS:** Detta tillåter alla att läsa och skriva. För produktion bör du lägga till autentisering!

## Steg 6: Skapa .env.local fil

1. Kopiera `.env.example` till `.env.local`:

```bash
cp .env.example .env.local
```

2. Öppna `.env.local` och fyll i dina Firebase-värden:

```bash
VITE_FIREBASE_API_KEY=din_api_key_här
VITE_FIREBASE_AUTH_DOMAIN=recept-samlaren-487508.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=recept-samlaren-487508
VITE_FIREBASE_STORAGE_BUCKET=recept-samlaren-487508.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=ditt_sender_id_här
VITE_FIREBASE_APP_ID=din_app_id_här
```

## Steg 7: Testa lokalt

1. Starta om dev-servern:

```bash
pnpm dev
```

2. Öppna http://localhost:5173
3. Du ska nu se ett litet ☁️ moln-ikon i headern - det betyder Firebase är aktivt!
4. Lägg till ett recept och kontrollera i Firebase Console under "Firestore Database" att det dyker upp

## Steg 8: Deploy till GitHub Pages med Firebase

För att GitHub Pages också ska använda Firebase behöver du:

1. Gå till ditt GitHub repo: https://github.com/johanlofstrand/recept-samlaren
2. Gå till "Settings" → "Secrets and variables" → "Actions"
3. Klicka "New repository secret"
4. Lägg till följande secrets (en i taget):

   - Name: `VITE_FIREBASE_API_KEY`, Value: `din_api_key`
   - Name: `VITE_FIREBASE_AUTH_DOMAIN`, Value: `recept-samlaren-487508.firebaseapp.com`
   - Name: `VITE_FIREBASE_PROJECT_ID`, Value: `recept-samlaren-487508`
   - Name: `VITE_FIREBASE_STORAGE_BUCKET`, Value: `recept-samlaren-487508.firebasestorage.app`
   - Name: `VITE_FIREBASE_MESSAGING_SENDER_ID`, Value: `ditt_sender_id`
   - Name: `VITE_FIREBASE_APP_ID`, Value: `din_app_id`

5. Pusha en ändring till main-branchen för att trigga en ny deployment

## Färdig! 🎉

Nu har du:
- ✅ Firebase Firestore aktiverat
- ✅ Molnsynkning mellan alla enheter
- ✅ Backup av alla recept
- ✅ Samma recept överallt (desktop, mobil, surfplatta)

## Felsökning

**Ser inte ☁️ i headern:**
- Kontrollera att `.env.local` finns och har rätt värden
- Starta om dev-servern
- Öppna Console i webbläsaren (F12) och kolla efter felmeddelanden

**"Firebase not initialized":**
- Kontrollera att alla environment variables är satta
- Kontrollera att Firestore är aktiverat i Firebase Console

**"Permission denied":**
- Kontrollera Firestore Security Rules
- Säkerställ att du har publicerat reglerna
