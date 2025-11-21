const promClient = require('prom-client');
const fs = require('fs');
const path = require('path');

// ==================== PROMETHEUS REGISTRY ====================
const register = new promClient.Registry();

// Add default labels to all metrics
register.setDefaultLabels({
  app: process.env.APP_NAME || 'nodejs_application',
  environment: process.env.NODE_ENV || 'development',
  instance: process.env.HOSTNAME || require('os').hostname(),
  version: process.env.APP_VERSION || '1.0.0'
});

// ==================== DEFAULT SYSTEM METRICS ====================
promClient.collectDefaultMetrics({ 
  register,
  prefix: 'nodejs_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  labels: { app: process.env.APP_NAME || 'nodejs_application' }
});

// ==================== HTTP METRICS (CRITICAL) ====================

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'endpoint', 'status', 'status_class'],
  registers: [register]
});

const httpRequestDurationSeconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'endpoint', 'status', 'status_class'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 30],
  registers: [register]
});

const httpRequestsInFlight = new promClient.Gauge({
  name: 'http_requests_in_flight',
  help: 'Current number of active HTTP requests',
  labelNames: ['method', 'endpoint'],
  registers: [register]
});

const httpRequestsErrorsTotal = new promClient.Counter({
  name: 'http_requests_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'endpoint', 'status', 'error_type'],
  registers: [register]
});

const httpResponseSizeBytes = new promClient.Histogram({
  name: 'http_response_size_bytes',
  help: 'HTTP response size in bytes',
  labelNames: ['method', 'endpoint', 'status'],
  buckets: [100, 1000, 10000, 100000, 1000000, 5000000],
  registers: [register]
});

// ==================== HEALTH METRICS (CRITICAL) ====================

const healthCheckStatus = new promClient.Gauge({
  name: 'health_check_status',
  help: 'Application health status (1 = healthy, 0 = unhealthy)',
  labelNames: ['check_type'],
  registers: [register]
});

const applicationReady = new promClient.Gauge({
  name: 'application_ready',
  help: 'Application readiness indicator (1 = ready, 0 = not ready)',
  registers: [register]
});

const serviceStatus = new promClient.Gauge({
  name: 'service_status',
  help: 'Dependent service status (1 = up, 0 = down)',
  labelNames: ['service_name', 'service_type'],
  registers: [register]
});

// ==================== SERVICE/BUSINESS LOGIC METRICS (HIGH) ====================

const serviceRequestCounter = new promClient.Counter({
  name: 'service_api_calls_total',
  help: 'Total number of service function calls',
  labelNames: ['service', 'method', 'function', 'status'],
  registers: [register]
});

const serviceExecutionTimeSeconds = new promClient.Histogram({
  name: 'service_execution_time_seconds',
  help: 'Service function execution time in seconds',
  labelNames: ['service', 'method', 'function', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

const serviceErrorsTotal = new promClient.Counter({
  name: 'service_errors_total',
  help: 'Total number of service errors',
  labelNames: ['service', 'method', 'function', 'error_type'],
  registers: [register]
});

const serviceRetryAttempts = new promClient.Counter({
  name: 'service_retry_attempts_total',
  help: 'Total number of service retry attempts',
  labelNames: ['service', 'method', 'function'],
  registers: [register]
});

// ==================== DATABASE METRICS (HIGH) ====================

const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query execution time',
  labelNames: ['database', 'operation', 'collection', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const dbConnectionPool = new promClient.Gauge({
  name: 'db_connection_pool_size',
  help: 'Database connection pool size',
  labelNames: ['database', 'state'],
  registers: [register]
});

const dbOperationsTotal = new promClient.Counter({
  name: 'db_operations_total',
  help: 'Total number of database operations',
  labelNames: ['database', 'operation', 'collection', 'status'],
  registers: [register]
});

const dbErrorsTotal = new promClient.Counter({
  name: 'db_errors_total',
  help: 'Total number of database errors',
  labelNames: ['database', 'operation', 'error_type'],
  registers: [register]
});

// ==================== CACHE METRICS (MEDIUM) ====================

const cacheOperationsDuration = new promClient.Histogram({
  name: 'cache_operations_duration_seconds',
  help: 'Cache operation duration',
  labelNames: ['operation', 'cache_type', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
  registers: [register]
});

const cacheHitsTotal = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type', 'key_pattern'],
  registers: [register]
});

const cacheMissesTotal = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type', 'key_pattern'],
  registers: [register]
});

const cacheSizeBytes = new promClient.Gauge({
  name: 'cache_size_bytes',
  help: 'Current cache size in bytes',
  labelNames: ['cache_type'],
  registers: [register]
});

// ==================== EXTERNAL API METRICS (MEDIUM) ====================

const externalApiCallsTotal = new promClient.Counter({
  name: 'external_api_calls_total',
  help: 'Total number of external API calls',
  labelNames: ['api_name', 'endpoint', 'method', 'status'],
  registers: [register]
});

const externalApiDuration = new promClient.Histogram({
  name: 'external_api_duration_seconds',
  help: 'External API call duration',
  labelNames: ['api_name', 'endpoint', 'method', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register]
});

const externalApiErrorsTotal = new promClient.Counter({
  name: 'external_api_errors_total',
  help: 'Total number of external API errors',
  labelNames: ['api_name', 'endpoint', 'error_type'],
  registers: [register]
});

// ==================== BUSINESS METRICS (HIGH) ====================

const businessOperationsTotal = new promClient.Counter({
  name: 'business_operations_total',
  help: 'Total number of business operations',
  labelNames: ['operation', 'status', 'type'],
  registers: [register]
});

const activeUsersGauge = new promClient.Gauge({
  name: 'users_active_total',
  help: 'Number of currently active users',
  labelNames: ['user_type', 'platform'],
  registers: [register]
});

const userActionsTotal = new promClient.Counter({
  name: 'user_actions_total',
  help: 'Total number of user actions',
  labelNames: ['action_type', 'user_type', 'status'],
  registers: [register]
});

// ==================== ERROR & OBSERVABILITY METRICS (MEDIUM) ====================

const applicationErrorsTotal = new promClient.Counter({
  name: 'application_errors_total',
  help: 'Total number of application errors',
  labelNames: ['error_type', 'error_code', 'component', 'severity'],
  registers: [register]
});

const logEntriesTotal = new promClient.Counter({
  name: 'log_entries_total',
  help: 'Total number of log entries',
  labelNames: ['level', 'component'],
  registers: [register]
});

// ==================== UTILITY FUNCTIONS ====================

/**
 * Normalize route path to avoid cardinality explosion
 * Converts /users/123 to /users/:id
 */
function normalizeRoutePath(path, baseRoute = null) {
  if (baseRoute) return baseRoute;
  
  return path
    .replace(/\/[0-9a-f]{24}/gi, '/:id') // MongoDB ObjectId
    .replace(/\/\d+/g, '/:id') // Numeric IDs
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid') // UUIDs
    .replace(/\?.*/g, ''); // Remove query params
}

/**
 * Get HTTP status class (2xx, 3xx, 4xx, 5xx)
 */
function getStatusClass(statusCode) {
  return `${Math.floor(statusCode / 100)}xx`;
}

/**
 * Determine error type from status code or error object
 */
function getErrorType(statusCode, error = null) {
  if (error) {
    if (error.name === 'ValidationError') return 'validation_error';
    if (error.name === 'TimeoutError') return 'timeout';
    if (error.name === 'NetworkError') return 'network_error';
    if (error.code === 'ECONNREFUSED') return 'connection_refused';
    if (error.code === 'ETIMEDOUT') return 'timeout';
  }
  
  if (statusCode >= 500) return 'server_error';
  if (statusCode >= 400) return 'client_error';
  return 'unknown';
}

// ==================== HTTP MIDDLEWARE ====================

/**
 * Express middleware for HTTP request tracking
 * All HTTP metrics are automatically collected and exposed via /metrics
 */
function prometheusMiddleware(app) {
  app.use((req, res, next) => {
    // Skip metrics endpoint itself
    if (req.path === '/metrics') {
      return next();
    }

    const startTime = process.hrtime.bigint();
    const route = normalizeRoutePath(req.path, req.route?.path);
    
    // Track in-flight requests
    httpRequestsInFlight.labels(req.method, route).inc();
    
    // Capture response size
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;
    
    let responseSize = 0;
    
    res.send = function(data) {
      if (data) {
        responseSize = Buffer.byteLength(typeof data === 'string' ? data : JSON.stringify(data));
      }
      return originalSend.apply(res, arguments);
    };
    
    res.json = function(data) {
      if (data) {
        responseSize = Buffer.byteLength(JSON.stringify(data));
      }
      return originalJson.apply(res, arguments);
    };
    
    res.end = function(data) {
      if (data) {
        responseSize = Buffer.byteLength(typeof data === 'string' ? data : JSON.stringify(data));
      }
      return originalEnd.apply(res, arguments);
    };
    
    // Track metrics on response finish
    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const durationSeconds = Number(endTime - startTime) / 1e9;
      const statusClass = getStatusClass(res.statusCode);
      
      // Record all HTTP metrics
      httpRequestsTotal.labels(req.method, route, res.statusCode, statusClass).inc();
      httpRequestDurationSeconds.labels(req.method, route, res.statusCode, statusClass).observe(durationSeconds);
      httpRequestsInFlight.labels(req.method, route).dec();
      
      if (responseSize > 0) {
        httpResponseSizeBytes.labels(req.method, route, res.statusCode).observe(responseSize);
      }
      
      // Track errors
      if (res.statusCode >= 400) {
        const errorType = getErrorType(res.statusCode);
        httpRequestsErrorsTotal.labels(req.method, route, res.statusCode, errorType).inc();
      }
    });
    
    // Handle connection close/error
    res.on('close', () => {
      if (!res.finished) {
        httpRequestsInFlight.labels(req.method, route).dec();
      }
    });
    
    next();
  });
}

// ==================== METRICS ENDPOINT ====================

/**
 * Setup the /metrics endpoint that exposes ALL Prometheus metrics
 * This is the single endpoint that Prometheus will scrape
 */
function setupMetricsEndpoint(app) {
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.end(metrics);
    } catch (error) {
      console.error('Error generating metrics:', error);
      res.status(500).end(error.message);
    }
  });
}

// ==================== HEALTH CHECK (Optional separate endpoint) ====================

/**
 * Setup health check endpoint (optional, not part of metrics)
 */
function setupHealthEndpoint(app) {
  app.get('/health', (req, res) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        overall: 'pass'
      }
    };
    
    // Update health metrics (will be included in /metrics)
    healthCheckStatus.labels('overall').set(1);
    applicationReady.set(1);
    
    res.status(200).json(health);
  });
}

// ==================== SERVICE INSTRUMENTATION ====================

/**
 * Instrument a service function to track metrics
 * Metrics are automatically included in /metrics endpoint
 */
function trackServiceFunction(serviceName, fn, method, functionName) {
  return async function(...args) {
    const startTime = process.hrtime.bigint();
    let status = 'success';
    let errorType = null;
    
    try {
      const result = await fn.apply(this, args);
      serviceRequestCounter.labels(serviceName, method, functionName, status).inc();
      return result;
      
    } catch (error) {
      status = 'error';
      errorType = error.name || 'UnknownError';
      
      serviceErrorsTotal.labels(serviceName, method, functionName, errorType).inc();
      serviceRequestCounter.labels(serviceName, method, functionName, status).inc();
      
      throw error;
      
    } finally {
      const endTime = process.hrtime.bigint();
      const durationSeconds = Number(endTime - startTime) / 1e9;
      
      serviceExecutionTimeSeconds
        .labels(serviceName, method, functionName, status)
        .observe(durationSeconds);
    }
  };
}

/**
 * Instrument database operations
 * Metrics are automatically included in /metrics endpoint
 */
function trackDatabaseOperation(database, operation, collection, fn) {
  return async function(...args) {
    const startTime = process.hrtime.bigint();
    let status = 'success';
    
    try {
      const result = await fn.apply(this, args);
      dbOperationsTotal.labels(database, operation, collection, status).inc();
      return result;
      
    } catch (error) {
      status = 'error';
      const errorType = error.name || 'UnknownError';
      
      dbErrorsTotal.labels(database, operation, errorType).inc();
      dbOperationsTotal.labels(database, operation, collection, status).inc();
      
      throw error;
      
    } finally {
      const endTime = process.hrtime.bigint();
      const durationSeconds = Number(endTime - startTime) / 1e9;
      
      dbQueryDuration
        .labels(database, operation, collection, status)
        .observe(durationSeconds);
    }
  };
}

/**
 * Track cache operations
 * Metrics are automatically included in /metrics endpoint
 */
function trackCacheOperation(cacheType, operation, fn) {
  return async function(...args) {
    const startTime = process.hrtime.bigint();
    let status = 'success';
    
    try {
      const result = await fn.apply(this, args);
      
      // Track hits/misses for GET operations
      if (operation === 'get') {
        if (result !== null && result !== undefined) {
          cacheHitsTotal.labels(cacheType, 'pattern').inc();
        } else {
          cacheMissesTotal.labels(cacheType, 'pattern').inc();
        }
      }
      
      return result;
      
    } catch (error) {
      status = 'error';
      throw error;
      
    } finally {
      const endTime = process.hrtime.bigint();
      const durationSeconds = Number(endTime - startTime) / 1e9;
      
      cacheOperationsDuration
        .labels(operation, cacheType, status)
        .observe(durationSeconds);
    }
  };
}

/**
 * Track external API calls
 * Metrics are automatically included in /metrics endpoint
 */
function trackExternalApiCall(apiName, endpoint, method, fn) {
  return async function(...args) {
    const startTime = process.hrtime.bigint();
    let status = 'success';
    
    try {
      const result = await fn.apply(this, args);
      externalApiCallsTotal.labels(apiName, endpoint, method, status).inc();
      return result;
      
    } catch (error) {
      status = 'error';
      const errorType = error.name || 'UnknownError';
      
      externalApiErrorsTotal.labels(apiName, endpoint, errorType).inc();
      externalApiCallsTotal.labels(apiName, endpoint, method, status).inc();
      
      throw error;
      
    } finally {
      const endTime = process.hrtime.bigint();
      const durationSeconds = Number(endTime - startTime) / 1e9;
      
      externalApiDuration
        .labels(apiName, endpoint, method, status)
        .observe(durationSeconds);
    }
  };
}

// ==================== EXPORTS ====================

module.exports = {
  register,
  prometheusMiddleware,
  setupMetricsEndpoint,
  setupHealthEndpoint,
  trackServiceFunction,
  trackDatabaseOperation,
  trackCacheOperation,
  trackExternalApiCall,
  
  // Export individual metrics for custom tracking
  metrics: {
    // HTTP
    httpRequestsTotal,
    httpRequestDurationSeconds,
    httpRequestsInFlight,
    httpRequestsErrorsTotal,
    httpResponseSizeBytes,
    
    // Health
    healthCheckStatus,
    applicationReady,
    serviceStatus,
    
    // Services
    serviceRequestCounter,
    serviceExecutionTimeSeconds,
    serviceErrorsTotal,
    serviceRetryAttempts,
    
    // Database
    dbQueryDuration,
    dbConnectionPool,
    dbOperationsTotal,
    dbErrorsTotal,
    
    // Cache
    cacheOperationsDuration,
    cacheHitsTotal,
    cacheMissesTotal,
    cacheSizeBytes,
    
    // External APIs
    externalApiCallsTotal,
    externalApiDuration,
    externalApiErrorsTotal,
    
    // Business
    businessOperationsTotal,
    activeUsersGauge,
    userActionsTotal,
    
    // Errors
    applicationErrorsTotal,
    logEntriesTotal
  }
};
