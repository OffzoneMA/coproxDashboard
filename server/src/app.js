// src/app.js
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const trelloRoutes = require('./routes/trelloRoutes.js');
const mondayRoutes = require('./routes/mondayRoutes.js');
const coproRoutes = require('./routes/coproRoutes.js');
const LebarocoproRoutes = require('./routes/lebarocoproRoutes.js');
const suiviAGRoutes = require('./routes/suiviAgRoutes.js');
const vilogiRoutes = require('./routes/vilogiRoutes.js');
const personRoutes = require('./routes/personRoutes.js');
const suiviFicheRoutes = require('./routes/suiviFicheRoutes.js');
const zendeskRoutes = require('./routes/zendeskRoutes');

const zendeskService = require('./services/zendeskService');
const cronStart = require('./cron/cronStart');
const synchroContratEntretien = require('./cron/synchroContratEntretien');

const app = express();
const port = 8081;

app.use(cors());
app.use(bodyParser.json());

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

app.get('/batch', (req, res) => {
  synchroContratEntretien.start();
  res.send('Cron test is running!');
});

cronStart();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
