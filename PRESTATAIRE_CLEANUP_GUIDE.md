# Prestataire Synchronization - Cleanup & Removal Handling

## Overview

The prestataire synchronization system now includes comprehensive cleanup mechanisms to handle:
1. **Obsolete Links**: Prestataires that are no longer associated with specific copros in Vilogi
2. **Removed Prestataires**: Prestataires that have been completely removed from all copros in Vilogi

## Enhanced Synchronization Flow

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Vilogi → MongoDB                               │
│ ─────────────────────────────────                      │
│ • Fetch prestataires per copro from Vilogi            │
│ • Track all active relationships                      │
│ • Upsert prestataires & create links                  │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ Step 2: Clean Up Obsolete Links                       │
│ ─────────────────────────────                         │
│ • Compare DB links vs. active relationships           │
│ • Remove links not found in Vilogi                    │
│ • Log all removals                                    │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ Step 3: Clean Up Removed Prestataires                 │
│ ─────────────────────────────────────                 │
│ • Find prestataires with zero links                   │
│ • Hard delete OR soft delete (configurable)           │
│ • Track status and removal date                       │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ Step 4: Update Solde                                   │
│ Step 5: Sync to Monday.com                             │
└─────────────────────────────────────────────────────────┘
```

## Cleanup Mechanisms

### 1. Obsolete Link Cleanup

**What it does:**
- Identifies prestataire-copro relationships that exist in MongoDB but not in Vilogi
- Removes these obsolete links from the junction table

**When it happens:**
- A prestataire is removed from a specific copro in Vilogi
- A prestataire is still linked to other copros (not completely removed)

**Example:**
```
Before: Prestataire "ABC Services" linked to Copro A, B, C
In Vilogi: Now only linked to Copro A, C
After Cleanup: Link to Copro B is removed
```

**Implementation:**
```javascript
// Tracks active relationships during sync
const relationshipKey = `${prestataireId}_${coproId}`;
activeRelationships.add(relationshipKey);

// Later: removes links not in active set
if (!activeRelationships.has(relationshipKey)) {
    await removeLink(link._id);
}
```

### 2. Removed Prestataire Cleanup

**What it does:**
- Identifies prestataires that have zero links (orphaned)
- Either permanently deletes or marks as inactive

**When it happens:**
- A prestataire is removed from ALL copros in Vilogi
- No active relationships remain in the junction table

**Configuration:**

Add to `.env`:
```bash
# Set to 'true' for permanent deletion, 'false' or omit for soft delete
PRESTATAIRE_HARD_DELETE=false
```

#### Hard Delete Mode (`PRESTATAIRE_HARD_DELETE=true`)
- **Action**: Permanently removes prestataire from database
- **Use Case**: Keep database clean, no historical tracking needed
- **Pros**: Clean database, no clutter
- **Cons**: Historical data is lost

#### Soft Delete Mode (default: `PRESTATAIRE_HARD_DELETE=false`)
- **Action**: Marks prestataire as "Inactive" with removal date
- **Use Case**: Maintain historical records, audit trail
- **Pros**: Data preserved, can be reactivated, audit trail
- **Cons**: Inactive records remain in database

**Example:**
```
Before: Prestataire "XYZ Corp" linked to Copro A
In Vilogi: Completely removed from all copros
After Cleanup (Soft): status: "Inactive", dateRemoval: "2025-11-23"
After Cleanup (Hard): Record deleted from database
```

## Updated Schema

### Prestataire Model - New Fields

```javascript
{
  // ... existing fields ...
  status: { 
    type: String, 
    default: 'Active',    // 'Active' or 'Inactive'
  },
  dateRemoval: { 
    type: Date,           // Date when prestataire was removed from Vilogi
  }
}
```

## API Updates

### List Prestataires

**Endpoint:** `GET /prestataire/list`

**Query Parameters:**
- `includeInactive` (boolean): Include inactive prestataires in results

**Examples:**
```bash
# List only active prestataires (default)
curl http://localhost:8081/prestataire/list

# List all prestataires including inactive
curl http://localhost:8081/prestataire/list?includeInactive=true
```

## Monitoring & Logging

The sync process provides detailed logging:

```
--- Step 2: Cleaning Up Obsolete Prestataire-Copro Links ---
Found 45 existing links in database
  ✗ Removed obsolete link: Prestataire 507f1f77... - Copro 507f191e...
  ✗ Removed obsolete link: Prestataire 507f1f88... - Copro 507f192f...
✓ Step 2 Complete: Removed 2 obsolete links

--- Step 3: Cleaning Up Removed Prestataires ---
  Delete mode: Soft Delete (mark as inactive)
Found 120 prestataires to check
  ⚠ INACTIVATED: ABC Services (idCompte: 12345)
  ⚠ INACTIVATED: XYZ Corp (idCompte: 67890)
✓ Step 3 Complete: Marked 2 prestataires as inactive
```

## Use Cases

### Case 1: Prestataire Removed from One Copro
**Scenario:** "Cleaning Services Inc" was providing services to Copro A, B, and C. They stop working with Copro B.

**What Happens:**
1. Step 1: Links to A and C are created/maintained
2. Step 2: Link to B is removed (obsolete link cleanup)
3. Step 3: Prestataire remains active (still has links)
4. Result: Prestataire exists, linked only to A and C

### Case 2: Prestataire Completely Removed
**Scenario:** "Old Maintenance Co" stops working with all copros.

**What Happens (Soft Delete):**
1. Step 1: No links are created (not in Vilogi)
2. Step 2: All existing links are removed
3. Step 3: Prestataire marked as Inactive, dateRemoval set
4. Result: Prestataire in database with status="Inactive"

**What Happens (Hard Delete):**
1. Step 1: No links are created (not in Vilogi)
2. Step 2: All existing links are removed
3. Step 3: Prestataire deleted from database
4. Result: Prestataire completely removed

### Case 3: Prestataire Returns
**Scenario:** "ABC Services" was inactive, now appears again in Vilogi for a copro.

**What Happens:**
1. Step 1: Upsert finds existing inactive record
2. Record is updated with new data (status remains "Inactive")
3. New link is created
4. Manual intervention may be needed to reactivate

**Recommendation:** Add reactivation logic:
```javascript
// In upsertPrestataire function
if (existingPrestataire.status === 'Inactive') {
    prestataireData.status = 'Active';
    prestataireData.dateRemoval = null;
}
```

## Configuration Summary

| Setting | Default | Description |
|---------|---------|-------------|
| `PRESTATAIRE_HARD_DELETE` | `false` | If `true`, permanently deletes orphaned prestataires. If `false`, marks as inactive. |

## Best Practices

### 1. Start with Soft Delete
- Begin with soft delete (default) to preserve historical data
- Monitor for a few sync cycles
- Switch to hard delete only if needed

### 2. Regular Monitoring
- Check sync logs for removal patterns
- Investigate unexpected removals
- Verify Vilogi data accuracy

### 3. Backup Strategy
- Backup database before first sync with cleanup enabled
- Keep backups of inactive prestataires
- Document any manual interventions

### 4. Audit Trail
- Soft delete mode provides built-in audit trail
- `dateRemoval` field tracks when prestataire was removed
- Can generate reports of inactive prestataires

## Reactivation

To manually reactivate an inactive prestataire:

```javascript
// Via API
PUT /prestataire/edit/{id}
{
  "status": "Active",
  "dateRemoval": null
}

// Via MongoDB
db.prestataires.updateOne(
  { _id: ObjectId("...") },
  { 
    $set: { status: "Active" },
    $unset: { dateRemoval: "" }
  }
)
```

## Troubleshooting

### Issue: Prestataire incorrectly marked as inactive
**Cause:** May not appear in any copro during sync
**Solution:** 
1. Verify prestataire exists in Vilogi
2. Check copro associations in Vilogi
3. Manually reactivate if needed
4. Run sync again

### Issue: Too many removals
**Cause:** Vilogi API issue or connection problem
**Solution:**
1. Check Vilogi API connectivity
2. Review API call logs
3. Verify copro data is correctly fetched
4. Consider disabling cleanup until resolved

### Issue: Want to recover deleted prestataire
**Cause:** Hard delete mode was enabled
**Solution:**
1. Restore from database backup
2. Switch to soft delete mode
3. Prestataire will be recreated on next sync if in Vilogi

## Performance Considerations

- **Cleanup Impact**: Minimal, runs after main sync
- **Database Operations**: Efficient queries with indexes
- **API Calls**: No additional Vilogi API calls for cleanup
- **Memory Usage**: Tracks active relationships in memory (Set)

## Future Enhancements

1. **Configurable Grace Period**: Don't remove until absent for X sync cycles
2. **Notification System**: Alert on prestataire removals
3. **Bulk Reactivation**: API endpoint to reactivate multiple prestataires
4. **Removal Reasons**: Track why prestataire was removed
5. **Archive System**: Move inactive records to separate collection

---

**Summary:** The enhanced sync system ensures your database stays in sync with Vilogi, automatically handling removed or unlinked prestataires with configurable cleanup strategies.
