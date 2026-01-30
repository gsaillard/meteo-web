const express = require("express");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(express.json());

/************ CONFIG THINGSPEAK ************/
const channelID = "3082413";
const readAPIKey = "5JB70C4NNIXQ88CS";

/************ SQLITE ************/
const db = new sqlite3.Database("/db/data.db");

db.run(`
  CREATE TABLE IF NOT EXISTS mesures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temperature REAL,
    humiditeAir REAL,
    pression REAL,
    humiditeSol REAL,
    luminosite REAL,
    pluie REAL,
    npk REAL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

/************ SEUILS ************/
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

/************ EMAIL ************/
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "TON_EMAIL@gmail.com",
    pass: "MOT_DE_PASSE_APP"
  }
});

/************ ROUTES ************/
app.get("/api/ping", (req, res) => {
  res.json({ message: "API OK" });
});

app.post("/api/seuils", (req, res) => {
  seuils = req.body;
  res.json({ status: "ok" });
});

app.get("/api/data", async (req, res) => {
  const r = await fetch(
    `https://api.thingspeak.com/channels/${channelID}/feeds/last.json?api_key=${readAPIKey}`
  );
  const data = await r.json();
  res.json(data);
});

/************ ALERT + SAVE ************/
async function getData() {
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

  db.run(
    `INSERT INTO mesures
     (temperature, humiditeAir, pression, humiditeSol, luminosite, pluie, npk)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    Object.values(valeurs)
  );

  for (const type in valeurs) {
    const v = valeurs[type];
    const min = seuils[type].min;
    const max = seuils[type].max;

    if (seuils.email && ((min !== null && v < min) || (max !== null && v > max))) {
      transporter.sendMail({
        from: "TON_EMAIL@gmail.com",
        to: seuils.email,
        subject: `Alerte ${type}`,
        text: `${type} = ${v}`
      });
    }
  }
}

setInterval(getData, 15000);

app.listen(3000, () => console.log("Backend OK sur port 3000"));
