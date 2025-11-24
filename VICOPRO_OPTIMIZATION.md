# ViCopro Collection Optimization

## Overview
Optimized the `synchroSuiviVieCopro.js` script by moving from an embedded `suiviCopro` Map field in the Copropriete collection to a dedicated `vicopro` collection.

## Benefits

### 1. **Performance Improvements**
- **Faster queries**: Indexed queries on a dedicated collection instead of scanning embedded documents
- **Efficient filtering**: Can query active/completed/cancelled entries separately
- **Better scalability**: Collection grows independently from copropriete data

### 2. **Data Management**
- **Cleaner separation**: Tracking data is separated from core copropriete data
- **Historical tracking**: Can maintain full history of all actions without bloating the copro document
- **Flexible status management**: Can mark entries as active, completed, or cancelled

### 3. **Code Maintainability**
- **Dedicated service layer**: `viCoproService.js` provides clear API for all vicopro operations
- **Better error handling**: Isolated error handling for tracking operations
- **Easier testing**: Can test tracking logic independently

## Changes Made

### 1. New Model: `vicopro.js`
Created a new Mongoose schema with the following fields:
- `idCopro`: String (indexed) - Reference to the copropriete
- `actionTitle`: String - Name of the action being tracked
- `dateCreation`: Date - When the entry was created
- `dateEcheance`: Date - Due date for the action
- `copro`: ObjectId - Reference to Copropriete document
- `status`: Enum ['active', 'completed', 'cancelled'] - Status of the entry
- `dateModification`: Date - Last modification date

**Indexes**: Compound index on `(idCopro, actionTitle, status)` for optimal query performance

### 2. New Service: `viCoproService.js`
Created service methods:
- `createViCopro()` - Create new tracking entry
- `findLatestByIdCoproAndAction()` - Get the latest entry for a specific action
- `hasFutureActiveEntry()` - Check if future active entry exists
- `findAllActiveByIdCopro()` - Get all active entries for a copro
- `updateViCoproStatus()` - Update entry status
- `deleteViCopro()` - Delete an entry

### 3. Updated Script: `synchroSuiviVieCopro.js`

#### Before:
```javascript
// Stored in copro document
await coproService.editCopropriete(
  coproData._id,
  { [`suiviCopro.${item.title}`]: formatDate(futureDate) }
);

// Checked in embedded Map
if (coproData.suiviCopro && coproData.suiviCopro.hasOwnProperty(item.title)) {
  const suiviDate = new Date(coproData.suiviCopro[item.title]);
  // ... verification logic
}
```

#### After:
```javascript
// Stored in dedicated collection
await viCoproService.createViCopro({
  idCopro: copro.name,
  actionTitle: item.title,
  dateCreation: today,
  dateEcheance: futureDate,
  copro: verifResult.coproData._id,
  status: 'active'
});

// Checked in vicopro collection with optimized queries
const hasFutureEntry = await viCoproService.hasFutureActiveEntry(copro, item.title);
const latestEntry = await viCoproService.findLatestByIdCoproAndAction(copro, item.title);
```

## Migration Considerations

### Data Migration (Optional)
If you need to migrate existing `suiviCopro` data from the Copropriete collection to the new vicopro collection, you can create a migration script:

```javascript
const Copropriete = require('./models/copropriete');
const viCoproService = require('./services/viCoproService');

async function migrateSuiviCoproData() {
  const copros = await Copropriete.find({ suiviCopro: { $exists: true, $ne: null } });
  
  for (const copro of copros) {
    if (copro.suiviCopro && copro.suiviCopro.size > 0) {
      for (const [actionTitle, dateEcheance] of copro.suiviCopro.entries()) {
        await viCoproService.createViCopro({
          idCopro: copro.idCopro,
          actionTitle: actionTitle,
          dateCreation: new Date(),
          dateEcheance: new Date(dateEcheance),
          copro: copro._id,
          status: 'active'
        });
      }
    }
  }
  console.log('Migration complete!');
}
```

## API Endpoints (Future Enhancement)

Consider adding REST endpoints for vicopro management:

```javascript
// server/src/routes/viCoproRoutes.js
router.get('/vicopro/:idCopro', viCoproController.getAllByIdCopro);
router.get('/vicopro/:idCopro/active', viCoproController.getActiveByIdCopro);
router.post('/vicopro', viCoproController.create);
router.patch('/vicopro/:id/status', viCoproController.updateStatus);
router.delete('/vicopro/:id', viCoproController.delete);
```

## Testing

Test the optimized script:
1. Ensure MongoDB connection is active
2. Run the cron job: `synchroSuiviVieCopro.start()`
3. Verify entries are created in the `vicopros` collection
4. Check that no duplicates are created for future entries
5. Confirm Monday.com items are still created correctly

## Notes

- The old `suiviCopro` field in the Copropriete model can be kept for backward compatibility or removed after successful migration
- All queries are now indexed for optimal performance
- The service layer provides a clean abstraction for all vicopro operations
