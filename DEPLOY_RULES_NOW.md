# 🔥 DEPLOY FIRESTORE RULES - Quick Guide

Your app won't work until you deploy Firestore security rules. Here's the fastest way:

## ⚡ Quick Fix (2 minutes)

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/
2. Click on your project: **meet-f6656**

### Step 2: Navigate to Firestore Rules
1. In the left sidebar, click **Firestore Database**
2. Click the **Rules** tab at the top

### Step 3: Deploy Test Rules (For Testing)
Copy and paste this into the rules editor:

\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
\`\`\`

### Step 4: Publish
1. Click the blue **Publish** button
2. Wait 30 seconds for rules to propagate
3. Refresh your app

## ✅ Verify It Works

After publishing:
1. Refresh your browser
2. Try creating a meeting
3. Try joining a meeting

If it works, you can later deploy the production rules from `firestore.rules` which have better security.

## 🔒 Production Rules (After Testing)

Once everything works with test rules, deploy the production rules:

1. Go back to Firebase Console → Firestore Database → Rules
2. Copy the contents of `firestore.rules` from your project
3. Paste and publish

Production rules are more secure and only allow:
- Meeting creators and participants to access their meetings
- Proper validation of data

## 🐛 Still Having Issues?

If you still see errors after deploying rules:
- Wait 1-2 minutes (rules take time to propagate)
- Clear browser cache and refresh
- Check browser console for new error messages
- Verify you're signed in to the app

## 📝 What Was Wrong?

The HTTP 400 errors you saw:
\`\`\`
Failed to load resource: the server responded with a status of 400
WebChannelConnection RPC 'Listen' stream transport errored
\`\`\`

These happen because Firestore **rejects all requests by default** until you deploy security rules. It's a safety feature to prevent unauthorized access.
