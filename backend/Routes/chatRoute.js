const express = require("express");
const {createChat, findUserChats, findChat, createGroupChat} = require("../Controllers/chatController");

const router = express.Router();

router.post("/", createChat);
router.get("/:userId", findUserChats);
router.get("/find/:firstId/:secondId", findChat);
router.post("/groupChat", createGroupChat);

module.exports = router;
