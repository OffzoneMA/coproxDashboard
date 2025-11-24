# Prestataire Implementation - Quick Reference

## ✅ What Was Created

### 1. **Database Models**
- ✅ `Prestataire` model with all required fields including `solde`
- ✅ `PrestataireCopro` junction table for many-to-many relationship with Copropriete

### 2. **API Layer**
- ✅ Complete CRUD endpoints (`/prestataire/*`)
- ✅ Relationship management endpoints
- ✅ Manual sync trigger endpoint

### 3. **Business Logic**
- ✅ Service layer with upsert functionality
- ✅ Relationship management (link/unlink/update)
- ✅ Query methods for related entities

### 4. **Synchronization System**
- ✅ `synchroPrestataire.js` cron job
- ✅ Three-step sync process:
  1. Vilogi → MongoDB (fetch prestataires per copro)
  2. Update solde via `/andecriture/soldeBalance`
  3. MongoDB → Monday.com
- ✅ Registered in weekly Sunday cron schedule

### 5. **Integration Points**
- ✅ Vilogi API: `/professionnel` and `/andecriture/soldeBalance`
- ✅ Monday.com board sync (configurable)
- ✅ Error handling and logging

## 🎯 Key Features

1. **One Prestataire, Multiple Copros**: Junction table supports many-to-many
2. **Automatic Solde Updates**: Fetches balance from Vilogi accounting system
3. **Duplicate Prevention**: Compound index on junction table
4. **Upsert Logic**: Creates or updates based on `idCompte`
5. **Monday.com Sync**: Optional board synchronization
6. **Manual Trigger**: POST `/prestataire/sync` for on-demand sync

## 📊 Data Flow

```
Vilogi API (/professionnel)
    ↓
MongoDB (prestataires collection)
    ↓
Vilogi API (/andecriture/soldeBalance) → Update solde
    ↓
Monday.com (optional board)
```

## 🚀 Quick Start

1. **Configuration**:
   ```bash
   # Add to .env (optional)
   MONDAY_PRESTATAIRES_BOARD_ID=your_board_id
   ```

2. **Test Manual Sync**:
   ```bash
   curl -X POST http://localhost:8081/prestataire/sync
   ```

3. **Query Prestataires**:
   ```bash
   curl http://localhost:8081/prestataire/list
   ```

4. **Get Prestataires for a Copro**:
   ```bash
   curl http://localhost:8081/prestataire/copro/{coproprieteId}/prestataires
   ```

## 📁 Files Created/Modified

### Created:
- `server/src/models/prestataire.js`
- `server/src/models/prestataireCopro.js`
- `server/src/services/prestataireService.js`
- `server/src/controllers/prestataireController.js`
- `server/src/routes/prestataireRoutes.js`
- `server/src/cron/synchroPrestataire.js`
- `PRESTATAIRE_DOCUMENTATION.md`

### Modified:
- `server/index.js` (added routes)
- `server/src/cron/cronStart.js` (registered cron job)

## ⏰ Scheduling

**Weekly Sync**: Runs every Sunday at midnight (00:00)
- Part of the `weekly-sunday` cron batch
- Runs after `synchroCopro` and `synchroUsers`

## 🔍 Monitoring

Check sync status:
- Console logs during execution
- Database: `scripts` collection for execution logs
- Look for `synchroPrestataire` entries

## 📞 Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/prestataire/list` | GET | List all |
| `/prestataire/details/:id` | GET | Get one |
| `/prestataire/add` | POST | Create |
| `/prestataire/edit/:id` | PUT | Update |
| `/prestataire/delete/:id` | DELETE | Delete |
| `/prestataire/link/:pid/:cid` | POST | Link to copro |
| `/prestataire/sync` | POST | Trigger sync |

## 💡 Notes

- Solde is fetched from Vilogi's accounting system
- Junction table allows tracking relationship metadata (dates, type, notes)
- Sync inspired by existing `synchroCopro.js` pattern
- Monday sync is optional (skip if board not configured)
- Error handling ensures partial failures don't stop entire sync

---

For detailed documentation, see `PRESTATAIRE_DOCUMENTATION.md`
