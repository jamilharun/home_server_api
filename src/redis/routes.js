//routes..js
const { Router } = require("express");
const {v4: uuidv4} = require('uuid');
const cache = require("./cache");
const groq  = require('./groqQueries');

router = Router() 

// simple fetch

// this will initialize the fetching of data from redis or sanity
// this code should be removed when querying a lot of data
// its a double eedge sword
router.get('/shop/dish', async (req, res) => {
  try {
    const keyPattern ='dish:*';
    const cachedData = await cache.getKeysWithPattern(keyPattern);
    if (!cachedData) {
      const data = await cache.sanityFetch(groq.fetchAllDishes);
      if (data) {
        await cache.addCache('dish:', data);
        res.json(data);
      } else (res.status(500).json({ error: 'cant fetch data from sanity' }));
    } else {res.json(cachedData);}
  } catch (error) {res.status(500).json({ error: 'Internal server error' });}
});

router.get('/shop/', async (req, res) => {
  try {
    const keyPattern ='shop:*';
    const cachedData = await cache.getKeysWithPattern(keyPattern);
    // const allShops = await cache.getAllShops(); // Implement this function to fetch all shops
    if (!cachedData) {
      const data = await cache.sanityFetch(groq.fetchAllShops);
      if (data) {
        await cache.addCache('shop:', data);
        res.json(data);
      } else (res.status(500).json({ error: 'cant fetch data from sanity' }));
    } else {res.json(cachedData);}
  } catch (error) {res.status(500).json({ error: 'Internal server error' });}
});

router.get('/shop/product', async (req,res) => {
  try {
    const keyPattern ='product:*';
    const cachedData = await cache.getKeysWithPattern(keyPattern);
    if (!cachedData) {
      const data = await cache.sanityFetch(groq.fetchAllProducts);
      if (data) {
        await cache.addCache('product:', data);
        res.json(data);
      } else (res.status(500).json({ error: 'cant fetch data from sanity' }));
    } else {res.json(cachedData);}
  } catch (error) {res.status(500).json({ error: 'Internal server error' });}
})

router.get('/shop/:shopId', async (req, res) => {
    const { shopId } = req.params;  
    try {
      // const shopData = await cache.getShopData(shopId);
      const cacheData = await cache.getDataByKey(`shop:${shopId}`);
      if (cacheData) {
        res.json(cacheData);
      } else {
        const data = await cache.sanityFetch(groq.fetchDataById(shopId));
        if (data) {
          await cache.addCache('shop:', data);
          res.json(data);
        } else { res.status(500).json({ error: 'cant fetch data from sanity' });}
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/keys/:keys', async (req, res) => {
  const { keysPattern } = req.params;
  const keys = cache.getKeysWithPattern('shop:*');
});



// complex  query
router.get('/shop/:shopId', async (req, res) => {
  const { shopId } = req.params;
  try {
    const shopData = await cache.getShopDataWithDishAndProduct(shopId);

    if (shopData) {
      res.json(shopData);
    } else {
      res.status(404).json({ error: 'Shop not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// add data(either dish or product) to cache and sanity data
router.post('/shop/add', async (req, res) => {
  try {
    // Extract shop data from the request body
    const { shopId, item } = req.body;
    // the item will represent either dish, product
    // will only contain 1 array or data
    
    const key = `shop:${shopId}`;
    // generate new id
    const id = uuidv4();

    // fetch shop data from redis
    const shopData = await cache.getShopData(key);
    if (!shopData) {
      console.log('No data found in cache');
      shopData = await cache.sanityFetch(groq.fetchDataById(shopId));
    }
    // Add data to Redis cache
    await cache.addShopDataWithDishAndProduct(key, shopData, id, item);
    
    // Add data to Sanity.io
    await cache.addNewDataToSanity(shopId, id, item);

    res.status(201).json({ message: 'Shop data added successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// update data in cache and sanity data
router.put('/shop/:shopId', async (req, res) => {
  const { shopId } = req.params;
  const updatedData = req.body;
  try {
    // Perform validation on updatedData if needed

    // Update the data in Sanity.io
    const updatedShopData = await cache.updateData(shopId, updatedData);
    console.log('/shop/:shopId updatedShopData:', updatedShopData);
    // Update the data in the cache if necessary
    await cache.updateCache(`shop:${shopId}`, updatedShopData);

    const latestData = await cache.getDataByKey(`shop:${shopId}`);

    res.json(latestData);
  } catch (error) {
    console.error('Error updating shop data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// to delete data in cache and sanity data
router.delete('/shop/:shopId', async (req, res) => {
  const { shopId } = req.params;
  try {
    // Delete the data in Sanity.io
    await cache.deleteShopData(shopId);

    // Delete the data in the cache
    await cache.deleteCache(`shop:${shopId}`);

    res.json({ message: `Shop with ID ${shopId} deleted successfully` });
  } catch (error) {
    console.error('Error deleting shop data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;