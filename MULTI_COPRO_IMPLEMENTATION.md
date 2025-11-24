# Multi-Copro Support Implementation

## Problem
1. **Duplicate users**: 31 duplicate user records with same email but different copros
2. **Single copro limitation**: Users could only be linked to ONE copro at a time
3. **Data integrity**: No unique constraint on email field allowed duplicates

## Solution

### 1. Database Schema Migration
**Before**:
```javascript
idCopro: { type: mongoose.Schema.Types.ObjectId, ref: 'Copropriete' }
email: String
```

**After**:
```javascript
idCopro: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Copropriete' }] // Array
email: { type: String, unique: true, sparse: true } // Unique constraint
```

### 2. Migration Script
`src/utils/migrateMultiCopro.js`:
- Finds duplicate emails (31 found)
- Merges duplicates into single record with array of copros
- Keeps most recently updated record
- Converts all single idCopro to arrays
- Creates unique index on email
- Validates data integrity

**Results**:
- ✅ Merged 31 duplicate users
- ✅ Deleted 31 duplicate records
- ✅ Converted 1,975 users to array format
- ✅ Created unique email index
- ✅ 0 duplicates remaining

### 3. Code Changes

#### person.js Model
- Changed `idCopro` to array type
- Added unique constraint to email
- Added helper methods:
  - `addCopro(coproId)` - Adds copro if not present
  - `removeCopro(coproId)` - Removes copro from array
  - `hasCopro(coproId)` - Checks if user has copro

#### synchroUsers.js
- **SynchoMongoDB**: Now adds copros to array instead of replacing
- **Duplicate prevention**: Warns if duplicates found (shouldn't happen)
- **Multi-copro awareness**: Checks if copro already in array before adding
- **validateAndCleanupOrphanedUsers**: 
  - Validates ALL copros in array
  - Removes invalid copros
  - Marks users inactive if NO active copros remain

#### personService.js
- **getPerson**: Returns `copros` array + `copro` (first) for backward compatibility
- **getAllPersonsWithCopro**: Updated aggregation pipeline to handle array lookup
- Both functions now support multiple copros per user

### 4. How It Works Now

#### User with multiple copros:
```javascript
{
  "_id": "...",
  "email": "user@example.com",
  "idCopro": [
    ObjectId("..."), // Copro A
    ObjectId("..."), // Copro B
    ObjectId("...")  // Copro C
  ],
  "copros": [ /* Array of copro details */ ]
}
```

#### Sync process:
1. User synced from Copro A → Added to `idCopro` array
2. Same user synced from Copro B → Copro B added to array (no duplicate user)
3. User data merged (keeps best values from all sources)
4. If user has ANY active copro → user remains active
5. If ALL copros inactive → user marked inactive

## Benefits

### Data Integrity
- ✅ No duplicate users (unique email constraint)
- ✅ Users properly linked to all their copros
- ✅ Automatic cleanup of invalid copro references

### Performance
- ✅ Fewer database records (removed 31 duplicates)
- ✅ Efficient array queries with MongoDB `$in` operator
- ✅ Aggregation pipelines optimize multi-copro lookups

### Reliability
- ✅ Atomic operations prevent race conditions
- ✅ Unique index prevents duplicates at DB level
- ✅ Sync is idempotent (can run multiple times safely)

## Running the Migration

### One-time migration (DONE):
```bash
cd server
node src/utils/migrateMultiCopro.js
```

### Verify no duplicates:
```bash
node -e "
const MongoDB = require('./src/utils/mongodb');
(async () => {
  await MongoDB.connectToDatabase();
  const personCollection = MongoDB.getCollection('person');
  
  const duplicates = await personCollection.aggregate([
    { \$match: { email: { \$exists: true, \$ne: null, \$ne: '' } } },
    { \$group: { _id: '\$email', count: { \$sum: 1 } }},
    { \$match: { count: { \$gt: 1 } } }
  ]).toArray();
  
  console.log('Duplicates:', duplicates.length);
  process.exit(0);
})();
"
```

## Backward Compatibility

To ensure smooth transition:
- `person.copro` still exists (first copro in array)
- `person.copros` contains all copros
- Queries work with both single ObjectId and arrays
- Existing API endpoints unchanged

## Files Modified

1. `server/src/models/person.js` - Schema + helper methods
2. `server/src/cron/synchroUsers.js` - Multi-copro sync logic
3. `server/src/services/personService.js` - Array-aware queries
4. `server/src/utils/migrateMultiCopro.js` - Migration script (new)
5. `MULTI_COPRO_IMPLEMENTATION.md` - This doc (new)

## Testing

```bash
# Check for duplicates
node -e "..."  # See above

# Test sync
npm start
# Sync will now add copros to arrays instead of creating duplicates
```

## Next Steps

1. ✅ Migration complete - no duplicates
2. ✅ Schema updated - array support
3. ✅ Sync updated - multi-copro aware
4. ⏳ Deploy to production
5. ⏳ Monitor sync logs for multi-copro users
6. ⏳ Update frontend to display multiple copros (if needed)
