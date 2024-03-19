const { Router } = require("express");
const controller = require("./controller");
const {verifyToken} = require("../utils/auth");

router = Router();

router.get("/user", controller.getUsers);

// i got a filling this authtoken will break my code
router.get("/user:id", controller.getUserById, verifyToken);

// post methods
router.post("/user/register", controller.createUser);

router.post("/user/login", controller.loginUser);

router.post("/user/editUserInfo", controller.editUser);

//insert auth0 user
router.post("/user/insertUser", controller.insertUser);
    

module.exports = router;