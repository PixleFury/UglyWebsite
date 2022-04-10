const express = require("express");
const router = express.Router();

router.get("/login", (req, res) => {
	res.render("login", {user: null});
});

router.post("/login", (req, res) => {
	console.log(req.body);
	res.redirect("/");
});

router.post("/register", (req, res) => {
	console.log(req.body);
	res.redirect("/");
});

router.post("/logout", (req, res) => {
	console.log(req.body);
	res.redirect("/");
});

module.exports = router