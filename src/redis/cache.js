//cache.js
// const Redis = require('ioredis');
const sanity = require('../lib/sanity');
const redisClient = require('../lib/redis');
const groq  = require('./groqQueries');
const { generateUID } = require('../utils/genUid');
const {basename} = require('path')
const {createReadStream} = require('fs');
const { randomBytes } = require('crypto');
const { error } = require('console');

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

async function cacheGetShopByOwner(shopId) {

  const shopGroup = `owner:${shopId}`;
  console.log('getting group by owner: ', shopGroup);

  try {
    //try get zrange
    console.log('getting zrange');
    const result = await redisClient.zrange(shopGroup, 0 , -1)

    if (!result == null || result.length == 0) {
      console.log('getting zrange failed');
      return null;
    } else {
      console.log('getting zrange successful', result);
      return result;
    }
  } catch (error) {
    console.log('Error getting zrange:', error);
    return null;
  }

  
  
}

async function cacheAddShopToOwner(shopdata) {
  try {
    // const shopGroup = `owner:${shopdata}`
    const shopGroup = await Promise.all(shopdata.map(async (data) => {
      return {
        shopOwner: `owner:${data.shopOwner}`,
        shopValue: `${data._type}:${data._id}`,
      };
    }));

    console.log('shopGroup: ', shopGroup);

    // Add the data to the cache Scores
    await Promise.all(shopGroup.map(async (data) => {
      const randomNum = Math.floor(Math.random() * 5) + 1;
      await redisClient.zadd(data.shopOwner, parseFloat(randomNum.toFixed(2)), data.shopValue);
    }));

    console.log('group added to Redis: successful');
  } catch (error) {
    console.log('Error cacheAddShopToOwner:', error);
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
    // const existingData = await sanity.fetch(groq.fetchDataById(updatedData._id));  
    // if (!existingData) {
    //   throw new Error(`Shop with ID ${updatedData._id} not found in Sanity.io`);
    // }
    // Combine existing data with updated data
    // const mergedData = { ...existingData, ...updatedData };

    // Update the data in Sanity.io
    await sanity
      .patch(updatedData._id)
      .set(updatedData)
      .commit();

    return true;
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

async function imagePickertoSanityAssets(formData) {
  console.log('run imagePickertoSanityAssets ');
  try {

    const result = await sanity.assets.upload('image', formData._parts[0])
    
    console.log('result: ', result);
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

//===================
const getAllQueue = async (datas) => {
  console.log('get all shop queue');
  const shopQueues = []; // Initialize array to store all queues
  try {
    for (const data of datas) {
      const allQueue = [];
      
      const queueSpecial = await redisClient.lrange(`queue:${data._id}:special`, 0, -1);
      const queueClassic = await redisClient.lrange(`queue:${data._id}`, 0, -1);
      const readyPickup = await redisClient.lrange(`pickup:${data._id}`, 0, -1)
      for (const value of queueSpecial) {
        allQueue.push(value);
      }
      for (const value of queueClassic) {
        allQueue.push(value);
      }
      console.log(allQueue);
      
      shopQueues.push({
        shopid: data._id,
        allQueue: allQueue,
        queuePriority: queueSpecial,
        queueClassic: queueClassic,
        pickup: readyPickup,
      });
    }
    return shopQueues; // Return combined queues for all shops
  } catch (error) {
    console.error('Error retrieving queue:', error);
    return null;
  }
};



const getAllQueuev2 = async (datas) => {
  console.log('get all shop queue');
  const shopQueues = []; // Initialize array to store all queues
  try {
    for (const data of datas) {
      let strrep = data.replace(/^shop:/, ''); 
      const allQueue = [];
      
      const queueSpecial = await redisClient.lrange(`queue:${strrep}:special`, 0, -1);
      const queueClassic = await redisClient.lrange(`queue:${strrep}`, 0, -1);
      const readyPickup = await redisClient.lrange(`pickup:${strrep}`, 0, -1)
      for (const value of queueSpecial) {
        allQueue.push(value);
      }
      for (const value of queueClassic) {
        allQueue.push(value);
      }
      console.log(allQueue);
      
      shopQueues.push({
        shopid: strrep,
        allQueue: allQueue,
        queuePriority: queueSpecial,
        queueClassic: queueClassic,
        pickup: readyPickup,
      });
    }
    return shopQueues; // Return combined queues for all shops
  } catch (error) {
    console.error('Error retrieving queue:', error);
    return null;
  }
};


module.exports = {
  //fetch data

  getKeysWithPattern,
  getValuesWithPattern,
  sanityFetch,
  getDataByKey,
    
  cacheGetShopByOwner,

  getAllQueue,
  getAllQueuev2,
  //add data
  addNewData,
  addCache,
  // addNewDataToSanity,
  
  cacheAddShopToOwner,
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
