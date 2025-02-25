const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const client = require('prom-client');
const fs = require('fs');
const path = require('path');

const trelloRoutes = require('./src/routes/trelloRoutes.js');
const mondayRoutes = require('./src/routes/mondayRoutes.js');
const coproRoutes = require('./src/routes/coproRoutes.js');
const LebarocoproRoutes = require('./src/routes/lebarocoproRoutes.js');
const suiviAGRoutes = require('./src/routes/suiviAgRoutes.js');
const vilogiRoutes = require('./src/routes/vilogiRoutes.js');
const personRoutes = require('./src/routes/personRoutes.js');
const suiviFicheRoutes = require('./src/routes/suiviFicheRoutes.js');
const zendeskRoutes = require('./src/routes/zendeskRoutes.js');
const scriptRoutes = require('./src/routes/scriptRoutes.js');

const scheduleCronJobs = require('./src/cron/cronStart.js');
const batch = require('./src/cron/synchroVilogiMessages.js');

const app = express();
const port = 8081;

app.use(cors());
app.use(bodyParser.json());

// Prometheus Metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: "Durée des requêtes HTTP en secondes",
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});
register.registerMetric(httpRequestDurationMicroseconds);

// Middleware de mesure des requêtes
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationInSeconds = duration[0] + duration[1] / 1e9;
    httpRequestDurationMicroseconds.labels(req.method, req.path, res.statusCode).observe(durationInSeconds);
  });
  next();
});

// Exposer les métriques Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Routes API
app.use('/trello', trelloRoutes);
app.use('/zendesk', zendeskRoutes);
app.use('/copro', coproRoutes);
app.use('/Lebarocopro', LebarocoproRoutes);
app.use('/suiviAG', suiviAGRoutes);
app.use('/person', personRoutes);
app.use('/fiche', suiviFicheRoutes);
app.use('/vilogi', vilogiRoutes);
app.use('/mongodb', trelloRoutes);
app.use('/monday', mondayRoutes);
app.use('/script', scriptRoutes);

/// Chargement dynamique des services
const services = fs.readdirSync(path.join(__dirname, 'src/services'))
.filter(file => file.endsWith('.js'))
.map(file => require(`./src/services/${file}`));

// Instrumentation générique des services
const serviceRequestCounter = new client.Counter({
name: 'service_api_calls_total',
help: "Nombre total d'appels aux services",
labelNames: ['service', 'method', 'function']
});
register.registerMetric(serviceRequestCounter);

// Histogram for execution time
const serviceExecutionTime = new client.Histogram({
name: 'service_execution_time_seconds',
help: "Temps d'exécution des services en secondes",
labelNames: ['service', 'method', 'function'],
buckets: [0.1, 0.5, 1, 2, 5, 10] // Define buckets based on expected durations
});
register.registerMetric(serviceExecutionTime);

function trackServiceFunction(serviceName, fn, method, functionName) {
return async function (...args) {
  const start = process.hrtime(); // Start timing
  serviceRequestCounter.labels(serviceName, method, functionName).inc();

  try {
    return await fn(...args);
  } finally {
    const [seconds, nanoseconds] = process.hrtime(start);
    const durationInSeconds = seconds + nanoseconds / 1e9;
    serviceExecutionTime.labels(serviceName, method, functionName).observe(durationInSeconds);
  }
};
}

services.forEach((service, index) => {
const serviceName = path.basename(fs.readdirSync(path.join(__dirname, 'src/services'))[index], '.js'); // Get file name as service name

Object.keys(service).forEach(fnName => {
  if (typeof service[fnName] === 'function') {
    service[fnName] = trackServiceFunction(serviceName, service[fnName], 'CALL', fnName);
  }
});
});
app.get('/batch', (req, res) => {
  batch.start();
  res.send('Cron test is running!');
});

scheduleCronJobs();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
