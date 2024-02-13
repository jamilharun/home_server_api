//cache.js
const Redis = require('ioredis');
const sanity = require('../lib/sanity');
const groq  = require('./groqQueries');

// Initialize Redis client
const redisClient = new Redis();

// passing data redis cache 
async function addCache(key,value) {
  value.forEach(async (data) => {
    const keyValuePair = `${key}${data._id}`;
    await redisClient.set(key, JSON.stringify(keyValuePair), 'EX', 3600);
  });
};
async function updateCache(key, updatedData) {
  try {
    const cacheKey = key;
    // Update the data in the cache
    await redisClient.set(cacheKey, JSON.stringify(updatedData), 'EX', 3600);
    return true;
  } catch (error) {
    console.error('Error updating cache:', error);
    // Handle the error based on your application requirements
    throw error;
  }
};
// custom redis fetch method
// fetiching existing data from redis
async function getKeysWithPattern(pattern) {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys) {
      console.log('Data retrieved from Redis:', JSON.parse(keys));
      return JSON.parse(keys);
    } else {
      console.log('No data retrieved from Redis');;
      return null;
    }
  } catch (error) {
    console.error('Error retrieving keys:', error);
    throw error;
  }
};
// the Key command is use to identify similar key pattern
// you should use this if you want to fetch all the keys that match the pattern
async function sanityFetch(query) {
  try {
    const data = await sanity.fetch(query);
    if (!data) {
      console.log('failed to fetch from Sanity.io:');
      return null;
    } else {
      console.log('data retrieved from Sanity.io:', data);
      return data;
    }
  } catch (error) {
    log.error('An error occurred:', error);
    throw error;
  }
};

// async function sanityFetch(key,query,id) {}
async function getDataByKey(key) {
  try {
    const cachedData = await redisClient.get(key);
    if (!cachedData) {
      return null;
    } else {
      console.log('data retrieved from Redis');;
      return JSON.parse(cachedData);
    }
  } catch (error) {
    console.log('Error retrieving keys:', error);
    throw error;
  }
}

// ===================================

// to update shop data in the database,
// we need to fetch the existing data first, 
// then combine it with the updated data, and then update the data in Sanity.io
async function updateData(id, updatedData) {
  try {
    // Fetch the existing data from Sanity.io
    const existingData = await sanity.fetch(groq.fetchDataById(id));  
    if (!existingData) {
      throw new Error(`Shop with ID ${id} not found in Sanity.io`);
    }
    // Combine existing data with updated data
    const mergedData = { ...existingData, ...updatedData };

    // Update the data in Sanity.io
    const response = await sanity
      .patch(id)
      .set(mergedData)
      .commit();

    return response;
  } catch (error) {
    console.error('Error updating shop data in Sanity.io:', error);
    throw error;
  }
}

async function getShopDataWithDishAndProduct(shopId) {
  try {
    const shopKey = `shop:${shopId}`;
    const shopData = await redisClient.hgetall(shopKey);

    if (!shopData) {
      return null; // Shop not found
    }

    // Fetch dish and product keys from the sets
    const dishKeys = await redisClient.smembers(`${shopKey}:dishes`);
    const productKeys = await redisClient.smembers(`${shopKey}:products`);

    // Fetch dish and product data
    const dishData = await Promise.all(dishKeys.map(key => redisClient.hgetall(key)));
    const productData = await Promise.all(productKeys.map(key => redisClient.hgetall(key)));

    return {
      shop: shopData,
      dishes: dishData,
      products: productData,
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}
//add data
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

//may mali sa part na to.
//future jamil check yung sanity fetch json format
async function addNewDataToSanity(shopId, id, item) {
  try {
    // Determine the document type based on the item (dish or product)
    const documentType = item._type === 'dish' ? 'dish' : 'product';

    // Create a new document in Sanity.io
    const addedData = await sanity.create({
      _type: documentType,
      _id: id, // You might want to customize the document ID based on your needs
      shopId: shopId,
      ...item, // Spread the item properties into the document
    });

    console.log('Data added to Sanity.io successfully:', addedData);
  } catch (error) {
    console.error('Error adding data to Sanity.io:', error);
    throw error;
  }
}


async function deleteData(id) {
  try {
    // Delete the data in Sanity.io using the appropriate method
    const response = await sanity.delete(shopId);

    return response;
  } catch (error) {
    console.error('Error deleting shop data in Sanity.io:', error);
    throw error;
  }
}

async function deleteCache(key) {
  try {
    const cacheKey = key;
    // Delete the data from the cache
    await redisClient.del(cacheKey);
    return true;
  } catch (error) {
    console.error('Error deleting cache:', error);
    throw error;
  }
}

module.exports = {
  //fetch data
  getKeysWithPattern,
  sanityFetch,
  getDataByKey,
  
  getShopDataWithDishAndProduct,
  
  //add data
  addCache,
  addShopDataWithDishAndProduct,
  addNewDataToSanity,
  
  //updata data
  updateData,
  updateCache,

  //delete data
  deleteData,
  deleteCache,
  //unorganized data
} 