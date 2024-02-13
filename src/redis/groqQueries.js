//groq

//warning!
//should only fetch 5 data
//this should have restiction on the type of data being fetched
const fetchAllShops = '*[_type == "shop"]';

const fetchAllDishes = '*[_type == "dish"]';

const fetchAllProducts = '*[_type == "product"]';


function fetchDataById(id) {
    const data = `*[_id == "${id}"]`;
    return data;
}

module.exports = {
    fetchAllShops,
    fetchAllDishes,
    fetchAllProducts,   
    fetchDataById,
}