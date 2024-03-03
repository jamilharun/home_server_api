# home_server_api

description:
this is a api for campusbytes

http://192.168.18.13:4500/

connected databases:
postgreSQL
sanity.io
redis

v1.0.0
- deployment

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

