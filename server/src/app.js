// src/app.js
const cors = require('cors');
const cron = require('node-cron');
const express = require('express');
const bodyParser = require('body-parser');
const trelloRoutes = require('./routes/trelloRoutes.js');
const coproRoutes = require('./routes/coproRoutes.js');
const LebarocoproRoutes = require('./routes/lebarocoproRoutes.js');
const suiviAGRoutes = require('./routes/suiviAgRoutes.js');
const vilogiRoutes = require('./routes/vilogiRoutes.js');
const personRoutes = require('./routes/personRoutes.js');
const zendeskRoutes = require('./routes/zendeskRoutes');
const synchroCopro = require('./cron/synchroCopro');
const synchroUsers = require('./cron/synchoUsers');
const zendeskTicket = require('./cron/zendeskTicket');
const zendeskTicketAI = require('./cron/zendeskTicketAI');
const extractContratsEntretien = require('./cron/extractContratsEntretien');
const syncZendeskTags = require('./cron/syncZendeskTags');
const zendeskTicketDocuments = require('./cron/zendeskTicketDocuments');



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
app.use('/vilogi', vilogiRoutes);
app.use('/mongodb', trelloRoutes);
app.get('/batch', (req, res) => {
  zendeskTicketAI.start();
  res.send('Cron test is running!');
});

cron.schedule('0 12 * * *', () => {
  zendeskTicket.start();
});

cron.schedule('0 0 * * 0', () => {
  synchroCopro.start();
  synchroUsers.start();
});



cron.schedule('0 0 * * *', () => {
  console.log("-------------------------Starting Zendesk Ticket AI--------------------------------------------")
  zendeskTicketAI.start();
  
  console.log("-------------------------Ending Zendesk Ticket AI--------------------------------------------")
});

// Schedule a task at 10 AM every day
cron.schedule('0 11 * * *', () => {
  syncZendeskTags.start();

});

// Schedule a task at 3 PM every day
cron.schedule('0 15 * * *', () => {
  syncZendeskTags.start();

});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
