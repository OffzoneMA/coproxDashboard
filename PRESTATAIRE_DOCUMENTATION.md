# Prestataire Entity and Synchronization System

## Overview

This document describes the implementation of the **Prestataire** (Service Provider) entity and its comprehensive synchronization system with Vilogi and Monday.com.

## Architecture

The implementation follows the **Hexagonal Architecture** pattern used throughout the CoproxDashboard project:

```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SYSTEMS                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│  │ MongoDB │ │ Vilogi  │ │ Monday  │                       │
│  └─────────┘ └─────────┘ └─────────┘                       │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                     │
│  Cron Jobs: synchroPrestataire.js                          │
│  Vilogi API → MongoDB → Monday.com                         │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                        │
│  Controllers → Services → Routes                            │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                           │
│  Models: Prestataire, PrestataireCopro                     │
└─────────────────────────────────────────────────────────────┘
```

## Entity Schema

### Prestataire Model
Location: `server/src/models/prestataire.js`

```javascript
{
  idCompte: Number,        // Unique identifier from Vilogi
  societe: String,         // Company name (required)
  adresse: String,         // Address
  complement: String,      // Address complement
  ville: String,          // City
  codepostal: String,     // Postal code
  telephone: String,       // Phone number
  fax: String,            // Fax number
  email: String,          // Email address
  web: String,            // Website
  siren: String,          // SIREN number
  rcs: String,            // RCS number
  iban: String,           // Bank IBAN
  bic: String,            // Bank BIC
  virement: Number,       // Wire transfer flag
  solde: Number,          // Current balance
  dateCreation: Date,     // Creation date
  dateModification: Date  // Last modification date
}
```

### PrestataireCopro Model (Junction Table)
Location: `server/src/models/prestataireCopro.js`

```javascript
{
  prestataireId: ObjectId,    // Reference to Prestataire
  coproprieteId: ObjectId,    // Reference to Copropriete
  dateDebut: Date,            // Start date of relationship
  dateFin: Date,              // End date of relationship
  typePrestation: String,     // Type of service
  notes: String,              // Additional notes
  dateCreation: Date,         // Creation date
  dateModification: Date      // Last modification date
}
```

**Note:** A compound index ensures uniqueness of the prestataire-copro relationship.

## API Endpoints

Base URL: `/prestataire`

### CRUD Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | List all prestataires |
| GET | `/details/:id` | Get prestataire by MongoDB ID |
| GET | `/byIdCompte/:idCompte` | Get prestataire by Vilogi idCompte |
| POST | `/add` | Create new prestataire |
| PUT | `/edit/:id` | Update prestataire |
| DELETE | `/delete/:id` | Delete prestataire and all relationships |

### Relationship Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/link/:prestataireId/:coproprieteId` | Link prestataire to copro |
| DELETE | `/unlink/:prestataireId/:coproprieteId` | Unlink prestataire from copro |
| PUT | `/updateLink/:prestataireId/:coproprieteId` | Update relationship details |
| GET | `/:prestataireId/copros` | Get all copros for a prestataire |
| GET | `/copro/:coproprieteId/prestataires` | Get all prestataires for a copro |

### Synchronization Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sync` | Trigger manual synchronization |

## Synchronization Process

Location: `server/src/cron/synchroPrestataire.js`

The synchronization follows a 3-step process inspired by the `synchroCopro` implementation:

### Step 1: Vilogi → MongoDB
**Function:** `vilogiToMongodb()`

1. Fetch all active copros from MongoDB
2. For each copro:
   - Call Vilogi API `/professionnel?copro={coproId}` to get prestataires
   - Map Vilogi data to our schema
   - Upsert prestataire (create or update based on `idCompte`)
   - Link prestataire to copro in junction table
3. Handle duplicate links gracefully

### Step 2: Update Solde Balances
**Function:** `updatePrestataireSoldes()`

1. Fetch all prestataires from MongoDB
2. For each prestataire:
   - Get linked copros
   - Call Vilogi API `/andecriture/soldeBalance?idCopro={coproId}&compte={idCompte}&dateSolde={date}`
   - Extract solde value from response
   - Update prestataire record with current solde

### Step 3: MongoDB → Monday.com
**Function:** `mongodbToMonday()`

1. Check if Monday board ID is configured
2. Fetch all prestataires from MongoDB
3. For each prestataire:
   - Check if item exists in Monday (by name)
   - Create new item or update existing item
   - Map fields to Monday columns

### Scheduling

The synchronization runs **weekly on Sunday at midnight** as part of the Sunday cron job batch.

Configuration in `server/src/cron/cronStart.js`:
```javascript
{
  name: 'weekly-sunday',
  schedule: '0 0 * * 0',
  scripts: [
    // ... other scripts
    { name: 'synchroPrestataire', modulePath: '../cron/synchroPrestataire', enabled: true }
  ]
}
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Monday.com Board ID for Prestataires
MONDAY_PRESTATAIRES_BOARD_ID=your_board_id_here
```

### Monday.com Board Setup

Create a Monday.com board with the following columns:
- `text`: Company name (societe)
- `text0`: Account ID (idCompte)
- `text1`: Address (adresse)
- `text2`: City (ville)
- `text3`: Postal code (codepostal)
- `text4`: Phone (telephone)
- `text5`: Email (email)
- `text6`: SIREN (siren)
- `text7`: IBAN (iban)
- `numbers`: Balance (solde)

## Service Methods

Location: `server/src/services/prestataireService.js`

### Key Methods

- `listPrestataires()` - Get all prestataires
- `detailsPrestataire(id)` - Get by ID
- `getPrestataireByIdCompte(idCompte)` - Get by Vilogi ID
- `addPrestataire(data)` - Create new
- `editPrestataire(id, data)` - Update
- `deletePrestataire(id)` - Delete with relationships
- `upsertPrestataire(data)` - Create or update based on idCompte
- `linkPrestataireToCopro(prestataireId, coproprieteId, linkData)` - Create relationship
- `unlinkPrestataireFromCopro(prestataireId, coproprieteId)` - Remove relationship
- `updatePrestataireCooproLink(prestataireId, coproprieteId, linkData)` - Update relationship
- `getCoprosForPrestataire(prestataireId)` - Get related copros
- `getPrestatairesForCopro(coproprieteId)` - Get related prestataires

## Usage Examples

### Manual Synchronization

```bash
# Trigger sync via API
curl -X POST http://localhost:8081/prestataire/sync
```

### Add Prestataire

```bash
curl -X POST http://localhost:8081/prestataire/add \
  -H "Content-Type: application/json" \
  -d '{
    "idCompte": 12345,
    "societe": "ABC Services",
    "email": "contact@abc.com",
    "telephone": "0123456789"
  }'
```

### Link Prestataire to Copro

```bash
curl -X POST http://localhost:8081/prestataire/link/{prestataireId}/{coproprieteId} \
  -H "Content-Type: application/json" \
  -d '{
    "typePrestation": "Entretien",
    "dateDebut": "2025-01-01",
    "notes": "Contract renewal"
  }'
```

### Get Prestataires for a Copro

```bash
curl http://localhost:8081/prestataire/copro/{coproprieteId}/prestataires
```

## Error Handling

The synchronization process includes comprehensive error handling:

- **Rate Limiting**: Delays between API calls (200-500ms)
- **Graceful Failures**: Individual failures don't stop the entire process
- **Logging**: Detailed console logs and script execution tracking
- **Duplicate Handling**: Ignores duplicate key errors for existing links
- **Vilogi Counter**: Tracks API call volume

## Logging

The system uses structured logging:
- Script execution logs stored in database
- Console output for monitoring
- Service-level logging with Winston
- Vilogi API call tracking

## Database Collections

- `prestataires`: Main prestataire entities
- `prestatairecopros`: Junction table for many-to-many relationships
- `copropriete`: Referenced copro entities

## Related Files

### Models
- `/server/src/models/prestataire.js`
- `/server/src/models/prestataireCopro.js`

### Services
- `/server/src/services/prestataireService.js`
- `/server/src/services/vilogiService.js` (API integration)
- `/server/src/services/mondayService.js` (Monday.com integration)

### Controllers
- `/server/src/controllers/prestataireController.js`

### Routes
- `/server/src/routes/prestataireRoutes.js`

### Cron Jobs
- `/server/src/cron/synchroPrestataire.js`
- `/server/src/cron/cronStart.js` (scheduler configuration)

## Testing

To test the synchronization:

1. Ensure MongoDB is connected
2. Verify Vilogi API credentials in `.env`
3. Configure Monday board ID (optional)
4. Run manual sync:
   ```bash
   curl -X POST http://localhost:8081/prestataire/sync
   ```
5. Check console output and database

## Future Enhancements

- Add prestataire filtering by type
- Implement search functionality
- Add bulk import/export
- Create dashboard visualizations
- Add performance metrics
- Implement incremental sync (delta updates)
- Add conflict resolution strategies

## Support

For issues or questions, refer to:
- Main architecture: `HEXAGONAL_ARCHITECTURE.md`
- Cron configuration: `CRON_CONFIGURATION.md`
- Service logs: `server/logs/`
