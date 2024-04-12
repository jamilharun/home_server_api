const sanity = require('../lib/sanity');
const redisClient = require('../lib/redis');

const getKeys = async (key) => {
    try {
        const keys = await redisClient.keys(key);
        return keys;
    } catch (error) {
        console.log('error in getKeys:', error);
        throw error;
    }
}
const getGets = async (keys) => {
    try {
        const gets = Promise.all(keys.map(async (key) => {
            const get = await redisClient.get(key);
            return get;
        }));
        return gets;
    } catch (error) {
        console.log('error in getGets:', error);
        throw error;
    }
}

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

  async function addCache(values) {
    console.log('adding to Cache');
    try {
      // Corrected
      await Promise.all(values.map(async (data) => {
        const keyValuePair = `${data._type}:${data._id}`;
        await redisClient
          .set(keyValuePair, JSON.stringify(data), 'EX', 13600)
        console.log('Data added to Redis: successful');;
      })); // <-- Corrected
    } catch (error) {
      console.log('Error adding data to Redis:', error);
    }
  };
  
  
module.exports = {
    getKeys,
    getGets,
    sanityFetch,
    addCache
}