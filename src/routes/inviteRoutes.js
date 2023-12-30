const express = require("express");
const router = express.Router();
const inviteController = require("../controllers/Invite");

router.post("/", inviteController.sendInvite);
router.put("/:id/:task", inviteController.acceptRejectInvite);
router.get("/sent/:id", inviteController.getSentInvites);
router.get("/recieved/:id", inviteController.getReceivedInvites);

module.exports = router;
