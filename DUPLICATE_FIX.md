# Copro Duplicate Prevention Fix

## Problem
The system was inserting duplicate copropriete records (2 lines per copro) due to:
1. **Race condition**: Check-then-insert pattern in `synchroCopro.js`
2. **No unique constraint**: MongoDB had no unique index on `idVilogi`
3. **Concurrent execution**: Possible parallel sync runs creating duplicates

## Solution

### 1. Database Level Protection
- **Added unique index** on `idVilogi` field
- Prevents duplicates at database level
- Sparse index allows documents without `idVilogi`

### 2. Atomic Upsert Operations
Replaced:
```javascript
let findCopro = await coproService.detailsCoproprieteByidVilogi(copro.id)
if (findCopro) {
  await coproService.editCopropriete(findCopro._id, data)
} else {
  await coproService.addCopropriete(data)
}
```

With atomic upsert:
```javascript
await coproprieteCollection.updateOne(
  { idVilogi: copro.id },
  { 
    $set: data,
    $setOnInsert: { createdAt: new Date() }
  },
  { upsert: true }
);
```

### 3. Cleanup Script
`src/utils/fixDuplicateCopros.js`:
- Removes existing duplicates
- Keeps most recently updated record
- Creates unique index
- Verifies cleanup success

## Running the Fix

### One-time cleanup (already done):
```bash
cd server
node src/utils/fixDuplicateCopros.js
```

### Verify no duplicates:
```bash
node -e "
const MongoDB = require('./src/utils/mongodb');
(async () => {
  await MongoDB.connectToDatabase();
  const coproprieteCollection = MongoDB.getCollection('copropriete');
  
  const duplicates = await coproprieteCollection.aggregate([
    { \$match: { idVilogi: { \$exists: true, \$ne: null } } },
    { \$group: { _id: '\$idVilogi', count: { \$sum: 1 } }},
    { \$match: { count: { \$gt: 1 } } }
  ]).toArray();
  
  console.log('Duplicates:', duplicates.length);
  process.exit(0);
})();
"
```

## Benefits

1. **Reliability**: No more duplicate records
2. **Performance**: Single atomic operation vs check-then-write
3. **Safety**: Database constraint prevents duplicates even if code fails
4. **Idempotent**: Sync can run multiple times safely

## Technical Details

- **Unique Index**: `{ idVilogi: 1 }` with `sparse: true`
- **Upsert**: Atomic find-and-update-or-insert
- **Error Handling**: Graceful handling of duplicate key errors (11000)
- **Timestamps**: Maintains `createdAt` (insert only) and `updatedAt` (always)

## Files Modified

- `server/src/cron/synchroCopro.js` - Replaced check-then-write with upsert
- `server/src/utils/fixDuplicateCopros.js` - Cleanup script (new)
- `DUPLICATE_FIX.md` - This documentation (new)

## Verification

After fix:
- ✅ 176 copros → 88 copros (removed 88 duplicates)
- ✅ Unique index created on `idVilogi`
- ✅ 0 duplicates remaining
- ✅ Sync process now uses atomic upsert
