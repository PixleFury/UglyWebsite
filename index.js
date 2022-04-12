const express = require("express");
const session = require("express-session");
const MongoClient = require("mongodb").MongoClient;

const DATABASE_URI = `mongodb+srv://ugly-website:${process.env.DB_PASSWORD}@cluster0.yuxd3.mongodb.net/test?retryWrites=true&w=majority`;
let highscores;

MongoClient.connect(DATABASE_URI, (err, client) => {
	if (err) throw err;
	const db = client.db("uglywebsite");
	highscores = db.collection("highscores");
});

// Create server and configure settings
const app = express();
app.use(express.static("public"));
// TODO: Set secure to true.  Needs to be false to run on local machine
// Cookie expires in 60 minutes (in milliseconds)
app.use(session({cookie: {maxAge: 60 * 60 * 1000, secure: false}, secret: "54312"}));
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
	res.render("home", {user: req.session.user});
});

app.get("/play", (req, res) => {
	highscores.find().sort().limit(10).toArray().then(docs => {
		res.render("play", {user: req.session.user, scores: docs});
	});
});

app.post("/submitScore", (req, res) => {
	if (req.session.user == undefined) {
		res.sendStatus(403);
		return;
	}

	let score = Number(req.body["score"]);

	if (score == NaN || score <= 0) {
		res.sendStatus(400);
		return;
	}

	// Get highscore
	highscores.findOne({user: req.session.user.username}, (err, doc) => {
		if (err) throw err;

		if (doc == null) {
			// No score saved yet so create one
			highscores.insertOne({user: req.session.user.username, score: score});
		} else {
			if (score > doc.score) {
				// Replace users highscore with new one only if it is better than previous
				highscores.replaceOne({user: req.session.user.username}, {user: req.session.user.username, score: score});
			}
		}

		res.sendStatus(200);
	})
});

app.use(require("./routers/comments"));
app.use(require("./routers/account"));

// Listen on environment port for Heroku, or just use 8080 local hosting
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
});