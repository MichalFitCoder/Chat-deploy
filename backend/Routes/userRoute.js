const express = require("express");
const {registerUser, loginUser, findUser, getUsers, addPublicKey, getPublicKey } = require("../Controllers/userController.js");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/updateKey", addPublicKey);
router.get("/find/:userId", findUser);
router.get("/", getUsers)
router.get("/publicKey/:userId", getPublicKey)

module.exports = router;