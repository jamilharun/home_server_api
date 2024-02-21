router.get('/shops/:shopIds', async (req, res) => {
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
  
  // Modified function to handle an array of shop IDs
  async function getShopDataWithDishAndProduct(shopIds) {
    try {
      const shopDataArray = await Promise.all(shopIds.map(async shopId => {
        const shopKey = `shop:${shopId}`;
        const shopData = await redisClient.hgetall(shopKey);
  
        if (!shopData) {
          return null; // Shop not found
        }
  
        const dishKeys = await redisClient.smembers(`${shopKey}:dishes`);
        const productKeys = await redisClient.smembers(`${shopKey}:products`);
        const tagKeys = await redisClient.smembers(`${shopKey}:tags`);
  
        const dishData = await Promise.all(dishKeys.map(key => redisClient.hgetall(key)));
        const productData = await Promise.all(productKeys.map(key => redisClient.hgetall(key)));
        const tagData = await Promise.all(tagKeys.map(key => redisClient.hgetall(key)));
  
        return {
          shop: shopData,
          dishes: dishData,
          products: productData,
          tags: tagData,
        };
      }));
  
      return shopDataArray;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }
  