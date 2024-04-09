// src/app.js
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
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

const zendeskService = require('./src/services/zendeskService.js');

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
app.use('/script', scriptRoutes);

app.get('/batch', (req, res) => {
  res.send('Cron test is running!');
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
