// Pagination utilities for MongoDB queries
// Provides consistent pagination across all endpoints

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Express request.query object
 * @param {Object} defaults - Default values for pagination
 * @returns {Object} Parsed pagination options
 */
function parsePaginationParams(query = {}, defaults = {}) {
  const {
    defaultLimit = 100,
    defaultPage = 1,
    defaultSortField = 'createdAt',
    defaultSortOrder = 'desc',
    maxLimit = 1000
  } = defaults;

  const limit = Math.min(
    parseInt(query.limit) || defaultLimit,
    maxLimit
  );
  const page = Math.max(parseInt(query.page) || defaultPage, 1);
  const skip = (page - 1) * limit;
  
  const sortField = query.sortBy || defaultSortField;
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortOrder };

  return {
    limit,
    page,
    skip,
    sort,
    sortField,
    sortOrder: query.sortOrder || defaultSortOrder
  };
}

/**
 * Build pagination response object
 * @param {Array} data - The data array
 * @param {number} total - Total count of documents
 * @param {Object} params - Pagination parameters
 * @returns {Object} Formatted response with data and pagination info
 */
function buildPaginationResponse(data, total, params) {
  const { limit, skip, page } = params;
  
  return {
    success: true,
    data,
    pagination: {
      total,
      count: data.length,
      page,
      limit,
      skip,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + data.length < total,
      hasPrevious: page > 1,
      nextPage: skip + data.length < total ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null
    }
  };
}

/**
 * Execute paginated MongoDB query
 * @param {Collection} collection - MongoDB collection
 * @param {Object} query - MongoDB query object
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated result
 */
async function executePaginatedQuery(collection, query = {}, options = {}) {
  const {
    limit = 100,
    skip = 0,
    sort = { createdAt: -1 },
    projection = {}
  } = options;

  // Build cursor
  let cursor = collection.find(query);
  
  // Apply projection if specified
  if (Object.keys(projection).length > 0) {
    cursor = cursor.project(projection);
  }
  
  // Apply sorting, skip, and limit
  cursor = cursor.sort(sort).skip(skip).limit(limit);
  
  // Execute query and get total count in parallel
  const [data, total] = await Promise.all([
    cursor.toArray(),
    collection.countDocuments(query)
  ]);

  return {
    data,
    total,
    count: data.length
  };
}

/**
 * Parse filter parameters from query string
 * @param {Object} query - Express request.query object
 * @param {Array} allowedFilters - Array of allowed filter fields
 * @returns {Object} MongoDB filter object
 */
function parseFilterParams(query = {}, allowedFilters = []) {
  const filter = {};
  
  allowedFilters.forEach(field => {
    if (query[field] !== undefined) {
      // Handle boolean filters
      if (query[field] === 'true') {
        filter[field] = true;
      } else if (query[field] === 'false') {
        filter[field] = false;
      } else {
        filter[field] = query[field];
      }
    }
  });
  
  return filter;
}

/**
 * Validate pagination parameters
 * @param {Object} params - Pagination parameters
 * @throws {Error} If parameters are invalid
 */
function validatePaginationParams(params) {
  const { limit, page, skip } = params;
  
  if (limit < 1) {
    throw new Error('Limit must be greater than 0');
  }
  
  if (page < 1) {
    throw new Error('Page must be greater than 0');
  }
  
  if (skip < 0) {
    throw new Error('Skip must be greater than or equal to 0');
  }
}

module.exports = {
  parsePaginationParams,
  buildPaginationResponse,
  executePaginatedQuery,
  parseFilterParams,
  validatePaginationParams
};
