// src/app.js
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const trelloRoutes = require('./routes/trelloRoutes.js');
const coproRoutes = require('./routes/coproRoutes.js');
const personRoutes = require('./routes/personRoutes');


const app = express();
const port = 8081;

app.use(cors());
app.use(bodyParser.json());
app.use('/trello', trelloRoutes);

app.use('/copro', coproRoutes);
app.use('/person', personRoutes);


app.use('/vilogi', trelloRoutes);
app.use('/mongodb', trelloRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
