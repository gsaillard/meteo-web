const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

/********************************************
 * CONFIGURATION THINGSPEAK
 ********************************************/
const channelID = "3082413";
const readAPIKey = "5JB70C4NNIXQ88CS";

/********************************************
 * SEUILS (reçus du frontend)
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
    user: "TON_EMAIL@gmail.com",
    pass: "MOT_DE_PASSE_APP"
  }
});

/********************************************
 * RECEVOIR SEUILS DU FRONTEND
 ********************************************/
const express = require("express");
const app = express();
app.use(express.json());

app.post("/seuils", (req, res) => {
  seuils = req.body;
  console.log("Seuils reçus :", seuils);
  res.json({ status: "ok" });
});

/********************************************
 * ENVOI EMAIL
 ********************************************/
async function sendEmailAlert(type, valeur, message) {
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
 * LECTURE THINGSPEAK
 ********************************************/
async function getData() {
  try {
    const res = await fetch(
      `https://api.thingspeak.com/channels/${channelID}/feeds/last.json?api_key=${readAPIKey}`
    );

    const data = await res.json();

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
        sendEmailAlert(type, value, message);
      }
    });

  } catch (err) {
    console.error("Erreur ThingSpeak :", err);
  }
}

setInterval(getData, 15000);

app.listen(3000, () => console.log("Backend actif sur port 3000"));
