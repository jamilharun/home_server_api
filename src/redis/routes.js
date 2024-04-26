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

// testing

// router.route()
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, '../../images/')
  },
  filename: function(req, file, cb) {
    console.log(file)
    cb(null, `${Data.now()}_${file.originalname}`)
  }
})

const upload = multer({ storage: storage });


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
  const id = req.params.id;
  console.log('id: ', id);
  console.log('req: ', req.params);
  try {
    //fetching sorted sets from redis
    const result = await cache.cacheGetShopByOwner(id);
    
    if (!result) {
      console.log('cacheGetShopByOwner: ',result);
      const data = await cache.sanityFetch(groq.qfs1df(id));

      if (data) {
        await cache.cacheAddShopToOwner(data);
        res.json(data);
      } else {
        //fetching in sanity failed
        console.log('Error: No data found in sanity');
        res.status(500).json({ error: 'Failed to fetch data from Sanity' });
      }
    } else {
      console.log('cacheGetShopByOwner: ',result);
      const shopData = await cache.getValuesWithPattern(result);
      res.json(shopData);
    }
  } catch (error) {
    console.error('Error fetching app shop:', error);
    res.status(500).json({ error: 'fetch app shop Internal server error' });
  }
});


router.post('/upload', upload.single('image') , uploadFiles);

function uploadFiles(req, res) {
  console.log(JSON.stringify(req.body));
  console.log(req.file);
  if (!req.file) {
    return res.status(400).send('No image uploaded!');
  }
  res.json({ message: "test succesful" });
}

//insert new data
router.post('/shop/addNewData' ,async (req, res) => {
  // console.log(req);
  const { newData, formData } = req.body;
  console.log('newData: ', newData);
  console.log('formData: ', formData);
  try {
    //invert img to sanity accepted format
    const imgUri = await cache.imagePickertoSanityAssets(formData)
    
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
      
    await cache.addCache(latestData);

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
    const isitSuccess = await cache.updateData(updatedData);
    if (!isitSuccess) {
      console.log('no it failed');
      res.status(500).json({ error: 'Failed to update data in Sanity' });
    }
    // upon success
    // fetch latest data
    const latestData = await cache.sanityFetch(groq.qfslid(updatedData.shop._ref));

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
    const result = await cache.deleteData(data._id);
    if (!result) {
      console.log('data do not exist || failed');
      res.status(400).json({ error: 'Failed to delete data in Sanity' });
    }

    const refetch = await cache.sanityFetch(groq.qfs1df(data.shop._ref));
    if (!refetch) {
      res.json({ error: 'No data found' });
    } else { 
      console.log('SHOP refetch: ');
      res.json({ refetch });
    }
  } catch (error) {
    console.error('Error deleting shop data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//===============================
router.get('/all/shop/queue', async (req, res) => {
  console.log('allshopqueue');;
  const keypattern = 'shop:*';
  try {
    //fetching sorted sets from redis
    //if successful, retur  n data
    const ask = await cache.getKeysWithPattern(keypattern)

    if (!ask) {
      //fetching scored is empty, probably its empty
      // gonna fetch data
      
      const datas = await cache.sanityFetch(groq.qfsdf)
      if (datas) {
        //fetching data successful
        await cache.addCache(datas);
        const listShopQueue = await cache.getAllQueue(datas);
        res.json(listShopQueue);
      } else {
        //fetching data failed
        res.status(500).json({ error: 'cant fetch data from sanity' });
      }
      
    } else {
      //fetching score successful
      const listShopQueuev2 = await cache.getAllQueuev2(ask);
      res.json(listShopQueuev2);
    }
  } catch (error) {
    res.status(500).json({ error: 'fetch shops Internal server error' });
  }
});



module.exports = router;
