const channelID = "3082413";
const readAPIKey = "5JB70C4NNIXQ88CS";

// EmailJS config
const serviceID = "service_lr1q0vo";
const templateID = "template_6yx972b";
const publicKey = "public_3aB5Qxyz123AbC"; // 👉 usa aquí tu clave real

// Inicializar EmailJS (solo una vez)
emailjs.init(publicKey);




let minTemp = null;
let maxTemp = null;
let emailAddress = null;
let alertSent = false; // para no repetir alertas

function setTemperatureRange() {
  minTemp = parseFloat(document.getElementById("tempMin").value);
  maxTemp = parseFloat(document.getElementById("tempMax").value);
  emailAddress = document.getElementById("emailInput").value;
  alertSent = false;
}

async function sendEmailAlert(temp, message) {
  if (!emailAddress) return;

  const params = {
    to_email: emailAddress,
    name: "Station météo automatique",
    temperature: temp,
    message: message
  };

  try {
    await emailjs.send(serviceID, templateID, params);
    console.log("✅ Email envoyé avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de l’envoi de l’email :", error);
  }
}


async function getData() {
  try {
    const res = await fetch(`https://api.thingspeak.com/channels/${channelID}/feeds/last.json?api_key=${readAPIKey}`);
    const data = await res.json();

    const temp = parseFloat(data.field1);

    document.getElementById("temp").textContent = temp || "—";
    document.getElementById("hum").textContent = data.field2 || "—";
    document.getElementById("press").textContent = data.field3 || "—";
    document.getElementById("sol").textContent = data.field4 || "—";
    document.getElementById("lum").textContent = data.field5 || "—";
    document.getElementById("pluie").textContent = data.field6 || "—";
    document.getElementById("npk").textContent = data.field7 || "—";

    if (minTemp !== null && maxTemp !== null && !isNaN(temp)) {
      let message = null;

      if (temp < minTemp) message = `Température trop basse : ${temp}°C (min ${minTemp}°C)`;
      else if (temp > maxTemp) message = `Température trop élevée : ${temp}°C (max ${maxTemp}°C)`;

      if (message && !alertSent) {
        alert(`⚠️ ${message}`);
        await sendEmailAlert(temp, message);
        alertSent = true;
      }
    }
  } catch (err) {
    console.error(err);
    document.querySelectorAll("span").forEach(el => el.textContent = "Erreur");
  }
}

getData();
setInterval(getData, 15000);
