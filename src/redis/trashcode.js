router.get('/shop/dish', async (req, res) => {
    try {
      const keyPattern ='dish:*';
      const cachedData = await cache.getValuesWithPattern(keyPattern);
      if (!cachedData) {
        const datas = await cache.sanityFetch(groq.fetchAllDishes);
        if (datas) {
          console.log(datas);
          await cache.addCache(datas);
          res.json(datas);
        } else (res.status(500).json({ error: 'cant fetch data from sanity' }));
      } else {res.json(cachedData);}
    } catch (error) {res.status(500).json({ error: 'Internal server error' });}
  });

  router.get('/shop/', async (req, res) => {
    try {
      const keyPattern ='shop:*';
      const cachedData = await cache.getKeysWithPattern(keyPattern);
      
      if (!cachedData) {
        const datas = await cache.sanityFetch(groq.fetchAllShops);
        
        if (datas) {
          console.log(datas);
          await cache.addCache(datas);
          res.json(datas);
        } else (res.status(500).json({ error: 'cant fetch data from sanity' }));
      } else {res.json(cachedData);}
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal server error' });}
  });


  router.get('/shop/:shopIds', async (req, res) => {
    const { shopIds } = req.params;
    const shopIdArray = shopIds.split(',');
  
    try {
      const shopDataArray = await Promise.all(shopIdArray.map(shopId => cache.getShopDataWithDishAndProduct(shopId)));
  
      // Filter out shops that are not found
      const validShopDataArray = shopDataArray.filter(shopData => shopData !== null);
  
      if (validShopDataArray.length > 0) {
        res.json(validShopDataArray);
      } else {
        res.status(404).json({ error: 'No valid shops found' });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  array = {
    id: '123',
    name: 'name1',
    age: 12,
    address: 'address1'
  }

  hset(`key:${array.id}`,'name', array.name);

  router.get('/shop/dishProd/:shopId', async (req, res) => {
    const { shopId } = req.params;
    try {
      const cachedData = await cache.getShopDataWithDishAndProduct(shopId);
      if (cachedData) {
        res.json(cachedData);
      } else {
        console.log('No data retrieved from Redis');
        //moving on to fetching data from sanity
        const datas = await cache.sanityFetch(groq.fetchDataByShopIdAndAllAssets(shopId));
        if (datas) {
          console.log('start add to cache');
          const op = await cache.addCache(datas);
          console.log(op);
        } else {
          console.log('promise all failed');
          res.status(500).json({ error: 'cant fetch data from sanity' })
        }
        // const newCachedData = await cache.getShopDataWithDishAndProduct(shopId);
        // res.json(newCachedData);
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal server error' });}
  })

  router.get('/shop/tags', async (req, res) => {
    const { tags } = req.params;
    try {
      const keyPattern ='tag:*';
      const cachedData = await cache.getKeysWithPattern(keyPattern);
      if (!cachedData) {
        const data = await cache.sanityFetch(groq.fetchAllTags);
        if (data) {
          await cache.addCache('tag:', data);
          res.json(data);
        } else (
          res.status(500).json({ error: 'cant fetch data from sanity' }));
      } else {
        res.json(cachedData);}
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });}
  });

  // router.get('/shop/', async (req, res) => {
//   try {
//     const keyPattern ='shop:*';
//     const cachedKeys = await cache.getKeysWithPattern(keyPattern);
    
//     if (!cachedKeys) {
//       const datas = await cache.sanityFetch(groq.fetchAllShops);
      
//       await cache.addCache(datas);
//     } 
    
//     const shopsDataArray = await Promise.all(cachedKeys.map(key => {
//       cache.getShopDataWithDishAndProduct(key);
//     }));

//     const validShopDataArray = shopsDataArray.filter(shopData => shopData !== null);
    
//     if (validShopDataArray.length > 0) {
//       res.json(validShopDataArray);
//     } else {
//       res.status(404).json({ error: 'No valid shops found' });
//     }

//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: 'Internal server error' });}
// });


router.get('/shop/testing', async (req, res) => {
  const { key } = req.body;
  try {
    // const keyPattern ='';
    // const cachedData = await cache.getValuesWithPattern(keyPattern);
    const cachedData = null;
    if (!cachedData || cachedData.length === 0 ) {
      const values = await cache.sanityFetch(groq.fetchAllShops);
      if (values) {
        console.log(values);
        await cache.addCacheShop(values);
        // res.json(await cache.getValuesWithPattern(keyPattern));
        res.json('done');
      } else {
        res.status(500).json({ error: 'Cannot fetch data from Sanity' });
      } 
    } else {res.json(cachedData);}
  } catch (error) {
    console.error('Error in /shop/ route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

async function getShopDataWithDishAndProduct(key) {
  try {
    const shopKey = key;
    console.log(`Inspecting key ${shopKey}: ${await redisClient.type(shopKey)}`);
    const shopData = await redisClient.hgetall(shopKey);
    
    if (!shopData) {
      return null; // Shop not found
    }

    // Fetch dish, tag, and product keys from the sets
    const dishKeys = await redisClient.smembers(`${shopKey}:dishes`);
    const productKeys = await redisClient.smembers(`${shopKey}:products`);
    const tagKeys = await redisClient.smembers(`${shopKey}:tags`);

    // Fetch dish, tag, and product data
    const dishData = await Promise.all(dishKeys.map(key => redisClient.hgetall(key)));
    const productData = await Promise.all(productKeys.map(key => redisClient.hgetall(key)));
    const tagData = await Promise.all(tagKeys.map(key => redisClient.hgetall(key)));

    if (dishData.length === 0 && productData.length === 0 && tagData.length === 0) {
      console.log('No data found in Redis');
      return null;
    }
    
    return {
      shop: shopData,
      dishes: dishData,
      products: productData,
      tags: tagData,
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

async function addShopDataWithDishAndProduct(key, shopData, id, item) {
  try {
    // Add data to Redis cache
    await redisClient.hmset(key, shopData);

    if (item._type === 'dish') {
      const dishKey = `dish:${id}`;
      await redisClient.sadd(`${shopKey}:dishes`, dishKey);
    } else if (item._type === 'product') {
      const productKey = `product:${id}`;
      await redisClient.sadd(`${shopKey}:products`, productKey);
    }

    // You can also set an expiration time for the cache if needed
    // await redisClient.expire(shopKey, 3600);

    console.log('Data added to Redis cache successfully');
    
  } catch (error) {
    console.error('Error adding data to Redis cache:', error);
    throw error;
  }
};

async function addCacheShop(values) {
  console.log('Adding to Cache');
  const properties = Object.keys(values);
  try {
    await Promise.all(values.map(async (data) => {
      const keyValuePair = `${data._type}:${data._id}`;
            
      await redisClient
        .hmset(keyValuePair, 
          '_id', data._id,
          'shopName', data.shopName,
          '_type', data._type,
          'slug', data.slug,
          'shopOwner', data.shopOwner,
          'address', data.address,
          'logo', data.logo,
          'cover', data.cover,
          'description', data.description,
          'latitude', data.latitude,
          'longitude', data.longitude,
          'isActive', data.isActive,
          'isFeatured', data.isFeatured,
          'isPromoted', data.isPromoted,
          '_createdAt', data._createdAt,
          '_updatedAt', data._updatedAt,
        );
      console.log('Data added to Redis: Successful');
    }));
  } catch (error) {
    console.error('Error adding data to Redis:', error);
  }
}

// try {
  //   const keyPattern ='shop:*';
  //   const cacheKeys = await cache.getKeysWithPattern(keyPattern);

  //   if (!cacheKeys) {
  //     const datas = await cache.sanityFetch(groq.fetchAllShops);
  //     await cache.addCache(datas);
  //     res.json(datas);
  //   } 

  //   const cachedData = await cache.getValuesWithPattern(cacheKeys);
    
  //   if (!cachedData) {
  //     res.status(500).json({ error: 'cant fetch data from cache' });
  //   } 

  //   res.json(cachedData);
    
  // } catch (error) {
  //   console.error('Error in /shop route:', error);
  //   res.status(500).json({ error: 'Internal server error' });
  // }

  //get all shops


  // router.get('/shop/allAva', async (req, res) => {
//   try {
//     const keyPatterns = ['dish:*', 'product:*'];
//     const cachedKeys = await cache.getKeysWithPattern(keyPatterns);
//     // const cachedKeys = await Promise.all(keyPatterns.map(
//     //   keyPattern => cache.getKeysWithPattern(keyPattern))); 
//     const isCacheEmpty = cachedKeys?.map(data => data === null || data.length === 0);
//     // const isCacheEmpty = cachedKeys.every(data => data === null || data.length === 0);

//     console.log(isCacheEmpty);
//     if (!cachedKeys || cachedKeys == null || cachedKeys.length < 0) {
//       const datas = await cache.sanityFetch(groq.isAvaFeaPro);
//       await cache.addCache(datas);
//       res.json(datas);
//     } else {
//       const cachedData = await cache.getValuesWithPattern(cachedKeys);

//       if (!cachedData) {
//         res.status(500).json({ error: 'cant fetch data from cache' });
//       }
  
//       res.json(cachedData);
//     }

//   } catch (error) {
//     console.error('Error in /shop/allAva route:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });



// router.get('/shop/product', async (req,res) => {
//   try {
//     const keyPattern =['product:*'];
//     const cachedData = await cache.getKeysWithPattern(keyPattern);
//     if (!cachedData) {
//       const datas = await cache.sanityFetch(groq.fetchAllProducts);
//       if (datas) {
//         await cache.addCache(datas);
//         res.json(datas);
//       } else (res.status(500).json({ error: 'cant fetch data from sanity' }));
//     } else {res.json(cachedData);}
//   } catch (error) {res.status(500).json({ error: 'Internal server error' });}
// });

//this fill tags that are revenrece to a shop, dish, product.


// router.get('/shop/:dishId', async (req, res) => {
//   const { dishId } = req.params;
//   try {
//     const cacheData = await cache.getDataByKey(`dish:${dishId}`);
//     if (cacheData) {
//       res.json(cacheData);
//     } else {
//       const data = await cache.sanityFetch(groq.fetchDataById(dishId));
//       if (data) {
//         await cache.addCache('dish:', data);
//         res.json(data);
//       } else { res.status(500).json({ error: 'cant fetch data from sanity' });}
//     }
//   } catch (error) {
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// router.get('/shop/product/:productId', async (req, res) => {
//   const { productId } = req.params;
//   try {
//     const cacheData = await cache.getDataByKey(`product:${productId}`);
//     if (cacheData) {
//       res.json(cacheData);
//     } else {
//       const data = await cache.sanityFetch(groq.fetchDataById(productId));
//       if (data) {
//         await cache.addCache('product:', data);
//         res.json(data);
//       } else { res.status(500).json({ error: 'cant fetch data from sanity' });}
//     }
//   } catch (error) {
//     res.status(500).json({ error: 'Internal server error' });
//   }
// }),

// router.get('/shop/:shopId', async (req, res) => {
//     const { shopId } = req.params;  
//     try {
//       // const shopData = await cache.getShopData(shopId);
//       const cacheData = await cache.getDataByKey(`shop:${shopId}`);
//       if (cacheData) {
//         res.json(cacheData);
//       } else {
//         const data = await cache.sanityFetch(groq.fetchDataById(shopId));
//         if (data) {
//           await cache.addCache('shop:', data);
//           res.json(data);
//         } else { res.status(500).json({ error: 'cant fetch data from sanity' });}
//       }
//     } catch (error) {
//       res.status(500).json({ error: 'Internal server error' });
//     }
// });


// i forgot how to use this
// router.get('/keys/:keys', async (req, res) => {
//   const { keysPattern } = req.params;
//   const keys = cache.getKeysWithPattern('shop:*');
// });



// complex  query
// router.get('/shop/:shopId', async (req, res) => {
//   const { shopId } = req.params;
//   try {
//     const shopData = await cache.getShopDataWithDishAndProduct(shopId);

//     if (shopData) {
//       res.json(shopData);
//     } else {
//       res.status(404).json({ error: 'Shop not found' });
//     }
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// add data(either dish or product) to cache and sanity data
// router.post('/shop/add', async (req, res) => {
//   try {
//     // Extract shop data from the request body
//     const { shopId, item } = req.body;
//     // the item will represent either dish, product
//     // will only contain 1 array or data
    
//     const key = `shop:${shopId}`;
//     // generate new id
//     const id = uuidv4();

//     // fetch shop data from redis
//     const shopData = await cache.getShopData(key);
//     if (!shopData) {
//       console.log('No data found in cache');
//       shopData = await cache.sanityFetch(groq.fetchDataById(shopId));
//     }
//     // Add data to Redis cache
//     await cache.addShopDataWithDishAndProduct(key, shopData, id, item);
    
//     // Add data to Sanity.io
//     await cache.addNewDataToSanity(shopId, id, item);

//     res.status(201).json({ message: 'Shop data added successfully' });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
//
