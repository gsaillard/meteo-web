const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const fetch = require("node-fetch");
const channelID = "3082413";
const readAPIKey = "5JB70C4NNIXQ88CS";


const app = express();
app.use(express.json());

// Base des donnes SQLite
const db = new sqlite3.Database("/db/data.db");

// Create a table
db.run(`
  CREATE TABLE IF NOT EXISTS mesures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    valeur REAL
  )
`);

// Endpoint de test
app.get("/api/ping", (req, res) => {
  res.json({ message: "API OK" });
});

// enregistrer la valeur
app.post("/api/save", (req, res) => {
  const valeur = req.body.valeur;

  db.run(
    "INSERT INTO mesures(valeur) VALUES (?)",
    [valeur],
    () => res.json({ status: "saved", valeur })
  );
});
app.get("/api/data", async (req, res) => {
  try {
    const r = await fetch(
      `https://api.thingspeak.com/channels/${channelID}/feeds/last.json?api_key=${readAPIKey}`
    );
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "ThingSpeak error" });
  }
});


app.listen(3000, () => {
  console.log("API Node.js porte 3000");
});
