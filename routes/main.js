const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const { ensureAuth } = require("../middleware/auth");

router.get("/dashboard", homeController.getIndex);
router.get("/profile", ensureAuth, postsController.getProfile);
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);
router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);

module.exports = router;
