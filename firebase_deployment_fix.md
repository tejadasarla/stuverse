# Firebase Deployment Checklist for Vercel

If your application works locally but fails on Vercel with errors like `auth/invalid-credential` or `unauthorized-domain`, follow this checklist.

## 1. Firebase Console: Authorized Domains
Firebase Authentication will block sign-in requests from domains it doesn't recognize.
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Go to **Authentication** > **Settings** > **Authorized domains**.
4. Click **Add domain** and enter your Vercel deployment URL (e.g., `your-app-name.vercel.app`).
5. **Important:** Also add your custom domain if you have one.

## 2. Vercel Environment Variables
Vite bundles environment variables at **build time**. If they are missing in Vercel, the app will initialize with `undefined` values.
1. Go to your **Vercel Dashboard** > **Project Settings** > **Environment Variables**.
2. Add the following keys from your local `frontend/.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_API_URL` (Set this to your deployed backend URL, e.g., `https://your-backend.vercel.app`)
3. **Re-deploy** your application so Vite can bake these variables into the build.

## 3. Backend Environment Variables (If using Backend)
If your backend is also on Vercel, ensure these are in the backend project settings:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`

## 4. Firestore Security Rules
If you are getting "Permission Denied" errors *after* logging in, you need to update your Firestore rules.
1. Go to **Cloud Firestore** > **Rules**.
2. Use this for testing (allows access for ALL logged-in users):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## 5. Storage Security Rules
If profile images aren't loading/uploading, check **Storage** > **Rules**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
