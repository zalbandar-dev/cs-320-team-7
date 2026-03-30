/**
 * Minimal Express server.
 *
 * Flow: Node runs this file → express listens on PORT → HTTP requests hit the routes below.
 */

const express = require("express");

const app = express();
// Default 3001 so it does not clash with Next.js (usually 3000).
const PORT = process.env.PORT || 3001;

// Parse JSON bodies on incoming requests (needed later for POST / JSON APIs).
app.use(express.json());

// Health check — open http://localhost:3001/health in a browser.
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "backend is running" });
});

// Placeholder API route — your frontend can fetch http://localhost:3001/api/spots
app.get("/api/spots", (req, res) => {
  res.json([]);
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
