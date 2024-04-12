const func = require('./functions')
const redisClient = require('../lib/redis');
const sanity = require('../lib/sanity');
const groq  = require('./groqQueries');

//mail functions
const getTags = async (req, res) => {
    console.log('get tags');
    const tagkeys = 'tag:*'
    try {
        //check if tags existed in redis
        const rKeyTags = await func.getKeys(tagkeys)
        if (rKeyTags.length == 0) {
            console.log('no tags data in redis');;
            
            console.log('fetching tags in sanity');
            const sTags = await func.sanityFetch(groq.allTags)
            if (!sTags) {
                console.log('failed to fetch tags from sanity');
                res.status(404).json({ error: 'No tags found in sanity' });
            }else{
                console.log('tags fetched from sanity');
                await func.addCache(sTags)
                res.status(200).json(sTags);
            }
        } else {
            console.log('tags data in redis');
            const rGetTags = await func.getGets(rKeyTags)
            res.status(200).json(rGetTags);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}


module.exports = {
    //tags related
    getTags
}