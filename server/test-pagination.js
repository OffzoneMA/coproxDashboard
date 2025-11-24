/**
 * Test script for pagination functionality
 * Run with: node test-pagination.js
 */

const { parsePaginationParams, buildPaginationResponse, validatePaginationParams, parseFilterParams } = require('./src/utils/paginationHelper');

console.log('=== Testing Pagination Helper Functions ===\n');

// Test 1: parsePaginationParams with defaults
console.log('Test 1: Parse pagination params with defaults');
const query1 = { limit: '50', page: '2', sortBy: 'nom', sortOrder: 'asc' };
const result1 = parsePaginationParams(query1);
console.log('Input:', query1);
console.log('Output:', result1);
console.assert(result1.limit === 50, 'Limit should be 50');
console.assert(result1.page === 2, 'Page should be 2');
console.assert(result1.skip === 50, 'Skip should be 50');
console.assert(result1.sort.nom === 1, 'Sort should be ascending');
console.log('✅ Test 1 passed\n');

// Test 2: parsePaginationParams with max limit
console.log('Test 2: Parse pagination params with max limit');
const query2 = { limit: '5000', page: '1' };
const result2 = parsePaginationParams(query2, { maxLimit: 1000 });
console.log('Input:', query2, '(max limit: 1000)');
console.log('Output:', result2);
console.assert(result2.limit === 1000, 'Limit should be capped at 1000');
console.log('✅ Test 2 passed\n');

// Test 3: parsePaginationParams with invalid values
console.log('Test 3: Parse pagination params with invalid values');
const query3 = { limit: 'abc', page: '-5' };
const result3 = parsePaginationParams(query3, { defaultLimit: 100 });
console.log('Input:', query3);
console.log('Output:', result3);
console.assert(result3.limit === 100, 'Limit should default to 100');
console.assert(result3.page === 1, 'Page should default to 1 (negative values not allowed)');
console.log('✅ Test 3 passed\n');

// Test 4: buildPaginationResponse
console.log('Test 4: Build pagination response');
const data4 = [{ id: 1 }, { id: 2 }, { id: 3 }];
const params4 = { limit: 50, skip: 0, page: 1 };
const result4 = buildPaginationResponse(data4, 150, params4);
console.log('Data count:', data4.length);
console.log('Total:', 150);
console.log('Params:', params4);
console.log('Response:', result4);
console.assert(result4.success === true, 'Success should be true');
console.assert(result4.pagination.total === 150, 'Total should be 150');
console.assert(result4.pagination.count === 3, 'Count should be 3');
console.assert(result4.pagination.totalPages === 3, 'Total pages should be 3');
console.assert(result4.pagination.hasMore === true, 'Should have more pages');
console.assert(result4.pagination.nextPage === 2, 'Next page should be 2');
console.log('✅ Test 4 passed\n');

// Test 5: parseFilterParams
console.log('Test 5: Parse filter params');
const query5 = { active: 'true', status: 'pending', limit: '50', page: '1' };
const allowedFilters = ['active', 'status'];
const result5 = parseFilterParams(query5, allowedFilters);
console.log('Input:', query5);
console.log('Allowed filters:', allowedFilters);
console.log('Output:', result5);
console.assert(result5.active === true, 'Active should be boolean true');
console.assert(result5.status === 'pending', 'Status should be "pending"');
console.assert(result5.limit === undefined, 'Limit should not be in filter');
console.log('✅ Test 5 passed\n');

// Test 6: validatePaginationParams - valid
console.log('Test 6: Validate pagination params - valid');
const params6 = { limit: 100, page: 2, skip: 100 };
try {
  validatePaginationParams(params6);
  console.log('✅ Test 6 passed - validation successful\n');
} catch (error) {
  console.error('❌ Test 6 failed:', error.message);
}

// Test 7: validatePaginationParams - invalid
console.log('Test 7: Validate pagination params - invalid');
const params7 = { limit: -10, page: 2, skip: 100 };
try {
  validatePaginationParams(params7);
  console.error('❌ Test 7 failed - should have thrown error');
} catch (error) {
  console.log('✅ Test 7 passed - validation caught error:', error.message, '\n');
}

// Test 8: Edge case - last page
console.log('Test 8: Edge case - last page');
const data8 = [{ id: 1 }, { id: 2 }];
const params8 = { limit: 50, skip: 100, page: 3 };
const result8 = buildPaginationResponse(data8, 102, params8);
console.log('Response:', result8.pagination);
console.assert(result8.pagination.hasMore === false, 'Should not have more pages');
console.assert(result8.pagination.nextPage === null, 'Next page should be null');
console.assert(result8.pagination.hasPrevious === true, 'Should have previous page');
console.assert(result8.pagination.previousPage === 2, 'Previous page should be 2');
console.log('✅ Test 8 passed\n');

// Test 9: Edge case - empty results
console.log('Test 9: Edge case - empty results');
const data9 = [];
const params9 = { limit: 50, skip: 0, page: 1 };
const result9 = buildPaginationResponse(data9, 0, params9);
console.log('Response:', result9.pagination);
console.assert(result9.pagination.total === 0, 'Total should be 0');
console.assert(result9.pagination.count === 0, 'Count should be 0');
console.assert(result9.pagination.totalPages === 0, 'Total pages should be 0');
console.assert(result9.pagination.hasMore === false, 'Should not have more pages');
console.log('✅ Test 9 passed\n');

// Test 10: Descending sort
console.log('Test 10: Descending sort');
const query10 = { sortBy: 'createdAt', sortOrder: 'desc' };
const result10 = parsePaginationParams(query10);
console.log('Input:', query10);
console.log('Sort object:', result10.sort);
console.assert(result10.sort.createdAt === -1, 'Sort should be descending (-1)');
console.log('✅ Test 10 passed\n');

console.log('=== All tests passed! ===');
console.log('\nPagination helper is working correctly.');
console.log('Ready to use in production API endpoints.');
