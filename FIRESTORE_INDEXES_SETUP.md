# Firestore Indexes Setup Required

Your application needs composite indexes in Firebase Firestore to support the soft delete feature and meeting queries.

## Required Indexes

You need to create these composite indexes in the Firebase Console:

### 1. Past Meetings Index (isActive + isDeleted + createdAt)

**Collection:** `meetings`
**Fields:**
- `isActive` (Ascending)
- `isDeleted` (Ascending)
- `createdAt` (Descending)

**Direct Link:** 
https://console.firebase.google.com/v1/r/project/freedompark-ai/firestore/indexes?create_composite=Cktwcm9qZWN0cy9mcmVlZG9tcGFyay1haS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbWVldGluZ3MvaW5kZXhlcy9fEAEaDAoIaXNBY3RpdmUQARoNCglpc0RlbGV0ZWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC

### 2. Scheduled Meetings Index (isActive + isScheduled + isDeleted + scheduledFor)

**Collection:** `meetings`
**Fields:**
- `isActive` (Ascending)
- `isScheduled` (Ascending)
- `isDeleted` (Ascending)
- `scheduledFor` (Ascending)

**Direct Link:**
https://console.firebase.google.com/v1/r/project/freedompark-ai/firestore/indexes?create_composite=Cktwcm9qZWN0cy9mcmVlZG9tcGFyay1haS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbWVldGluZ3MvaW5kZXhlcy9fEAEaDAoIaXNBY3RpdmUQARoPCgtpc1NjaGVkdWxlZBABGg0KCWlzRGVsZXRlZBABGhAKDHNjaGVkdWxlZEZvchABGgwKCF9fbmFtZV9fEAE

### 3. Deleted Meetings Archive Index (isDeleted + deletedAt)

**Collection:** `meetings`
**Fields:**
- `isDeleted` (Ascending)
- `deletedAt` (Descending)

**Direct Link:**
https://console.firebase.google.com/v1/r/project/freedompark-ai/firestore/indexes?create_composite=Cktwcm9qZWN0cy9mcmVlZG9tcGFyay1haS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbWVldGluZ3MvaW5kZXhlcy9fEAEaDQoJaXNEZWxldGVkEAEaDQoJZGVsZXRlZEF0EAIaDAoIX19uYW1lX18QAg

## How to Create Indexes

1. Click on each direct link above (they will take you directly to the Firebase Console with the index pre-configured)
2. Click "Create Index" button
3. Wait for the index to build (usually takes a few minutes)
4. Repeat for all 3 indexes

## Alternative Method

If the direct links don't work:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: **freedompark-ai**
3. Navigate to **Firestore Database** > **Indexes** tab
4. Click **Create Index**
5. Manually configure each index with the fields listed above

## Why These Indexes Are Needed

- **Past Meetings Index**: Filters meetings by `isActive=false` and `isDeleted=false`, then orders by creation date
- **Scheduled Meetings Index**: Filters scheduled meetings that aren't deleted, ordered by scheduled time
- **Deleted Meetings Archive**: Shows only deleted meetings ordered by deletion date

Once these indexes are created, all meeting queries will work correctly without errors.
