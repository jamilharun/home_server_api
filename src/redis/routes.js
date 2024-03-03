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
    //fetching sorted sets from redis
    const allShops = await cache.fetchCacheScores()

    if (!allShops) {
      //fetching scored is empty, probably its empty
      // gonna fetch data
      const datas = await cache.sanityFetch(groq.qfsdf);
      
      if (datas) {
        //fetching data successful
        await cache.addCachedScores(datas);

        res.json(datas);
      } else {
        //fetching data failed
        res.status(500).json({ error: 'cant fetch data from sanity' });
      }
      
    } else {
      //fetching score successful
      res.json(allShops);
    }
  } catch (error) {
    res.status(500).json({ error: 'fetch shops Internal server error' });
  }
});

//id == shop owner id
router.get('/shop/:id', async (req, res) => {
  const { id } = req.params;
  try {
    //fetching sorted sets from redis
    const shop = await cache.cacheGetYourShop(id);

    if (!shop) {
      const data = await cache.sanityFetch(groq.qfs1df(id));

      if (data) {
        await cache.addCachedScores(data);
        res.json(data);
      } else {
        res.status(500).json({ error: 'Failed to fetch data from Sanity' });
      }
    } else {
      res.json(shop);
    }
  } catch (error) {
    console.error('Error fetching app shop:', error);
    res.status(500).json({ error: 'fetch app shop Internal server error' });
  }
});



// how can i update data in json and in cached data?
// update data in cache and sanity data
router.put('/shop/:dataId', async (req, res) => {
  const { shopId } = req.params;
  const {parentData, updatedData} = req.body;
  try {
    // Perform validation on updatedData if needed

    // Update the data in Sanity.io
    await cache.updateData(updatedData);


    // Update the data in the cache if necessary
    await cache.updateCache(parentData);


    res.json(parentData);
  } catch (error) {
    console.error('Error updating shop data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// to delete data in cache and sanity data
router.delete('/shop/:delData', async (req, res) => {
  const { itemId, shopId } = req.params;
  try {
    // Delete the data in Sanity.io
    await cache.deleteData(itemId);

    const refetch = await cache.cacheGetYourShop(shopId);

    // await cache.deleteCache(`:${shopId}`);

    res.json({ refetch });
  } catch (error) {
    console.error('Error deleting shop data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;