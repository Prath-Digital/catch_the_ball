const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "..", "public")));

// Route for the home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// Route for the game page
app.get("/game", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "game.html"));
});

// Route for the how to play page
app.get("/how-to-play", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "how_to_play.html"));
});

// For any other route, redirect to home
app.get("*", (req, res) => {
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`url: http://localhost:${port}`);
});
