//groq

//warning!
//should only fetch 5 data
//this should have restiction on the type of data being fetched
// const fetchAllShops = '*[_type == "shop" && isActive && !(_id in path("drafts.**"))]';

// const fetchAllDishes = '*[_type == "dish" && isAvailable&& !(_id in path("drafts.**"))]';

// const fetchAllProducts = '*[_type == "product" && isAvailable&& !(_id in path("drafts.**"))]';

// const fetchTags = '*[_id in $allTagIds];';

// const isAvaFeaPro = '*[isAvailable]';

// function fetchDataByShopIdAndAllAssets(shopId) {
//     const query = `*[_id == '${shopId}'
//     || shop._ref == '${shopId}']`
//     return query;
// }


function fetchDataById(id) {
    const data = `*[_id == "${id}"]`;
    return data;
}

function qfs1df(id) {
    const query = `*[_type == "shop" && shopOwner == '${id}' &&!(_id in path("drafts.**"))] {
        _type,
        _id,
        isPromoted,
        description,
        isActive,
        logo,
        slug,
        shopOwner,
        cover,
        isFeatured,
        longitude,
        latitude,
        shopName,
        tags[]->{
          _id,
          tagName,
          color,
        },
    
        "products": *[_type == 'product' && !(_id in path("drafts.**")) && shop._ref == ^._id] {
          _id,
          productName,
          slug,
          tags[]->{
            _id,
            tagName,
            color,
          },
          image,
          Price,
          description,
          isFeatured,
          isAvailable,
          isPromoted,
          _type,
          shop,
        },
    
        "dishes": *[_type == "dish" && !(_id in path("drafts.**")) && shop._ref == ^._id ] {
          _id,
          dishName,
          _type,
          description,
          price,
          image,
          preparationTime,
          tags[]->{
            _id,
            tagName,
            color,
          },
          isPromoted,
          isFeatured,
          isAvailable,
          shop,
        },
      }`;
    return query;
}

function qfslid(id) {
  const query = `*[_type == "shop" && shop._ref == '${id}' &&!(_id in path("drafts.**"))] {
    _type,
    _id,
    isPromoted,
    description,
    isActive,
    logo,
    slug,
    shopOwner,
    cover,
    isFeatured,
    longitude,
    latitude,
    shopName,
    tags[]->{
      _id,
      tagName,
      color,
    },

    "products": *[_type == 'product' && !(_id in path("drafts.**")) && shop._ref == ^._id] {
      _id,
      productName,
      slug,
      tags[]->{
        _id,
        tagName,
        color,
      },
      image,
      Price,
      description,
      isFeatured,
      isAvailable,
      isPromoted,
      _type,
      shop,
    },

    "dishes": *[_type == "dish" && !(_id in path("drafts.**")) && shop._ref == ^._id ] {
      _id,
      dishName,
      _type,
      description,
      price,
      image,
      preparationTime,
      tags[]->{
        _id,
        tagName,
        color,
      },
      isPromoted,
      isFeatured,
      isAvailable,
      shop,
    },
  }`;
return query;
}

const qfsdf = `*[_type == "shop" &&!(_id in path("drafts.**"))]{
    _type,
    _id,
    accNum,
    qrcode,
    isPromoted,
    description,
    isActive,
    logo,
    slug,
    shopOwner,
    cover,
    isFeatured,
    longitude,
    latitude,
    shopName,
    tags[]->{
      _id,
      tagName,
      color
    },
    "products": *[_type == 'product' && !(_id in path("drafts.**")) && shop._ref == ^._id] {
      _id,
      productName,
      slug,
      tags[]->{
        _id,
        tagName,
        color
      },
      image,
      Price,
      description,
      isFeatured,
      isAvailable,
      isPromoted,
      _type,
      shop,
    },
    "dishes": *[_type == "dish" && !(_id in path("drafts.**")) && shop._ref == ^._id ] {
      isPromoted,
      dishName,
      isFeatured,
      isAvailable,
      preparationTime,
      _id,
      description,
      _type,
      price,
      shop,
      image,
      tags[]->{
        _id,
        tagName,
        color,
      },
    },
  }`;

module.exports = {
    // fetchAllShops,
    // fetchAllDishes,
    // fetchAllProducts,
    // fetchTags,
    // isAvaFeaPro,
    fetchDataById,
    // fetchDataByShopIdAndAllAssets
    
    qfs1df,
    qfslid,
    qfsdf,
}