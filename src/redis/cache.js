//cache.js
// const Redis = require('ioredis');
const sanity = require('../lib/sanity');
const redisClient = require('../lib/redis');
const groq  = require('./groqQueries');
const { generateUID } = require('../utils/genUid');


//===============
//testing

// passing data redis cache 
async function addCache(values) {
  console.log('adding to Cache');
  try {
    // Corrected
    await Promise.all(values.map(async (data) => {
      const keyValuePair = `${data._type}:${data._id}`;
      await redisClient
        .set(keyValuePair, JSON.stringify(data), 'EX', 3600)
      console.log('Data added to Redis: successful');;
    })); // <-- Corrected
  } catch (error) {
    console.log('Error adding data to Redis:', error);
  }
};


async function fetchCacheScores() {
  try {
    const result = await redisClient.zRangeWithScores('shops', 0, -1);
  
    const shops = await Promise.all(result.map(async (data) => {
      return redisClient.json.get(data.score);
    }))
    return shops;
  } catch (error) { 
    return null;
  }
}

// add data to redis cache
async function addCachedScores(values) {
  try {
    // error handler
    if (!Array.isArray(values)) {
      console.log('Error: Values is not an array.');
      return;
    }

    // Add the data to the cache Scores
    // await Promise.all(values.map(async (data) => {
    //   await redisClient.zAdd('shops', {
    //     value: data.shopName, 
    //     score: `${data._type}:${data._id}`
    //   },{ NX: true });
    // }));

    // Add the data to the cache set
    await Promise.all(values.map(async (data) => {
      await redisClient.set(`${data._type}:${data._id}`, data);
    }))
    
    console.log('Data added to Redis: Successful', values.length);
  } catch (error) {
    console.error('Error adding data to Redis:', error);
  }
}

async function cacheGetYourShop(shopId) {
  try {
    const result = await redisClient.get(`shop:${shopId}`);
    if (!result) {
      return null;
    }
    return result;
  } catch (error) {
    console.log('Error fetching data:', error);
    return null;
  }
}

//update
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
    // const keys = Promise.all(pattern?.map(async (key) => {
    //   return await redisClient.keys(key);
    // }));
    if (keys && keys.length > 0) {
      console.log('Keys retrieved from Redis:', keys.length);
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
    const values = await Promise.all(pattern?.map(async (key) => {
      return await redisClient.get(key);
    }));

    if (values) {
      const json = await Promise.all(values.map(async (value) => {
        return JSON.parse(value);
      }));
      console.log('keys retrieved from Redis:', json.length);
      return json;
    } else {
      console.log('No data retrieved from Redis' );;
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
    await sanity
      .patch(updatedData._id)
      .set(mergedData)
      .commit();

    return mergedData;
  } catch (error) {
    console.error('Error updating shop data in Sanity.io:', error);
    throw error;
  }
}


//add data
async function addNewData(newData) {
  try {
    // Make a request to the Sanity API to add new data
    const response = await client
      .create(newData)
      .commit();

    console.log('Data added successfully:', response);
    return response;
  } catch (error) {
    console.error('Error adding new data to Sanity:', error);
    throw error;
  }
}

//may mali sa part na to.
//future jamil check yung sanity fetch json format
// async function addNewDataToSanity(shopId, id, item) {
//   try {
//     // Determine the document type based on the item (dish or product)
//     const documentType = item._type === 'dish' ? 'dish' : 'product';

//     // Create a new document in Sanity.io
//     const addedData = await sanity.create({
//       _type: documentType,
//       _id: generateUID(), // You might want to customize the document ID based on your needs
//       shopId: shopId,
//       ...item, // Spread the item properties into the document
//     });

//     console.log('Data added to Sanity.io successfully:', addedData);
//   } catch (error) {
//     console.error('Error adding data to Sanity.io:', error);
//     throw error;
//   }
// }

//delete data
async function deleteData(id) {
  try {
    // Delete the data in Sanity.io using the appropriate method
    const response = await sanity.delete(id);

    console.log(response);
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

async function imagePickertoSanityAssets(imageData) {
  try {
    const result = await sanity.assets
            .upload('image', imageData?.assets[0]?.uri, { 
              contentType : imageData?.assets[0]?.type, 
              filename: imageData?.assets[0]?.fileName});
    if (!result) {
      console.log('failed to upload image to sanity.io');
      return null;
    } else {
      console.log('image uploaded to sanity.io');
      return result;
    } 
  } catch (error) {
    console.log('Error sanity assets failed: ', error);
  }
}

module.exports = {
  //fetch data
  cacheGetYourShop,

  fetchCacheScores,
  addCachedScores,

  getKeysWithPattern,
  getValuesWithPattern,
  sanityFetch,
  getDataByKey,
    
  //add data
  addNewData,
  addCache,
  // addNewDataToSanity,
  
  //updata data
  updateData,
  updateCache,

  //delete data
  deleteData,
  deleteCache,
  
  //utils
  imagePickertoSanityAssets  
  //unorganized data

} 
