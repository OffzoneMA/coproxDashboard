// src/app.js
const cors = require('cors');
const cron = require('node-cron');
const express = require('express');
const bodyParser = require('body-parser');
const trelloRoutes = require('./routes/trelloRoutes.js');
const coproRoutes = require('./routes/coproRoutes.js');
const LebarocoproRoutes = require('./routes/lebarocoproRoutes.js');
const vilogiRoutes = require('./routes/vilogiRoutes.js');
const personRoutes = require('./routes/personRoutes.js')
const zendeskRoutes = require('./routes/zendeskRoutes');
const synchroUsers = require('./cron/synchoUsers');


const app = express();
const port = 8081;

app.use(cors());
app.use(bodyParser.json());

app.use('/trello', trelloRoutes);
app.use('/zendesk', zendeskRoutes);
app.use('/copro', coproRoutes);
app.use('/Lebarocopro', LebarocoproRoutes);
app.use('/person', personRoutes);
app.use('/vilogi', vilogiRoutes);
app.use('/mongodb', trelloRoutes);
app.get('/batch', (req, res) => {
  synchroUsers.start();
  res.send('Cron test is running!');
});


cron.schedule('* * * * *', () => {
  //synchroUsers.start();
  console.log('Cron job is running!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
