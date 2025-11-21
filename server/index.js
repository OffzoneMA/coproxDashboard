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

const scheduleCronJobs = require('./src/cron/cronStart.js');
const batch = require('./src/cron/synchroRapelles.js');

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

app.get('/batch', (req, res) => {
  batch.start();
  res.send('Cron test is running!');
});

scheduleCronJobs();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



module.exports = app;
