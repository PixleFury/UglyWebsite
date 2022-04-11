const express = require("express");
const { Collection, ObjectId } = require("mongodb");
const MongoClient = require("mongodb").MongoClient;
const router = express.Router();

const DATABASE_URI = `mongodb+srv://ugly-website:${process.env.DB_PASSWORD}@cluster0.yuxd3.mongodb.net/test?retryWrites=true&w=majority`;
let comments = Collection.prototype;

MongoClient.connect(DATABASE_URI, (err, client) => {
	if (err) throw err;
	const db = client.db("uglywebsite");
	comments = db.collection("comments");
});

router.get("/comments", (req, res) => {
	comments.find().limit(10).sort({time: 1}).toArray().then(docs => {
		res.render("comments", {user: req.session.user, comments: docs});
	}).catch(err => {throw err;});
});

router.post("/postComment", (req, res) => {
	let comment = String(req.body["comment"]).trim();

	if (req.session.user == undefined || comment.length <= 0) {
		res.redirect("/");
		return
	}

	comments.insertOne({author: req.session.user.username, text: comment, time: Date.now()}).finally(() => {
		res.redirect("/comments");
	});
});

router.get("/deleteComment/:commentId", (req, res) => {
	// This should use POST method but for quickness/easiness get will be used due to <a> tags.

	// Loged in?
	if (req.session.user == undefined) {
		res.redirect("/comments");
		return
	}

	let comment_id = ObjectId(req.params["commentId"]);

	// Find the intended comment to check author.
	comments.findOne({_id: comment_id}, (err, doc) => {
		if (err) throw err;

		// Can only delete if author or moderator.
		if (req.session.user.is_admin || req.session.user.username == doc.author) {
			comments.deleteOne({_id: comment_id}).finally(() => {
				res.redirect("/comments");
			});
		}
	});
});

module.exports = router;