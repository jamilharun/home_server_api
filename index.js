const express = require('express');
const bodyParser = require('body-parser');

const pool = require('./src/lib/postgres');
const sanity = require('./src/lib/sanity');
const userRoutes = require('./src/user/routes');
// const { generateToken, verifyToken } = require('./src/utils/auth');
// const { generatedUID} = require('./genUid')

const app = express();
const port = 3000;
const hostname = '127.0.0.1'; //example hostname 

app.use(bodyParser.json());
app.use(express.json());

// the databases used in this api 
app.use("/api/postgres", userRoutes);
app.use("/api/sanity", sanity);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
