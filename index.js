const express = require("express");
const path = require("path");

// Create server and configure settings
const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
	res.render("home", {user: null});
});

app.get("/play", (req, res) => {
	res.render("play", {user: null});
});

app.get("/comments", (req, res) => {
	res.render("comments", {user: null});
});

app.get("/login", (req, res) => {
	res.render("login", {user: null});
});

// Listen on environment port for Heroku, or just use 8080 local hosting
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
});