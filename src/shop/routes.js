const controller = require("./controller");
const { Router } = require("express");

router = Router();


router.get('/getTags', controller.getTags);


module.exports = router;