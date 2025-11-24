# Frontend API Changes - Pagination Implementation

**Date:** November 24, 2025  
**Version:** 2.0  
**Breaking Changes:** ⚠️ YES - Response format has changed

---

## 🎯 Executive Summary

We've implemented **pagination** across all Person API endpoints to improve performance and reduce load times. This is a **breaking change** that requires frontend updates.

### Key Changes:
- ✅ All person endpoints now support pagination
- ✅ New query parameters for filtering and sorting
- ✅ Consistent response format with pagination metadata
- ⚠️ **Breaking**: Response structure changed from array to object

### 🚀 Quick Start - Production URLs

```bash
# Modern endpoints (RECOMMENDED)
GET https://coprox-dashboard-back.vercel.app/person?limit=50&page=1
GET https://coprox-dashboard-back.vercel.app/person/copro?limit=50&page=1
GET https://coprox-dashboard-back.vercel.app/person/solde/stats

# Legacy endpoints (still supported)
GET https://coprox-dashboard-back.vercel.app/person/getAllPersons?limit=50&page=1
GET https://coprox-dashboard-back.vercel.app/person/getAllPersonsWithCopro?limit=50&page=1
```

---

## 📋 Table of Contents

1. [What Changed](#what-changed)
2. [Migration Guide](#migration-guide)
3. [API Reference](#api-reference)
4. [Query Parameters](#query-parameters)
5. [Response Format](#response-format)
6. [Code Examples](#code-examples)
7. [Testing Checklist](#testing-checklist)

---

## 🔄 What Changed

### Before (Old API)
```javascript
// GET /person
// Response: Array of persons
[
  { _id: "...", nom: "Dupont", prenom: "Jean", ... },
  { _id: "...", nom: "Martin", prenom: "Marie", ... },
  // ... 1000+ more records
]
```

### After (New API)
```javascript
// GET /person?limit=50&page=1
// Response: Object with data and pagination
{
  "success": true,
  "data": [
    { _id: "...", nom: "Dupont", prenom: "Jean", ... },
    { _id: "...", nom: "Martin", prenom: "Marie", ... },
    // ... up to 50 records
  ],
  "pagination": {
    "total": 1543,
    "count": 50,
    "page": 1,
    "limit": 50,
    "skip": 0,
    "totalPages": 31,
    "hasMore": true,
    "hasPrevious": false,
    "nextPage": 2,
    "previousPage": null
  }
}
```

---

## 🚀 Migration Guide

### Step 1: Update API Calls

#### ❌ Old Code
```javascript
const response = await fetch('/api/person');
const persons = await response.json();

// Use persons directly
persons.forEach(person => {
  console.log(person.nom);
});
```

#### ✅ New Code
```javascript
const response = await fetch('/api/person?limit=100&page=1');
const result = await response.json();

// Access data from result.data
const persons = result.data;
persons.forEach(person => {
  console.log(person.nom);
});

// Access pagination info
console.log(`Showing ${result.pagination.count} of ${result.pagination.total}`);
```

### Step 2: Update State Management

#### React Example
```javascript
const [persons, setPersons] = useState([]);
const [pagination, setPagination] = useState({
  page: 1,
  totalPages: 1,
  hasMore: false
});
const [loading, setLoading] = useState(false);

const fetchPersons = async (page = 1) => {
  setLoading(true);
  try {
    const response = await fetch(`/api/person?limit=50&page=${page}&sortBy=nom&sortOrder=asc`);
    const result = await response.json();
    
    setPersons(result.data);
    setPagination({
      page: result.pagination.page,
      totalPages: result.pagination.totalPages,
      hasMore: result.pagination.hasMore
    });
  } catch (error) {
    console.error('Error fetching persons:', error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchPersons(1);
}, []);
```

### Step 3: Handle Pagination UI

#### Option A: Classic Pagination
```javascript
const Pagination = ({ pagination, onPageChange }) => {
  return (
    <div className="pagination">
      <button 
        disabled={!pagination.hasPrevious}
        onClick={() => onPageChange(pagination.previousPage)}
      >
        Previous
      </button>
      
      <span>
        Page {pagination.page} of {pagination.totalPages}
      </span>
      
      <button 
        disabled={!pagination.hasMore}
        onClick={() => onPageChange(pagination.nextPage)}
      >
        Next
      </button>
    </div>
  );
};
```

#### Option B: Infinite Scroll
```javascript
const InfinitePersonList = () => {
  const [persons, setPersons] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, hasMore: true });
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading || !pagination.hasMore) return;
    
    setLoading(true);
    const response = await fetch(`/api/person?limit=30&page=${pagination.page}`);
    const result = await response.json();
    
    setPersons(prev => [...prev, ...result.data]);
    setPagination({
      page: result.pagination.nextPage || pagination.page,
      hasMore: result.pagination.hasMore
    });
    setLoading(false);
  };

  useEffect(() => {
    loadMore();
  }, []);

  return (
    <div>
      {persons.map(person => (
        <PersonCard key={person._id} person={person} />
      ))}
      
      {pagination.hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};
```

---

## 📚 API Reference

### Affected Endpoints

| Endpoint | Method | Old Response | New Response | Status |
|----------|--------|--------------|--------------|--------|
| `/person` or `/person/getAllPersons` | GET | Array | Paginated Object | ✅ Updated |
| `/person/copro` or `/person/getAllPersonsWithCopro` | GET | Array | Paginated Object | ✅ Updated |
| `/person/solde/negative` | GET | Array | Paginated Object | ✅ Updated |
| `/person/solde/positive` | GET | Array | Paginated Object | ✅ Updated |
| `/person/solde/stats` | GET | Object | Object (no change) | ✅ New Endpoint |
| `/person/:id` or `/person/getPerson/:id` | GET | Object | Object (no change) | ✅ No Change |
| `/person/:id/solde` | POST | Object | Object (no change) | ✅ No Change |

**Note:** Both modern (`/person`, `/person/copro`) and legacy (`/person/getAllPersons`, `/person/getAllPersonsWithCopro`) endpoints are supported for backward compatibility.

---

## 🔧 Query Parameters

All paginated endpoints support these query parameters:

### Pagination Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | number | 100 | 1000 | Number of records per page |
| `page` | number | 1 | - | Page number (1-indexed) |
| `sortBy` | string | 'nom' | - | Field to sort by |
| `sortOrder` | string | 'asc' | - | Sort direction: 'asc' or 'desc' |

### Filter Parameters

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `active` | boolean | `true` | Filter by active status |
| `idCopro` | ObjectId | `507f1f77bcf86cd799439011` | Filter by copropriété |
| `nom` | string | `dupont` | Search by last name (case-insensitive) |
| `prenom` | string | `jean` | Search by first name (case-insensitive) |

### Examples

```bash
# Get first 50 persons sorted by name (modern endpoint)
GET /person?limit=50&page=1&sortBy=nom&sortOrder=asc

# Get first 50 persons sorted by name (legacy endpoint)
GET /person/getAllPersons?limit=50&page=1&sortBy=nom&sortOrder=asc

# Get active persons only
GET /person?active=true&limit=100

# Get persons from specific copro
GET /person?idCopro=507f1f77bcf86cd799439011&limit=50

# Search by name
GET /person?nom=dupont&limit=20

# Combine filters
GET /person?active=true&sortBy=nom&sortOrder=asc&limit=50&page=2

# Get persons with copro details (modern endpoint - RECOMMENDED)
GET /person/copro?limit=50&page=1

# Get persons with copro details (legacy endpoint)
GET /person/getAllPersonsWithCopro?limit=50&page=1

# Get persons with negative solde (debts)
GET /person/solde/negative?limit=50&page=1

# Get persons with positive solde (credits)
GET /person/solde/positive?limit=50&page=1

# Get solde statistics
GET /person/solde/stats
```

---

## 📦 Response Format

### Success Response

```typescript
{
  success: boolean;           // Always true for successful requests
  data: Array<Person>;        // Array of person objects
  pagination: {
    total: number;            // Total number of records matching query
    count: number;            // Number of records in current response
    page: number;             // Current page number (1-indexed)
    limit: number;            // Records per page
    skip: number;             // Number of records skipped
    totalPages: number;       // Total number of pages
    hasMore: boolean;         // True if more pages available
    hasPrevious: boolean;     // True if previous page exists
    nextPage: number | null;  // Next page number or null
    previousPage: number | null; // Previous page number or null
  };
}
```

### Error Response

```typescript
{
  error: string;              // Error message
  details?: string;           // Additional error details (optional)
}
```

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid parameters (e.g., invalid ObjectId) |
| 404 | Not Found | Resource not found (single resource endpoints only) |
| 500 | Server Error | Internal server error |

---

## 💻 Code Examples

### Example 1: Simple Person List

```javascript
import { useState, useEffect } from 'react';

function PersonList() {
  const [persons, setPersons] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPersons = async (page = 1, limit = 50) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/person?limit=${limit}&page=${page}&sortBy=nom&sortOrder=asc`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch persons');
      }
      
      const result = await response.json();
      setPersons(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Persons ({pagination.total} total)</h1>
      
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {persons.map(person => (
            <tr key={person._id}>
              <td>{person.nom} {person.prenom}</td>
              <td>{person.email}</td>
              <td>{person.active ? 'Active' : 'Inactive'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button 
          disabled={!pagination.hasPrevious}
          onClick={() => fetchPersons(pagination.previousPage)}
        >
          Previous
        </button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <button 
          disabled={!pagination.hasMore}
          onClick={() => fetchPersons(pagination.nextPage)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### Example 2: Filtered Search

```javascript
function PersonSearch() {
  const [persons, setPersons] = useState([]);
  const [filters, setFilters] = useState({
    nom: '',
    active: '',
    idCopro: ''
  });
  const [pagination, setPagination] = useState(null);

  const searchPersons = async (page = 1) => {
    const params = new URLSearchParams({
      limit: '50',
      page: String(page),
      sortBy: 'nom',
      sortOrder: 'asc'
    });

    // Add filters
    if (filters.nom) params.append('nom', filters.nom);
    if (filters.active) params.append('active', filters.active);
    if (filters.idCopro) params.append('idCopro', filters.idCopro);

    const response = await fetch(`/api/person?${params}`);
    const result = await response.json();
    
    setPersons(result.data);
    setPagination(result.pagination);
  };

  return (
    <div>
      <div className="filters">
        <input
          placeholder="Search by name"
          value={filters.nom}
          onChange={e => setFilters({ ...filters, nom: e.target.value })}
        />
        
        <select
          value={filters.active}
          onChange={e => setFilters({ ...filters, active: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button onClick={() => searchPersons(1)}>Search</button>
      </div>

      {/* Results */}
      <PersonList persons={persons} pagination={pagination} />
    </div>
  );
}
```

### Example 3: Solde Dashboard

```javascript
function SoldeDashboard() {
  const [stats, setStats] = useState(null);
  const [negativePersons, setNegativePersons] = useState([]);
  const [positivePersons, setPositivePersons] = useState([]);

  useEffect(() => {
    // Fetch all data in parallel
    Promise.all([
      fetch('/api/person/solde/stats').then(r => r.json()),
      fetch('/api/person/solde/negative?limit=10&page=1').then(r => r.json()),
      fetch('/api/person/solde/positive?limit=10&page=1').then(r => r.json())
    ]).then(([statsRes, negativeRes, positiveRes]) => {
      setStats(statsRes.data);
      setNegativePersons(negativeRes.data);
      setPositivePersons(positiveRes.data);
    });
  }, []);

  return (
    <div>
      <h1>Solde Dashboard</h1>
      
      {stats && (
        <div className="stats">
          <div>Total Solde: {stats.totalSolde}€</div>
          <div>Average: {stats.avgSolde.toFixed(2)}€</div>
          <div>Persons with Debt: {stats.negativeCount}</div>
          <div>Persons with Credit: {stats.positiveCount}</div>
        </div>
      )}

      <div className="columns">
        <div className="negative">
          <h2>Top Debts</h2>
          {negativePersons.map(p => (
            <div key={p._id}>
              {p.nom} {p.prenom}: {p.solde}€
            </div>
          ))}
        </div>

        <div className="positive">
          <h2>Top Credits</h2>
          {positivePersons.map(p => (
            <div key={p._id}>
              {p.nom} {p.prenom}: {p.solde}€
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Example 4: Data Table with All Features

```javascript
function AdvancedPersonTable() {
  const [persons, setPersons] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    field: 'nom',
    order: 'asc'
  });
  const [filters, setFilters] = useState({
    active: '',
    search: ''
  });

  const fetchPersons = async (page = 1) => {
    setLoading(true);
    
    const params = new URLSearchParams({
      limit: '50',
      page: String(page),
      sortBy: sortConfig.field,
      sortOrder: sortConfig.order
    });

    if (filters.active) params.append('active', filters.active);
    if (filters.search) params.append('nom', filters.search);

    try {
      const response = await fetch(`/api/person?${params}`);
      const result = await response.json();
      setPersons(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons(1);
  }, [sortConfig, filters]);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div>
      {/* Filters */}
      <div className="toolbar">
        <input
          placeholder="Search by name..."
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          value={filters.active}
          onChange={e => setFilters({ ...filters, active: e.target.value })}
        >
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Info */}
      {pagination && (
        <div className="info">
          Showing {pagination.count} of {pagination.total} persons
        </div>
      )}

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('nom')}>
              Name {sortConfig.field === 'nom' && (sortConfig.order === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('email')}>
              Email {sortConfig.field === 'email' && (sortConfig.order === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('solde')}>
              Solde {sortConfig.field === 'solde' && (sortConfig.order === 'asc' ? '↑' : '↓')}
            </th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={4}>Loading...</td></tr>
          ) : (
            persons.map(person => (
              <tr key={person._id}>
                <td>{person.nom} {person.prenom}</td>
                <td>{person.email}</td>
                <td>{person.solde || 0}€</td>
                <td>{person.active ? '✓' : '✗'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && (
        <div className="pagination">
          <button
            disabled={!pagination.hasPrevious || loading}
            onClick={() => fetchPersons(pagination.previousPage)}
          >
            Previous
          </button>
          
          <div className="pages">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = Math.max(1, pagination.page - 2) + i;
              if (page > pagination.totalPages) return null;
              return (
                <button
                  key={page}
                  className={page === pagination.page ? 'active' : ''}
                  onClick={() => fetchPersons(page)}
                  disabled={loading}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            disabled={!pagination.hasMore || loading}
            onClick={() => fetchPersons(pagination.nextPage)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## ✅ Testing Checklist

### Manual Testing

- [ ] **Basic pagination**
  - [ ] Load first page with default parameters
  - [ ] Navigate to page 2, 3, etc.
  - [ ] Verify data changes between pages
  - [ ] Check pagination metadata (total, count, hasMore, etc.)

- [ ] **Sorting**
  - [ ] Sort by name (ascending)
  - [ ] Sort by name (descending)
  - [ ] Sort by different fields (email, solde, etc.)
  - [ ] Verify sort order in response

- [ ] **Filtering**
  - [ ] Filter by active status (true/false)
  - [ ] Filter by copro ID
  - [ ] Search by name (partial match)
  - [ ] Combine multiple filters

- [ ] **Edge cases**
  - [ ] Request page beyond total pages
  - [ ] Use limit > 1000 (should cap at 1000)
  - [ ] Use limit < 1 (should default to 100)
  - [ ] Empty results (e.g., search for non-existent name)
  - [ ] Single result
  - [ ] Invalid ObjectId format

- [ ] **Performance**
  - [ ] Response time < 500ms for normal queries
  - [ ] Payload size reasonable (< 100KB for 100 records)
  - [ ] No memory leaks on pagination navigation

- [ ] **UI/UX**
  - [ ] Loading states display correctly
  - [ ] Pagination controls disabled appropriately
  - [ ] Error messages display properly
  - [ ] Page transitions smooth
  - [ ] Total count updates correctly

### Automated Testing

```javascript
// Example Jest tests

describe('Person API Pagination', () => {
  it('should return paginated data', async () => {
    const response = await fetch('/api/person?limit=10&page=1');
    const result = await response.json();
    
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(Array);
    expect(result.pagination).toBeDefined();
    expect(result.pagination.limit).toBe(10);
    expect(result.pagination.page).toBe(1);
  });

  it('should filter by active status', async () => {
    const response = await fetch('/api/person?active=true&limit=50');
    const result = await response.json();
    
    result.data.forEach(person => {
      expect(person.active).toBe(true);
    });
  });

  it('should sort correctly', async () => {
    const response = await fetch('/api/person?sortBy=nom&sortOrder=asc&limit=10');
    const result = await response.json();
    
    const names = result.data.map(p => p.nom);
    const sortedNames = [...names].sort();
    expect(names).toEqual(sortedNames);
  });

  it('should handle invalid page gracefully', async () => {
    const response = await fetch('/api/person?page=9999&limit=10');
    const result = await response.json();
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(result.pagination.count).toBe(0);
  });
});
```

---

## 🚨 Important Notes

### Breaking Changes
1. **Response structure changed**: All paginated endpoints now return `{ success, data, pagination }` instead of array
2. **Existing API calls will break**: Must update to access `result.data` instead of `result`
3. **No backward compatibility mode**: Old format is no longer supported

### Performance Recommendations
1. **Use appropriate limits**:
   - Tables: 50-100 records
   - Dropdowns: 20-50 records  
   - Infinite scroll: 20-30 records per batch
   
2. **Implement caching**: Cache paginated results to avoid redundant requests

3. **Add loading states**: Always show loading indicators during fetch

4. **Debounce search inputs**: Wait 300-500ms after user stops typing before searching

### Best Practices
1. Always specify `limit` and `page` parameters
2. Handle loading and error states gracefully
3. Display total count and current range to users
4. Implement keyboard navigation for pagination (arrow keys)
5. Use URL query params to maintain pagination state (for bookmarking/sharing)
6. Consider implementing virtual scrolling for very large lists

---

## 📞 Support

### Questions or Issues?
- **Backend Team**: Contact regarding API behavior, performance issues
- **Documentation**: This document will be updated as needed
- **Testing**: Use the provided test endpoints in development environment

### Development Environment
- **Base URL**: `http://localhost:3000/api` (or your dev server)
- **Test Data**: Development database has ~500 test persons

### Useful Tools
- **Postman Collection**: Available in `/docs/postman` (if applicable)
- **API Explorer**: Available at `/api-docs` (if Swagger is configured)

---

## 📝 Changelog

### Version 2.0 (November 24, 2025)
- ✅ Implemented pagination for all person endpoints
- ✅ Added query parameters for sorting and filtering
- ✅ Created pagination helper utilities
- ✅ Added new `/person/solde/stats` endpoint
- ✅ Updated all person service and controller functions
- ⚠️ **Breaking Change**: Response format changed to include pagination metadata

### Future Enhancements (Planned)
- Pagination for Copropriete endpoints
- Pagination for SuiviFichen endpoints
- Pagination for Script endpoints
- Pagination for Trello endpoints
- GraphQL support (TBD)

---

## 🔗 Complete API Endpoint Reference

### Modern Endpoints (Recommended)
These cleaner URLs are recommended for new implementations:

```bash
# List persons with pagination
GET /person?limit=50&page=1&sortBy=nom&sortOrder=asc&active=true

# List persons with copro details
GET /person/copro?limit=50&page=1

# Get single person
GET /person/getPerson/:id

# Solde endpoints
GET /person/solde/negative?limit=50&page=1
GET /person/solde/positive?limit=50&page=1
GET /person/solde/stats
POST /person/:id/solde
```

### Legacy Endpoints (Backward Compatible)
These endpoints still work but are deprecated:

```bash
# Legacy list endpoints
GET /person/getAllPersons?limit=50&page=1
GET /person/getAllPersonsWithCopro?limit=50&page=1
GET /person/countAllPersons
GET /person/getPersonsByCoproId/:idCopro
```

### Production URL
```
Base URL: https://coprox-dashboard-back.vercel.app
Example: https://coprox-dashboard-back.vercel.app/person/copro?page=1&limit=50&sortBy=nom&sortOrder=asc
```

### ⚠️ Important Production Notes

#### Serverless Function Timeouts
- **Vercel Hobby Plan**: 10 seconds max execution time
- **Vercel Pro Plan**: 60 seconds max execution time (configured)
- Long-running operations (like script cleanup) are optimized with batch processing
- If you encounter 504 timeout errors, use smaller batch sizes: `?limit=25`

#### Script Cleanup Endpoint
```bash
# Cleanup stale scripts (processes up to 50 scripts per request)
POST /script/cleanup-stale

# Use smaller batches if timeout occurs
POST /script/cleanup-stale?limit=25

# Response indicates if more scripts need processing
{
  "success": true,
  "data": {
    "totalLogsUpdated": 5,
    "scriptsAffected": 2,
    "hasMore": true,
    "remaining": 23
  },
  "message": "Processed 50 scripts. 23 more need processing. Call again to continue."
}
```

---

**Last Updated:** November 24, 2025  
**Document Version:** 1.2  
**Maintained By:** Backend Team
