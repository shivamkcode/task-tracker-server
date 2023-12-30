const express = require("express");
const router = express.Router();
const boardController = require("../controllers/Board");

router.post("/", boardController.createBoard);
router.get("/", boardController.getBoards); 
router.put("/:id", boardController.updateBoard);
router.delete("/:id", boardController.deleteBoard);

module.exports = router;
