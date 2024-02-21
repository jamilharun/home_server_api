//groq

//warning!
//should only fetch 5 data
//this should have restiction on the type of data being fetched
const fetchAllShops = '*[_type == "shop" && isActive && !(_id in path("drafts.**"))]';

const fetchAllDishes = '*[_type == "dish" && isAvailable&& !(_id in path("drafts.**"))]';

const fetchAllProducts = '*[_type == "product" && isAvailable&& !(_id in path("drafts.**"))]';

const fetchTags = '*[_id in $allTagIds];';

const isAvaFeaPro = '*[isAvailable]';

function fetchDataByShopIdAndAllAssets(shopId) {
    const query = `*[_id == '${shopId}'
    || shop._ref == '${shopId}']`
    return query;
}


function fetchDataById(id) {
    const data = `*[_id == "${id}"]`;
    return data;
}


module.exports = {
    fetchAllShops,
    fetchAllDishes,
    fetchAllProducts,
    fetchTags,
    isAvaFeaPro,
    fetchDataById,
    fetchDataByShopIdAndAllAssets
}