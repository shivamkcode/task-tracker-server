const express = require("express");
const router = express.Router();
const userController = require("../controllers/User");

router.post("/signup", userController.signup);
router.post("/login", userController.login); 
router.get("/users", userController.getUser);
router.put("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);

module.exports = router;
