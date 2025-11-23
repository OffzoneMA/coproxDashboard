const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
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
const cronConfigRoutes = require('./src/routes/cronConfigRoutes.js');
const prestataireRoutes = require('./src/routes/prestataireRoutes.js');

const scheduleCronJobs = require('./src/cron/cronStart.js');
const batch = require('./src/cron/synchroPrestataire.js');

// Import comprehensive metrics configuration
const { 
  prometheusMiddleware, 
  setupMetricsEndpoint, 
  setupHealthEndpoint,
  trackServiceFunction 
} = require('./src/config/metrics');

const app = express();
const port = 8081;

app.use(cors());
app.use(bodyParser.json());

// Setup Prometheus metrics middleware
prometheusMiddleware(app);

// Setup metrics and health endpoints
setupMetricsEndpoint(app);
setupHealthEndpoint(app);

// Chargement dynamique des services
const services = fs.readdirSync(path.join(__dirname, 'src/services'))
.filter(file => file.endsWith('.js'))
.map(file => require(`./src/services/${file}`));

// Instrumentation des services avec métriques avancées
services.forEach((service, index) => {
  const serviceName = path.basename(fs.readdirSync(path.join(__dirname, 'src/services'))[index], '.js');
  
  Object.keys(service).forEach(fnName => {
    if (typeof service[fnName] === 'function') {
      service[fnName] = trackServiceFunction(serviceName, service[fnName], 'CALL', fnName);
    }
  });
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
app.use('/cron-config', cronConfigRoutes);
app.use('/prestataire', prestataireRoutes);

app.get('/batch', (req, res) => {
  batch.start();
  res.send('Cron test is running!');
});

// ⚠️ IMPORTANT: Do NOT run cron jobs on Vercel (serverless environment)
// Cron execution should only happen on a dedicated server with persistent process
// Vercel is ONLY for API endpoints (configuration and monitoring)
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
const isServerless = process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_NAME;

if (isVercel || isServerless) {
  console.log('========================================');
  console.log('⚠️  SERVERLESS ENVIRONMENT DETECTED');
  console.log('⚠️  Cron execution is DISABLED');
  console.log('⚠️  This instance only serves API endpoints');
  console.log('⚠️  Run cron jobs on a dedicated server');
  console.log('========================================');
} else {
  console.log('========================================');
  console.log('✓ Regular server environment detected');
  console.log('✓ Initializing cron system...');
  console.log('========================================');
  scheduleCronJobs();
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



module.exports = app;
