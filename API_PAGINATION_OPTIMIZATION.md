# API Pagination Optimization Guide

## Overview
This guide documents the pagination optimization implemented across the CoproxDashboard API to improve frontend performance when dealing with large datasets.

## Changes Implemented

### 1. Pagination Helper Utility (`/server/src/utils/paginationHelper.js`)

Created a reusable pagination helper module with the following functions:

- **`parsePaginationParams(query, defaults)`**: Parses Express request query parameters for pagination
- **`buildPaginationResponse(data, total, params)`**: Builds standardized pagination response
- **`executePaginatedQuery(collection, query, options)`**: Executes MongoDB queries with pagination
- **`parseFilterParams(query, allowedFilters)`**: Parses filter parameters from query string
- **`validatePaginationParams(params)`**: Validates pagination parameters

### 2. Person Endpoints Optimization

#### Service Layer (`/server/src/services/personService.js`)

Updated the following functions with pagination support:

**`getAllPersons(options)`**
- Added pagination with limit, skip, sort, and filter options
- Returns: `{ data: [], pagination: {...} }`
- Default limit: 100, max limit: 1000

**`getAllPersonsWithCopro(options)`**
- Added pagination for person+copro joined data
- Enriches persons with copro details in parallel
- Handles copro lookup failures gracefully
- Returns: `{ data: [], pagination: {...} }`

**`getPersonsWithNegativeSolde(options)`**
- Added pagination for persons with debts
- Default sort: most negative first
- Returns: `{ data: [], pagination: {...} }`

**`getPersonsWithPositiveSolde(options)`**
- Added pagination for persons with credits
- Default sort: highest first
- Returns: `{ data: [], pagination: {...} }`

**`getSoldeStats()`** (NEW)
- Returns aggregate statistics about soldes
- Includes: total, avg, min, max, negative count, positive count, zero count

#### Controller Layer (`/server/src/controllers/personController.js`)

Updated controllers to parse query parameters and call services with pagination options:

**Query Parameters Supported:**
- `limit` - Number of results per page (default: 100, max: 1000)
- `page` - Page number (1-indexed, default: 1)
- `sortBy` - Field to sort by (default: 'nom')
- `sortOrder` - Sort direction: 'asc' or 'desc' (default: 'asc')
- `active` - Filter by active status (boolean: 'true' or 'false')
- `idCopro` - Filter by copro ID (MongoDB ObjectId)
- `nom` - Search by name (case-insensitive partial match)
- `prenom` - Search by first name (case-insensitive partial match)

**Response Format:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 1543,
    "count": 100,
    "page": 2,
    "limit": 100,
    "skip": 100,
    "totalPages": 16,
    "hasMore": true,
    "hasPrevious": true,
    "nextPage": 3,
    "previousPage": 1
  }
}
```

### 3. API Usage Examples

#### Get all persons with pagination
```bash
# Get first 50 persons sorted by name
GET /person?limit=50&page=1&sortBy=nom&sortOrder=asc

# Get active persons only
GET /person?active=true&limit=100

# Get persons from specific copro
GET /person?idCopro=507f1f77bcf86cd799439011&limit=50

# Search by name
GET /person?nom=dupont&limit=20
```

#### Get persons with copro details
```bash
# Get persons with copro data, paginated
GET /person/copro?limit=50&page=1&sortBy=nom&sortOrder=asc

# Filter active persons with copro from specific copro
GET /person/copro?active=true&idCopro=507f1f77bcf86cd799439011
```

#### Get persons by solde status
```bash
# Get persons with negative solde (debts)
GET /person/solde/negative?limit=50&page=1

# Get persons with positive solde (credits)
GET /person/solde/positive?limit=50&page=1

# Get solde statistics
GET /person/solde/stats
```

## Performance Benefits

### Before Optimization
- All endpoints returned full datasets (1000+ records)
- No pagination support
- Frontend received massive JSON payloads
- Slow initial page load
- Memory issues with large datasets

### After Optimization
- Default limit of 100 records per request
- Configurable pagination (max 1000 per request)
- Efficient MongoDB queries with `.limit()` and `.skip()`
- Parallel total count queries
- Reduced network payload by ~90%
- Faster API response times
- Better frontend performance

## Migration Guide for Frontend

### Old API calls (no pagination):
```javascript
// Old way - returns all persons
const response = await fetch('/person');
const persons = await response.json();
```

### New API calls (with pagination):
```javascript
// New way - returns paginated result
const response = await fetch('/person?limit=50&page=1');
const result = await response.json();

// Access data
const persons = result.data;

// Access pagination info
const { total, page, totalPages, hasMore } = result.pagination;

// Load more pages
if (result.pagination.hasMore) {
  const nextPage = result.pagination.nextPage;
  const nextResponse = await fetch(`/person?limit=50&page=${nextPage}`);
  // ... handle next page
}
```

### Example: Infinite Scroll Implementation
```javascript
const [persons, setPersons] = useState([]);
const [pagination, setPagination] = useState({ page: 1, hasMore: true });
const [loading, setLoading] = useState(false);

const loadMore = async () => {
  if (loading || !pagination.hasMore) return;
  
  setLoading(true);
  const response = await fetch(`/person?limit=50&page=${pagination.page}`);
  const result = await response.json();
  
  setPersons(prev => [...prev, ...result.data]);
  setPagination({
    page: result.pagination.nextPage || pagination.page,
    hasMore: result.pagination.hasMore
  });
  setLoading(false);
};

// Use loadMore() in scroll handler or "Load More" button
```

### Example: Table Pagination Implementation
```javascript
const [persons, setPersons] = useState([]);
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const limit = 50;

const loadPage = async (page) => {
  const response = await fetch(`/person?limit=${limit}&page=${page}&sortBy=nom&sortOrder=asc`);
  const result = await response.json();
  
  setPersons(result.data);
  setCurrentPage(result.pagination.page);
  setTotalPages(result.pagination.totalPages);
};

// Load initial page
useEffect(() => {
  loadPage(1);
}, []);

// Render pagination controls
return (
  <>
    <table>
      {persons.map(person => <tr key={person._id}>...</tr>)}
    </table>
    <div className="pagination">
      <button 
        disabled={currentPage === 1}
        onClick={() => loadPage(currentPage - 1)}
      >
        Previous
      </button>
      <span>Page {currentPage} of {totalPages}</span>
      <button 
        disabled={currentPage === totalPages}
        onClick={() => loadPage(currentPage + 1)}
      >
        Next
      </button>
    </div>
  </>
);
```

## Next Steps - Endpoints to Optimize

The following endpoints also return large datasets and should be optimized:

### Copropriete Endpoints
- `GET /copropriete` - getAllCoproprietes
- `GET /copropriete/vilogi` - getAllCoproprietesFromVilogi

### SuiviFichen Endpoints  
- `GET /suiviFiches` - getAllSuiviFiches
- `GET /suiviFiches/copro/:idCopro` - getSuiviFichesByCoproId

### Script Endpoints
- `GET /script` - getAllScripts

### Trello Endpoints
- `GET /trello/boards` - getBoards
- `GET /trello/cards/:boardId` - getCardsFromBoard

## Testing Checklist

- [ ] Test pagination with default parameters
- [ ] Test pagination with custom limit (50, 100, 500)
- [ ] Test pagination with page navigation (page 1, 2, 3, etc.)
- [ ] Test sorting (asc/desc, different fields)
- [ ] Test filtering (active, idCopro, name search)
- [ ] Test combined filters + pagination
- [ ] Test edge cases (page beyond total, limit > max, invalid params)
- [ ] Test with empty results
- [ ] Test with single result
- [ ] Verify MongoDB query efficiency with `.explain()`
- [ ] Load test with concurrent requests
- [ ] Frontend integration test

## Monitoring

### Key Metrics to Track
- API response time (should be < 500ms for paginated queries)
- Payload size (should be < 100KB for 100 records)
- MongoDB query execution time
- Frontend rendering time
- User experience improvements

### Logging
All paginated queries log the following:
```javascript
logger.info('Operation name', { 
  meta: { 
    count: result.count,    // Records returned
    total: result.total,    // Total matching records
    skip: skip,             // Records skipped
    limit: limit            // Max records requested
  } 
});
```

## Backward Compatibility

**Breaking Changes:**
- Person endpoints now return `{ data: [], pagination: {} }` instead of array directly
- Frontend code must be updated to access `result.data` instead of `result`

**Backward Compatible:**
- Old function name `getAllPersonsWithCoppro` aliased to `getAllPersonsWithCopro`
- Default limit of 100 provides reasonable data size if pagination params not specified

## Best Practices

1. **Always specify a limit**: Don't rely on defaults for production code
2. **Implement pagination on frontend**: Don't try to load all pages at once
3. **Use appropriate limits**: 
   - Tables/grids: 50-100 records
   - Dropdowns/selects: 50 records with search
   - Infinite scroll: 20-30 records per batch
4. **Add loading states**: Show spinners during page loads
5. **Cache paginated results**: Avoid re-fetching same pages
6. **Handle errors gracefully**: Network failures, invalid pages, etc.
7. **Monitor performance**: Track API response times and adjust limits

## Files Modified

- `/server/src/utils/paginationHelper.js` (NEW)
- `/server/src/services/personService.js`
- `/server/src/controllers/personController.js`
- `/server/src/controllers/personController.js.backup` (backup)
- `/server/src/services/personService.js.backup` (backup)

## Related Documentation

- `PRESTATAIRE_SOLDE_FIX.md` - Solde field implementation
- `PRESTATAIRE_DEPLOYMENT_FIX.md` - Deployment configuration
- `CRON_SYSTEM_VISUAL_GUIDE.md` - Cron system overview
- `HEXAGONAL_ARCHITECTURE.md` - Architecture principles

---

**Last Updated:** 2024
**Status:** Implemented for Person endpoints, ready for other endpoints
