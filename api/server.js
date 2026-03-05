//webhoot
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
app.use(express.json());

/********************************************
 * BASE DE DATOS
 ********************************************/
const db = new sqlite3.Database("./db/data.db");

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS mesures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            temperature REAL,
            humiditeAir REAL,
            pression REAL,
            humiditeSol REAL,
            luminosite REAL,
            pluie REAL,
            npk REAL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS alertes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            type TEXT,
            valeur REAL,
            message TEXT,
            email TEXT
        )
    `);

});

/********************************************
 * SEUILS
 ********************************************/
let seuils = {};
let lastAlertSent = {};

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

/********************************************
 * ENDPOINTS
 ********************************************/

// recibir seuils del frontend
app.post("/api/seuils", (req, res) => {
  seuils = req.body;
  res.json({ status: "ok" });
});

// devolver última medida
app.get("/api/mesures/last", (req, res) => {
    db.get(
        "SELECT * FROM mesures ORDER BY id DESC LIMIT 1",
        (err, row) => {
            if (err) return res.status(500).json({ error: err });
            res.json(row);
        }
    );
});

/********************************************
 * WEBHOOK TTN
 ********************************************/
app.post("/api/ttn", async (req, res) => {

    const payload = req.body.uplink_message?.decoded_payload;

    if (!payload) {
        return res.status(400).json({ error: "No payload" });
    }

    const valeurs = {
        temperature: payload.field1,
        humiditeAir: payload.field2,
        pression: payload.field3,
        humiditeSol: payload.field4,
        luminosite: payload.field5,
        pluie: payload.field6,
        npk: payload.field7
    };

    // guardar en base de datos
    db.run(
        `INSERT INTO mesures
        (temperature, humiditeAir, pression, humiditeSol, luminosite, pluie, npk)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        Object.values(valeurs)
    );

    // verificar alertas
    Object.keys(valeurs).forEach(async type => {

        const value = valeurs[type];
        if (!seuils[type]) return;

        const min = seuils[type].min;
        const max = seuils[type].max;

        let message = null;

        if (min !== null && value < min)
            message = `${type} trop bas : ${value}`;

        if (max !== null && value > max)
            message = `${type} trop haut : ${value}`;

        if (message) {
            const now = Date.now();
            if (!lastAlertSent[type] || now - lastAlertSent[type] > 300000) {

                await transporter.sendMail({
                    from: "stationmeteosae@gmail.com",
                    to: seuils.email,
                    subject: `Alerte ${type}`,
                    text: message
                });

                db.run(
                    `INSERT INTO alertes (type, valeur, message, email)
                     VALUES (?, ?, ?, ?)`,
                    [type, value, message, seuils.email]
                );

                lastAlertSent[type] = now;
            }
        }
    });

    res.status(200).json({ status: "saved" });
});

/********************************************
 * STATIC FILES
 ********************************************/
app.use(express.static(path.join(__dirname, "../htdocs")));

app.listen(3000, () => {
  console.log("Backend actif sur port 3000");
});
