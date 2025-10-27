# Firebase Setup Instructions

## Firestore Security Rules

Your app is experiencing permission errors because Firestore security rules need to be deployed. Follow these steps:

### Option 1: Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **meet-f6656**
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab
5. Copy the contents of `firestore.rules` from this project
6. Paste into the rules editor
7. Click **Publish**

### Option 2: Firebase CLI

1. Install Firebase CLI if you haven't:
   \`\`\`bash
   npm install -g firebase-tools
   \`\`\`

2. Login to Firebase:
   \`\`\`bash
   firebase login
   \`\`\`

3. Initialize Firebase in your project (if not already done):
   \`\`\`bash
   firebase init firestore
   \`\`\`
   - Select your existing project: **meet-f6656**
   - Accept the default `firestore.rules` file

4. Deploy the rules:
   \`\`\`bash
   firebase deploy --only firestore:rules
   \`\`\`

## What the Rules Do

The `firestore.rules` file allows:
- ✅ Authenticated users to read any meeting
- ✅ Authenticated users to create meetings (they become participants automatically)
- ✅ Meeting creators and participants to update meetings
- ✅ Meeting creators to delete meetings
- ✅ Participants to read and create transcripts in their meetings

## Troubleshooting

If you still see permission errors after deploying:
1. Wait 1-2 minutes for rules to propagate
2. Refresh your browser
3. Check the Firebase Console Rules tab to verify they're published
4. Make sure you're signed in to the app

## Current Error

You're seeing HTTP 400 errors like:
\`\`\`
Failed to load resource: the server responded with a status of 400
WebChannelConnection RPC 'Listen' stream transport errored
\`\`\`

This happens because Firestore is rejecting your queries due to missing or restrictive security rules. Once you deploy the rules above, these errors will be resolved.
