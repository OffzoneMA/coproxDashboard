// src/app.js
const express = require('express');
const bodyParser = require('body-parser');
const trelloRoutes = require('./routes/trelloRoutes.js');

const app = express();
const port = 8081;

app.use(bodyParser.json());
app.use('/trello', trelloRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
