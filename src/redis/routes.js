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
  const keypattern = 'shop:*';
  try {
    //fetching sorted sets from redis
    //if successful, return data
    const ask = await cache.getKeysWithPattern(keypattern)

    if (!ask) {
      //fetching scored is empty, probably its empty
      // gonna fetch data
      
      const datas = await cache.sanityFetch(groq.qfsdf)
      if (datas) {
        //fetching data successful
        await cache.addCache(datas);
        res.json(datas);
      } else {
        //fetching data failed
        res.status(500).json({ error: 'cant fetch data from sanity' });
      }
      
    } else {
      //fetching score successful
      const asv = await cache.getValuesWithPattern(ask)
      if (!asv) {
        console.log('error: no shop value fetched');;
        return null
      }
      res.json(asv);
    }
  } catch (error) {
    res.status(500).json({ error: 'fetch shops Internal server error' });
  }
});

//id == shop owner id
// use cases when the shop owner is checkedout his shop
router.get('/shop/:id', async (req, res) => {
  const { id } = req.params.id;
  console.log('id: ', id);;
  try {
    //fetching sorted sets from redis
    const shop = await cache.cacheGetYourShop(id);

    if (!shop) {
      const data = await cache.sanityFetch(groq.qfs1df(_id));

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

//insert new data
router.post('/shop/addNewData', async (req, res) => {
  const { newData } = req.body;
  console.log('newData: ', newData);
  try {
    //invert img to sanity accepted format
    const imgUri = await cache.imagePickertoSanityAssets(newData.image)
    
    if (!imgUri) {
      console.log('Error: No image uri found');
      res.status(500).json({ error: 'No image uri found' });
    }

    const prePostData = {
      _id: newData._id,
      ...(newData.type === 'dish' && { dishName: newData.dishName }),
      ...(newData.type === 'product' && { dishName: newData.productName }),
      shop: newData.shop,
      _type: newData.type,
      image: {
        _type: 'imageObject',
        assets: {
          _type: 'reference',
          _ref: imgUri._id
        },
      },
      ...(newData.type === 'dish' && { dishName: newData.price }),
      ...(newData.type === 'product' && { dishName: newData.Price }),
      ...(newData.type === 'dish' && { dishName: newData.preparationTime }),
      isAvalaible: newData.isAvalaible,
      isFeatured: newData.isFeatured,
      isPromoted: newData.isPromoted,
    }
    console.log('prePostData: ', prePostData);;
    //insert data to sanity
    const result = await cache.addNewData(prePostData);
    console.log('result: ', result);

    const latestData = await cache.sanityFetch(groq.qfs1df(newData.shop._id));
    if (!latestData) return res.status(500).json({ error: 'Failed to fetch data from Sanity' })
      
    await cache.addCachedScores(latestData);

    res.json(latestData);
  } catch {
    res.status(500).json({ error: 'Failed to add new data to cache' });
  }
});


// how can i update data in json and in cached data?
// update data in cache and sanity data
router.put('/shop/updatedata', async (req, res) => {
  const {updatedData} = req.body;
  console.log("updatedData: ", updatedData);
  try {
    // Update the data in Sanity.io
    await cache.updateData(updatedData);
    // upon success
    // fetch latest data
    const latestData = await cache.sanityFetch(groq.qfs1df(updatedData.shop._id));

    // if data is empty, return error
    if (!latestData) {
      res.status(500).json({ error: 'Failed to fetch data from Sanity' })
    } else {
      await cache.updateCache(latestData);
      res.json(latestData);
    }
    // Update the data in the cache if necessary
  } catch (error) {
    console.error('Error updating shop data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// to delete data in cache and sanity data
router.delete('/shop/deleteData', async (req, res) => {
  const {data} = req.body;
  try {
    // Delete the data in Sanity.io
    //data._id should associate to dish/product id
    await cache.deleteData(data._id);

    const refetch = await cache.cacheGetYourShop(data.shop._id);
    if (!refetch) {
      res.json({ error: 'No data found' });
    } else {
      res.json({ refetch });
    }
  } catch (error) {
    console.error('Error deleting shop data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;