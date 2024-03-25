const express = require('express');
const bodyParser = require('body-parser');

const redisRoutes = require('./src/redis/routes');
const userRoutes = require('./src/user/routes');
const orderRoutes = require('./src/order/routes');
const pay = require('./src/lib/paymongo');

// const test = require('./src/test')
// test.test()

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

app.get('/', async (req, res) => {
  const refs = ["015bd33a-5371-4d12-bb20-1ab8fd053d28","07d2115c-899c-4db1-a496-90b3491c1ac2"]
  const result = await fetchItems(refs)
  // Send the result as JSON response
  res.json(result);
});


async function fetchItems(itemRefs) {
  try {
      const redisItems = await Promise.all(itemRefs.map(itemRef => {redisClient.get(itemRef)}));
      // console.log(redisItems);
      if (redisItems) {
          console.log(redisItems);
          console.log('gonna fetch from sanity');
      } else {
          console.log(redisItems);
          console.log('gonna fetch from redis');
      }
          
      // }
      // if (redisItems.every(item => item !== null || item !== undefined)) {
      //     return redisItems;
      // }

      // const query = `*[_id in [${itemRefs}]]`;
      // const items = await sanity.fetch(query, params);

      // if (items && items.length > 0) {
      //     await Promise.all(items.map(item => {
      //         redisClient.set(item._id, JSON.stringify(item))
      //         console.log(`${item._id} added to redis`);
      //     }));
      //     return items;
      // } 

      return []; // No items found
  } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
  }
}

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
