

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

const idMap = {
  temperature: "temp",
  humiditeAir: "hum",
  pression: "press",
  humiditeSol: "sol",
  luminosite: "lum",
  pluie: "pluie",
  npk: "npk"
};

function showPopup(message) {
  const popupZone = document.getElementById("popupAlertZone");
  const div = document.createElement("div");
  div.className = "popupAlert";
  div.innerText = message;
  popupZone.appendChild(div);
  setTimeout(() => div.remove(), 5000);
}

/********************************************
 * CHARGEMENT SEUILS
 ********************************************/
window.onload = () => {
  const saved = localStorage.getItem("seuils");
  if (saved) seuils = JSON.parse(saved);
};

/********************************************
 * SAVE SETTINGS
 ********************************************/
function saveSettings() {
  seuils.temperature.min = parseFloat(tempMin.value);
  seuils.temperature.max = parseFloat(tempMax.value);
  seuils.humiditeAir.min = parseFloat(humMin.value);
  seuils.humiditeAir.max = parseFloat(humMax.value);
  seuils.pression.min = parseFloat(pressMin.value);
  seuils.pression.max = parseFloat(pressMax.value);
  seuils.humiditeSol.min = parseFloat(solMin.value);
  seuils.humiditeSol.max = parseFloat(solMax.value);
  seuils.luminosite.min = parseFloat(lumMin.value);
  seuils.luminosite.max = parseFloat(lumMax.value);
  seuils.pluie.min = parseFloat(pluieMin.value);
  seuils.pluie.max = parseFloat(pluieMax.value);
  seuils.npk.min = parseFloat(npkMin.value);
  seuils.npk.max = parseFloat(npkMax.value);
  seuils.email = emailInput.value;

  localStorage.setItem("seuils", JSON.stringify(seuils));

  fetch("https://sma.wirescape.net/api/seuils", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(seuils)
  });

  showPopup("Paramètres enregistrés");
}

/********************************************
 * AFFICHAGE DATA
 ********************************************/
async function getData() {
  const res = await fetch("https://sma.wirescape.net/api/data");
  const data = await res.json();

  const valeurs = {
    temperature: data.field1,
    humiditeAir: data.field2,
    pression: data.field3,
    humiditeSol: data.field4,
    luminosite: data.field5,
    pluie: data.field6,
    npk: data.field7
  };

  Object.keys(valeurs).forEach(k => {
    document.getElementById(idMap[k]).textContent = valeurs[k];
  });
}

getData();
setInterval(getData, 15000);

