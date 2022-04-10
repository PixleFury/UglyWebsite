const express = require("express");
const { Collection } = require("mongodb");
const MongoClient = require("mongodb").MongoClient;
const router = express.Router();

const DATABASE_URI = `mongodb+srv://ugly-website:${process.env.DB_PASSWORD}@cluster0.yuxd3.mongodb.net/test?retryWrites=true&w=majority`;
let users;
let comments;

MongoClient.connect(DATABASE_URI, (err, client) => {
	if (err) throw err;
	const db = client.db("uglywebsite");
	users = db.collection("users");
});

router.get("/profile/:username", (req, res) => {
	let username = req.params.username;

	users.findOne({username: username}, (err, doc) => {
		if (err) throw err;

		if (!doc) {
			res.sendStatus(404);
			return;
		}

		let can_edit = false;

		if (req.session.user) {
			can_edit = req.session.user.is_admin || req.session.user.username == doc.username;
		}

		res.render("profile", {user: req.session.user, profile: doc, can_edit: can_edit});
	});
});

router.get("/login", (req, res) => {
	res.render("login", {user: req.session.user});
});

router.post("/login", (req, res) => {
	let username = req.body["username"];
	let password = req.body["password"];

	users.findOne({username: username, password: password}, (err, doc) => {
		if (err) throw err;

		if (!doc) {
			res.redirect("/login?error=incorrect-details");
			return;
		}

		req.session.user = doc;
		res.redirect("/");
	});
});

router.post("/register", (req, res) => {
	let username = req.body["username"];
	let password = req.body["password"];
	let password_copy = req.body["password-copy"];

	users.findOne({username: username}, (err, doc) => {
		if (err) throw err;

		if (doc) {
			res.redirect("/login?error=username-taken");
			return;
		}

		if (password != password_copy) {
			res.redirect("/login?error=pw-no-match");
			return;
		}

		users.insertOne({username: username, password: password, is_admin: false});
		req.session.user = {username: username, is_admin: false};
		res.redirect("/");
	});
});

router.get("/logout", (req, res) => {
	req.session.user = null;
	res.redirect("/");
});

module.exports = router