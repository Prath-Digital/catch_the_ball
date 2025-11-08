const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const app = express();
const port = process.env.PORT || 3000;

// Path for storing high scores in a protected data directory
const DATA_DIR = path.join(__dirname, ".data");
const SCORES_FILE = path.join(DATA_DIR, "high-scores.json");

// Initialize high scores from file
let highScores = [];

// Ensure data directory exists with proper permissions
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
        // On Unix systems, set directory permissions to restrict access
        if (process.platform !== 'win32') {
            await fs.chmod(DATA_DIR, 0o700); // Only owner can read/write/execute
        }
    }
}

// Load high scores from file with additional security measures
async function loadHighScores() {
    try {
        await ensureDataDir();
        
        // Check if file exists
        try {
            await fs.access(SCORES_FILE);
        } catch {
            // Initialize with empty array if file doesn't exist
            highScores = [];
            await saveHighScores();
            return;
        }

        // Read and validate data
        const data = await fs.readFile(SCORES_FILE, 'utf8');
        try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) {
                throw new Error('Invalid data format');
            }
            // Validate each score entry
            highScores = parsed.filter(entry => (
                typeof entry === 'object' &&
                typeof entry.name === 'string' &&
                typeof entry.score === 'number' &&
                !isNaN(entry.score) &&
                entry.score >= 0
            ));
        } catch (parseError) {
            console.error('Error parsing scores file:', parseError);
            // Backup corrupted file and start fresh
            const backupFile = `${SCORES_FILE}.backup.${Date.now()}`;
            await fs.rename(SCORES_FILE, backupFile);
            highScores = [];
            await saveHighScores();
        }
    } catch (error) {
        console.error('Error accessing high scores:', error);
        highScores = [];
    }
}

// Save high scores to file with atomic write
async function saveHighScores() {
    await ensureDataDir();
    
    try {
        // Write to temporary file first
        const tempFile = `${SCORES_FILE}.tmp`;
        await fs.writeFile(tempFile, JSON.stringify(highScores, null, 2));
        
        // Atomically rename temp file to actual file
        await fs.rename(tempFile, SCORES_FILE);
        
        // Set restrictive permissions on Unix systems
        if (process.platform !== 'win32') {
            await fs.chmod(SCORES_FILE, 0o600); // Only owner can read/write
        }
    } catch (error) {
        console.error('Error saving high scores:', error);
        throw error; // Propagate error to caller
    }
}

// Load scores when server starts
loadHighScores().catch(console.error);

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

// Route for the leaderboard page
app.get("/leaderboard", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "leaderboard.html"));
});

app.use(express.json()); // For parsing application/json

// Get global high scores
app.get("/api/high-scores", async (req, res) => {
  try {
    // Always load latest scores from file first
    await loadHighScores();
    // Return top 10 scores, sorted descending
    const sorted = highScores.sort((a, b) => b.score - a.score).slice(0, 10);
    res.json(sorted);
  } catch (error) {
    console.error('Error getting high scores:', error);
    res.status(500).json({ error: "Failed to retrieve high scores" });
  }
});

// Post a new high score
app.post("/api/high-scores", async (req, res) => {
  try {
    const { name, score } = req.body;
    if (typeof score !== "number" || !name) {
      return res.status(400).json({ error: "Invalid score or name" });
    }

    // Load latest scores first
    await loadHighScores();
    
    // Add new score with timestamp
    highScores.push({
      name,
      score,
      timestamp: new Date().toISOString()
    });

    // Keep only top 50 scores
    highScores = highScores.sort((a, b) => b.score - a.score).slice(0, 50);
    
    // Save updated scores
    await saveHighScores();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving high score:', error);
    res.status(500).json({ error: "Failed to save high score" });
  }
});

// For any other route, redirect to home (catch-all should come after specific routes)
app.get("*", (req, res) => {
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`url: http://localhost:${port}`);
});
