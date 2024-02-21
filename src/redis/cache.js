//cache.js
const Redis = require('ioredis');
const sanity = require('../lib/sanity');
const groq  = require('./groqQueries');
const { generateUID } = require('../utils/genUid');

// Initialize Redis client
const redisClient = new Redis();

//===============
//testing
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



// passing data redis cache 
// async function addCache(values) {
//   console.log('adding to Cache');
//   try {
//     // Corrected
//     await Promise.all(values.map(async (data) => {
//       const keyValuePair = `${data._type}:${data._id}`;
//       await redisClient
//         .set(keyValuePair, JSON.stringify(data), 'EX', 3600)
//       console.log('Data added to Redis: successful');;
//     })); // <-- Corrected
//   } catch (error) {
//     console.log('Error adding data to Redis:', error);
//   }
// };
async function addCache(values) {
  console.log('Adding to Cache');
  try {
    if (!Array.isArray(values)) {
      console.log('Error: Values is not an array.');
      return;
    }

    // Corrected
    await Promise.all(values.map(async (data) => {
      const keyValuePair = `${data._type}:${data._id}`;
      await redisClient.set(keyValuePair, JSON.stringify(data), 'EX', 3600);
    }));
    console.log('Data added to Redis: Successful', values.length);
  } catch (error) {
    console.error('Error adding data to Redis:', error);
  }
}

async function updateCache(updatedData) {
  try {
    const cacheKey = `${updatedData._type}:${updatedData._id}`;
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
    if (keys && keys.length > 0) {
      console.log('Keys retrieved from Redis:');
      return keys;
    } else {
      console.log('No data retrieved from Redis');;
      return null;
    }
  } catch (error) {
    console.error('Error retrieving keys:', error);
    throw error;
  }
};
async function getValuesWithPattern(pattern) {
  try {
    const values = await redisClient.get(pattern);
    
    if (values) {
      console.log('keys retrieved from Redis:');
      return values;
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
    if (data.length == 0) {
      console.log('failed to fetch from Sanity.io:');
      return null;
    } else {
      console.log('data retrieved from Sanity.io:');
      return data;
    }
  } catch (error) {
    log.error('An error occurred:', error);
    throw error;
  }
};

// async function sanityFetch(key,query,id) {}

// this function will fetch data from redis based on the key
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
async function updateData(updatedData) {
  try {
    // Fetch the existing data from Sanity.io
    const existingData = await sanity.fetch(groq.fetchDataById(updatedData._id));  
    if (!existingData) {
      throw new Error(`Shop with ID ${updatedData._id} not found in Sanity.io`);
    }
    // Combine existing data with updated data
    const mergedData = { ...existingData, ...updatedData };

    // Update the data in Sanity.io
    const response = await sanity
      .patch(updatedData._id)
      .set(mergedData)
      .commit();

    return response;
  } catch (error) {
    console.error('Error updating shop data in Sanity.io:', error);
    throw error;
  }
}


//add data


//may mali sa part na to.
//future jamil check yung sanity fetch json format
async function addNewDataToSanity(shopId, id, item) {
  try {
    // Determine the document type based on the item (dish or product)
    const documentType = item._type === 'dish' ? 'dish' : 'product';

    // Create a new document in Sanity.io
    const addedData = await sanity.create({
      _type: documentType,
      _id: generateUID(), // You might want to customize the document ID based on your needs
      shopId: shopId,
      ...item, // Spread the item properties into the document
    });

    console.log('Data added to Sanity.io successfully:', addedData);
  } catch (error) {
    console.error('Error adding data to Sanity.io:', error);
    throw error;
  }
}

//delete data
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
  getValuesWithPattern,
  sanityFetch,
  getDataByKey,
  
  getShopDataWithDishAndProduct,
  
  //add data
  addCache,
  addCacheShop,
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