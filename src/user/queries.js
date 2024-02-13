//select all method should be avoided
const getUsers = 'SELECT * FROM "user";'

const getUserById = 'SELECT * FROM "user" WHERE userid = $1;'

const getUserByEmail = 'SELECT * FROM "user" WHERE email = $1;'

const createUser = 'INSERT INTO "user" (userid, name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING userid;'

const editName = 'UPDATE "user" SET name = $1 WHERE userid = $2;'

const editGivenName = 'UPDATE "user" SET given_name = $1 WHERE userid = $2;'

const editFamilyName = 'UPDATE "user" SET family_name = $1 WHERE userid = $2;'

const editNickname = 'UPDATE "user" SET nickname = $1 WHERE userid = $2;'

const editPasswordHash = 'UPDATE "user" SET password_hash = $1 WHERE userid = $2;'

const editPhonenumber = 'UPDATE "user" SET phonenumber = $1 WHERE userid = $2;'
//-- Assuming you have a "user" table with columns including "image" of type BYTEA
// const insertImage -  'INSERT INTO "user" (userid, image) VALUES ('your_user_id', E'\\x' || encode('your_binary_image_data', 'hex'))'


module.exports = {
    getUsers,
    getUserById,
    getUserByEmail,
    createUser,
    editName,
    editFamilyName,
    editNickname,
    editGivenName,
    editPasswordHash,
    editPhonenumber
}