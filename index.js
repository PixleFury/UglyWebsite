const express = require("express");
const session = require("express-session");

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
	res.render("play", {user: req.session.user});
});

app.get("/comments", (req, res) => {
	res.render("comments", {user: req.session.user});
});

app.use(require("./routers/account"));

// Listen on environment port for Heroku, or just use 8080 local hosting
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
});