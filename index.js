const express = require('express');
const bodyParser = require('body-parser');

const redisRoutes = require('./src/redis/routes');
const userRoutes = require('./src/user/routes');
const orderRoutes = require('./src/order/routes');
const pay = require('./src/lib/paymongo');

const test = require('./src/test')
test.test()

const app = express();
const port = 3000;
// const hostname = '127.0.0.1'; //example hostname
 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((err, req, res, next) => {
  console.error(err); 
  res.status(500).send('Internal Server Error');
});
// the databases used in this api 
app.use("/api/postgres", orderRoutes);
app.use("/api/postgres", userRoutes);
app.use("/api/sanity", redisRoutes);
app.use("/api/paymongo", pay)

app.get('/', (req, res) => {
  res.send('it wotks')
})

//this is supposed to notify my when there are updated data in sanitydb
// SSE endpoint
app.get('/sse', (req, res) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Open a connection and send initial data (if needed)
  res.write('data: Initial data\n\n');

  // GROQ query to specify documents to listen for
  const groqQuery = '*[_updatedAt > $lastUpdate] | order(_updatedAt desc) [0..9]';
  const lastUpdate = new Date().toISOString();

  // Set up the listener for changes
  const listener = sanity.listen(groqQuery, { lastUpdate }).subscribe(update => {
    // Send the update to the client
    res.write(`data: ${JSON.stringify(update)}\n\n`);
  });

  // Handle connection close
  req.on('close', () => {
    listener.unsubscribe(); // Unsubscribe when the client closes the connection
    res.end();
  });
});



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
