//routes..js
const { Router } = require("express");
const {v4: uuidv4} = require('uuid');
const cache = require("./cache");
const groq  = require('./groqQueries');

router = Router() 

//==============================================
/* 
  testing out redis HGET HGETALL 
  kinda doenst work to my likings but i think it could work but
  i guess im just too stupid to use it. maybe ill be able to make 
  it workd in the future

  codes located in the trashcodes.js
*/

//==============================================
//fetch
router.get('/shop/', async (req, res) => {
  try {
    const keyPattern ='shop:*';
    const cacheKeys = await cache.getKeysWithPattern(keyPattern);

    if (!cacheKeys) {
      const datas = await cache.sanityFetch(groq.fetchAllShops);
      await cache.addCache(datas);
      res.json(datas);
    } 

    const cachedData = await cache.getValuesWithPattern(cacheKeys);
    
    if (!cachedData) {
      res.status(500).json({ error: 'cant fetch data from cache' });
    } 

    res.json(cachedData);
    
  } catch (error) {
    console.error('Error in /shop route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/shop/allAva', async (req, res) => {
  try {
    const keyPatterns = ['dish:*', 'product:*'];
    const cachedKeys = await cache.getKeysWithPattern(keyPatterns);
    // const cachedKeys = await Promise.all(keyPatterns.map(
    //   keyPattern => cache.getKeysWithPattern(keyPattern))); 
    const isCacheEmpty = cachedKeys?.map(data => data === null || data.length === 0);
    // const isCacheEmpty = cachedKeys.every(data => data === null || data.length === 0);

    console.log(isCacheEmpty);
    if (!cachedKeys || cachedKeys == null || cachedKeys.length < 0) {
      const datas = await cache.sanityFetch(groq.isAvaFeaPro);
      await cache.addCache(datas);
      res.json(datas);
    } else {
      const cachedData = await cache.getValuesWithPattern(cachedKeys);

      if (!cachedData) {
        res.status(500).json({ error: 'cant fetch data from cache' });
      }
  
      res.json(cachedData);
    }

  } catch (error) {
    console.error('Error in /shop/allAva route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.get('/shop/product', async (req,res) => {
  try {
    const keyPattern =['product:*'];
    const cachedData = await cache.getKeysWithPattern(keyPattern);
    if (!cachedData) {
      const datas = await cache.sanityFetch(groq.fetchAllProducts);
      if (datas) {
        await cache.addCache(datas);
        res.json(datas);
      } else (res.status(500).json({ error: 'cant fetch data from sanity' }));
    } else {res.json(cachedData);}
  } catch (error) {res.status(500).json({ error: 'Internal server error' });}
});

//this fill tags that are revenrece to a shop, dish, product.


router.get('/shop/:dishId', async (req, res) => {
  const { dishId } = req.params;
  try {
    const cacheData = await cache.getDataByKey(`dish:${dishId}`);
    if (cacheData) {
      res.json(cacheData);
    } else {
      const data = await cache.sanityFetch(groq.fetchDataById(dishId));
      if (data) {
        await cache.addCache('dish:', data);
        res.json(data);
      } else { res.status(500).json({ error: 'cant fetch data from sanity' });}
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/shop/product/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const cacheData = await cache.getDataByKey(`product:${productId}`);
    if (cacheData) {
      res.json(cacheData);
    } else {
      const data = await cache.sanityFetch(groq.fetchDataById(productId));
      if (data) {
        await cache.addCache('product:', data);
        res.json(data);
      } else { res.status(500).json({ error: 'cant fetch data from sanity' });}
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}),

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


// i forgot how to use this
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
  // const { shopId } = req.params;
  const updatedData = req.body;
  try {
    // Perform validation on updatedData if needed

    // Update the data in Sanity.io
    const updatedShopData = await cache.updateData(updatedData);
    console.log('/shop/:shopId updatedShopData:', updatedShopData);
    // Update the data in the cache if necessary
    await cache.updateCache(updatedShopData);

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