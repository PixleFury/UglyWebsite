const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const router = express.Router();

const DATABASE_URI = `mongodb+srv://ugly-website:${process.env.DB_PASSWORD}@cluster0.yuxd3.mongodb.net/test?retryWrites=true&w=majority`;
let users;
let highscores;

MongoClient.connect(DATABASE_URI, (err, client) => {
	if (err) throw err;
	const db = client.db("uglywebsite");
	users = db.collection("users");
	highscores = db.collection("highscores");
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

		highscores.findOne({user: username}, (err, highscore) => {
			if (err) throw err;
			let score = null;
			if (highscore) {
				score = highscore.score;
			}
			res.render("profile", {user: req.session.user, profile: doc, can_edit: can_edit, highscore: score});
		});
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
	let username = String(req.body["username"]);
	let password = String(req.body["password"]);
	let password_copy = String(req.body["password-copy"]);


	let un_regex = /[a-zA-Z0-9_]+/
	if (!un_regex.test(username)) {
		// Username is invalid
		res.redirect("/login?error=invalid-username");
		return;
	}

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

		users.insertOne({username: username, password: password, is_admin: false, bio: ""});
		req.session.user = {username: username, is_admin: false, bio: ""};
		res.redirect("/");
	});
});

router.get("/logout", (req, res) => {
	req.session.user = null;
	res.redirect("/");
});

router.post("/deleteAccount/:username", (req, res) => {
	if (req.session.user == undefined) { // Only works if logged in
		res.sendStatus(403);
		return;
	}

	let username = String(req.params.username);

	// Delete if admin
	if (req.session.user.is_admin) {
		users.deleteOne({username: username});
	} else if(req.session.user.username == username) {
		// Not an admin - delete record if username and password are correct
		let password = String(req.body.password);
		users.deleteOne({username: req.session.user.username, password: password});
		req.session.user = null;
	}

	res.redirect("/");
});

router.post("/updateAccount/:username", (req, res) => {
	if (req.session.user == undefined) { // Only works if logged in
		res.sendStatus(403);
		return;
	}

	let username = String(req.params.username);
	let bio = String(req.body["bio"]);

	// Update if admin or owner
	if (req.session.user.is_admin || req.session.user.username == username) {
		users.updateOne({username: username}, {$set: {bio: bio}});
	}

	res.redirect(`/profile/${username}`);
});

router.post("/removeScore/:username", (req, res) => {
	if (req.session.user == undefined) { // Only works if logged in
		res.sendStatus(403);
		return;
	}

	let username = String(req.params.username);

	// Update if admin or owner
	if (req.session.user.is_admin || req.session.user.username == username) {
		highscores.deleteOne({user: username});
	}

	res.redirect(`/profile/${username}`);
});

module.exports = router