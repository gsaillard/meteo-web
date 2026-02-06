const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const nodemailer = require("nodemailer");

const fetch = global.fetch;

const channelID = "3082413";
const readAPIKey = "5JB70C4NNIXQ88CS";

const app = express();
app.use(express.json());

/********************************************
 * BASE DE DONNÉES
 ********************************************/
const db = new sqlite3.Database("./db/data.db");

db.run(`
  CREATE TABLE IF NOT EXISTS mesures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    valeur REAL
  )
`);

/********************************************
 * SEUILS
 ********************************************/
let seuils = {
  temperature: { min: null, max: null },
  humiditeAir: { min: null, max: null },
  pression: { min: null, max: null },
  humiditeSol: { min: null, max: null },
  luminosite: { min: null, max: null },
  pluie: { min: null, max: null },
  npk: { min: null, max: null },
  email: null
};

/********************************************
 * EMAIL CONFIG
 ********************************************/
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "stationmeteosae@gmail.com",
    pass: "rstg npvn fwbr siwk"
  }
});

// eviter spam
let lastAlertSent = {};

/********************************************
 * ENDPOINTS
 ********************************************/
app.post("/api/seuils", (req, res) => {
  seuils = req.body;
  console.log("Seuils reçus :", seuils);
  res.json({ status: "ok" });
});

app.get("/api/ping", (req, res) => {
  res.json({ message: "API OK" });
});

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

/********************************************
 * EMAIL FUNCTION
 ********************************************/
async function sendEmailAlert(type, message) {
  if (!seuils.email) return;

  await transporter.sendMail({
    from: "TON_EMAIL@gmail.com",
    to: seuils.email,
    subject: `Alerte ${type}`,
    text: message
  });

  console.log("Mail envoyé :", message);
}

/********************************************
 * VERIFICATION AUTOMATIQUE
 ********************************************/
async function checkDataAndAlert() {
  try {
    const r = await fetch(
      `https://api.thingspeak.com/channels/${channelID}/feeds/last.json?api_key=${readAPIKey}`
    );

    const data = await r.json();

    const valeurs = {
      temperature: parseFloat(data.field1),
      humiditeAir: parseFloat(data.field2),
      pression: parseFloat(data.field3),
      humiditeSol: parseFloat(data.field4),
      luminosite: parseFloat(data.field5),
      pluie: parseFloat(data.field6),
      npk: parseFloat(data.field7)
    };

    Object.keys(valeurs).forEach(type => {
      const value = valeurs[type];
      if (isNaN(value)) return;

      const min = seuils[type].min;
      const max = seuils[type].max;

      let message = null;

      if (min !== null && value < min)
        message = `${type} trop bas : ${value} (min ${min})`;

      if (max !== null && value > max)
        message = `${type} trop haut : ${value} (max ${max})`;

      if (message) {
        // Evite spam : 1 mail max par type toutes les 5 minutes
        const now = Date.now();
        if (!lastAlertSent[type] || now - lastAlertSent[type] > 300000) {
          sendEmailAlert(type, message);
          lastAlertSent[type] = now;
        }
      }
    });

  } catch (err) {
    console.error("Erreur ThingSpeak :", err);
  }
}

setInterval(checkDataAndAlert, 15000);


const path = require("path");  // retirer si pas de recup de donnes 
app.use(express.static(path.join(__dirname, "../htdocs"))); // retirer si pas de recup de donnes 

app.listen(3000, () => {
  console.log("Backend actif sur port 3000");
});
