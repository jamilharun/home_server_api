const express = require('express');
const bodyParser = require('body-parser');

const redisRoutes = require('./src/redis/routes');
const userRoutes = require('./src/user/routes');
const orderRoutes = require('./src/order/routes');
const pay = require('./src/lib/paymongo');

const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors()); 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// the databases used in this api 
app.use("/api/postgres", orderRoutes);
app.use("/api/postgres", userRoutes);
app.use("/api/sanity", redisRoutes);
app.use("/api/paymongo", pay)

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});