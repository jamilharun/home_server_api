# home_server_api

description:
this is a api for campusbytes

connected databases:
postgreSQL
sanity.io
redis

api archtecture:
postgres {
    users,      --\
    orders,     ---==> expressjs
    rating,     --/
    chat (ftf),
    comments (ftf),
    validation (ftf)
    verification (ftf)
}

sanity.io {
    shop,       --\
    products,   ---==> redis ==> expressjs
    dish,       --/
    
}

