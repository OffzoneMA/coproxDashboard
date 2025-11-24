# Copro Synchronization Improvement

## Overview
Improved the copro synchronization system to properly handle copros that are no longer in Vilogi, preventing API errors and unnecessary calls across all synchronization scripts.

## Problem Solved
When a copro is removed from Vilogi (e.g., contract ended, moved to another system), the synchronization scripts would continue attempting to fetch data for these copros, resulting in:
- 404 errors and failed API calls
- Wasted API quota
- Cluttered error logs
- Unnecessary processing time

## Solution
Use the existing `status` field to mark copros as "Inactif" when they're no longer in Vilogi. The `coproService.listCopropriete()` already filters out Inactif copros, so all synchronization scripts automatically skip them.

## Changes Made

### 1. Model (No Changes Required)
The existing `copropriete` model already has a `status` field that accepts "Actif" or "Inactif".

### 2. Service Layer (Already Implemented)
`coproService.listCopropriete()` already filters:
```javascript
find({ status: { $ne: 'Inactif' } })
```

### 3. Enhanced `synchroCopro.js`

#### vilogiToMongodb()
- Tracks all copro IDs returned from Vilogi
- Automatically marks copros NOT in Vilogi as `status: "Inactif"`
- Sets all copros found in Vilogi as `status: "Actif"`

```javascript
// Mark copros that are no longer in Vilogi as Inactif
const allDbCopros = await coproprieteCollection.find({}).toArray();

for (const dbCopro of allDbCopros) {
  if (dbCopro.idVilogi && !vilogiCoproIds.has(dbCopro.idVilogi) && dbCopro.status !== 'Inactif') {
    console.log(`⚠️  Copro ${dbCopro.idCopro} is no longer in Vilogi - marking as Inactif`);
    await coproService.editCopropriete(dbCopro._id, {
      status: 'Inactif'
    });
  }
}
```

### 4. All Other Sync Scripts
No changes required! Since they all use `coproService.listCopropriete()`, they automatically skip Inactif copros:

- ✅ `synchroVilogiMessages.js`
- ✅ `synchroComptaList512.js`
- ✅ `synchroComptaList472.js`
- ✅ `synchroComptaBudget.js`
- ✅ `synchroPrestataire.js`
- ✅ `synchroMandats.js`
- ✅ `synchroTravaux.js`
- ✅ `synchroExercices.js`
- ✅ `synchroContratAssurance.js`
- ✅ `synchroContratEntretien.js`
- ✅ `synchroFactureOCR.js`
- ✅ And all other scripts using `listCopropriete()`

### 5. Zendesk Integration
The `mongodbToZendesk()` function already correctly syncs the status to Zendesk's `copro_gerer_par_coprox` field, so Zendesk will show which copros are Actif vs Inactif.

## Benefits

### 1. Automatic Filtering
All sync scripts automatically skip Inactif copros without any individual script modifications.

### 2. Reduced API Calls
Prevents unnecessary Vilogi API calls for copros that no longer exist, saving API quota and processing time.

### 3. Cleaner Logs
No more 404 errors or "copro not found" messages cluttering the logs.

### 4. Single Source of Truth
The `status` field is the definitive indicator of whether a copro should be synchronized.

### 5. Integration Ready
Zendesk and Monday.com automatically reflect the copro status, providing visibility across all systems.

## Usage

### Running the Sync
Simply run the normal sync as usual:
```javascript
await synchroCopro.start();
```

The script will:
1. Fetch all copros from Vilogi
2. Update existing copros to `status: "Actif"`
3. Mark copros NOT in Vilogi as `status: "Inactif"`
4. All other sync scripts will automatically skip Inactif copros

### Manually Checking Status
```javascript
// Get only active copros (default behavior)
const activeCopros = await coproService.listCopropriete();

// Get inactive copros if needed
const inactiveCopros = await coproService.listCoproprieteInactive();
```

### Console Output
When a copro is marked as Inactif, you'll see:
```
⚠️  Copro S123 (Vilogi ID: 12345) is no longer in Vilogi - marking as Inactif
```

## Migration Notes

### For Existing Copros
On the first run after this update, `synchroCopro.start()` will:
- Validate all copros against current Vilogi data
- Automatically mark missing copros as Inactif
- No manual intervention required

### Reactivating a Copro
If a copro returns to Vilogi (rare case):
1. It will automatically be marked as `status: "Actif"` on the next sync
2. All subsequent syncs will include it again

## Technical Implementation

### Flow Diagram
```
synchroCopro.start()
    ↓
vilogiToMongodb()
    ↓
[Fetch all copros from Vilogi]
    ↓
For each Vilogi copro:
    → Set status: "Actif"
    ↓
For each DB copro NOT in Vilogi:
    → Set status: "Inactif"
    ↓
All other sync scripts
    ↓
[Use listCopropriete() which filters status != "Inactif"]
    ↓
✅ Only Actif copros are processed
```

## Best Practices

### 1. Run synchroCopro First
Always run `synchroCopro.start()` before other sync scripts to ensure status is up-to-date.

### 2. Monitor Console Output
Watch for "⚠️ marking as Inactif" messages to track which copros have been removed from Vilogi.

### 3. Check Inactif Copros Periodically
```javascript
const inactiveCopros = await coproService.listCoproprieteInactive();
console.log(`${inactiveCopros.length} inactive copros`);
```

### 4. Don't Manually Set Status
Let `synchroCopro` manage the status field automatically based on Vilogi data.

## Troubleshooting

### Copro Still Showing as Actif After Removal from Vilogi
- Ensure `synchroCopro.start()` has been run
- Check if the copro has a valid `idVilogi` field
- Verify Vilogi API connection is working

### Copro Incorrectly Marked as Inactif
- Check if copro exists in Vilogi
- Verify `idVilogi` matches the Vilogi system
- Re-run `synchroCopro.start()` to refresh

### All Copros Marked as Inactif
- Check Vilogi API credentials
- Verify `getAllCopros()` is returning data
- Check network connectivity to Vilogi

## Additional Features Available

### Validation Function (Available but Not Used)
Added `vilogiService.checkCoproExistsInVilogi(coproID)` for manual validation:
```javascript
const result = await vilogiService.checkCoproExistsInVilogi(copro.idVilogi);
// Returns: { exists: true/false, status: string, error: string|null }
```

This can be used for manual checks or debugging but is not required for normal operation.

---

**Date Implemented:** November 23, 2025
**Impact:** All synchronization scripts
**Breaking Changes:** None - backward compatible
