const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(express.json());

// Base des donnes SQLite
const db = new sqlite3.Database("data.db");

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

app.listen(3000, () => {
  console.log("API Node.js porte 3000");
});
