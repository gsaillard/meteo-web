/********************************************
 * CONFIGURATION THINGSPEAK + EMAILJS
 ********************************************/
const channelID = "3082413"; // de the things network 
const readAPIKey = "5JB70C4NNIXQ88CS"; // thingspeak




/********************************************
 * OBJET DES SEUILS
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
 * TABLE DE CORRESPONDANCE HTML <-> CAPTEURS
 ********************************************/
const idMap = {
    temperature: "temp",
    humiditeAir: "hum",
    pression: "press",
    humiditeSol: "sol",
    luminosite: "lum",
    pluie: "pluie",
    npk: "npk"
};


const names = {
    temperature: "Température",
    humiditeAir: "Humidité de l'air",
    pression: "Pression atmosphérique",
    humiditeSol: "Humidité du sol",
    luminosite: "Luminosité",
    pluie: "Pluviométrie",
    npk: "NPK"
};


/********************************************
 * POPUP NON BLOQUANTE
 ********************************************/
function showPopup(message) {
    const popupZone = document.getElementById("popupAlertZone");

    const alertBox = document.createElement("div");
    alertBox.className = "popupAlert";
    alertBox.innerHTML = `
        <strong>⚠️ Alerte :</strong> ${message}
    `;

    popupZone.appendChild(alertBox);

    // disparition automatique
    setTimeout(() => {
        alertBox.remove();
    }, 6000);
}


/********************************************
 * CHARGEMENT AUTOMATIQUE DES VALEURS
 ********************************************/
window.onload = function () {
    let saved = localStorage.getItem("seuils");

    if (saved) {
        seuils = JSON.parse(saved);

        document.getElementById("tempMin").value = seuils.temperature.min ?? "";
        document.getElementById("tempMax").value = seuils.temperature.max ?? "";

        document.getElementById("humMin").value = seuils.humiditeAir.min ?? "";
        document.getElementById("humMax").value = seuils.humiditeAir.max ?? "";

        document.getElementById("pressMin").value = seuils.pression.min ?? "";
        document.getElementById("pressMax").value = seuils.pression.max ?? "";

        document.getElementById("solMin").value = seuils.humiditeSol.min ?? "";
        document.getElementById("solMax").value = seuils.humiditeSol.max ?? "";

        document.getElementById("lumMin").value = seuils.luminosite.min ?? "";
        document.getElementById("lumMax").value = seuils.luminosite.max ?? "";

        document.getElementById("pluieMin").value = seuils.pluie.min ?? "";
        document.getElementById("pluieMax").value = seuils.pluie.max ?? "";

        document.getElementById("npkMin").value = seuils.npk.min ?? "";
        document.getElementById("npkMax").value = seuils.npk.max ?? "";

        document.getElementById("emailInput").value = seuils.email ?? "";
    }
};

/********************************************
 * SAUVEGARDE DES SEUILS
 ********************************************/
function saveSettings() {

    seuils.temperature.min = parseFloat(document.getElementById("tempMin").value);
    seuils.temperature.max = parseFloat(document.getElementById("tempMax").value);

    seuils.humiditeAir.min = parseFloat(document.getElementById("humMin").value);
    seuils.humiditeAir.max = parseFloat(document.getElementById("humMax").value);

    seuils.pression.min = parseFloat(document.getElementById("pressMin").value);
    seuils.pression.max = parseFloat(document.getElementById("pressMax").value);

    seuils.humiditeSol.min = parseFloat(document.getElementById("solMin").value);
    seuils.humiditeSol.max = parseFloat(document.getElementById("solMax").value);

    seuils.luminosite.min = parseFloat(document.getElementById("lumMin").value);
    seuils.luminosite.max = parseFloat(document.getElementById("lumMax").value);

    seuils.pluie.min = parseFloat(document.getElementById("pluieMin").value);
    seuils.pluie.max = parseFloat(document.getElementById("pluieMax").value);

    seuils.npk.min = parseFloat(document.getElementById("npkMin").value);
    seuils.npk.max = parseFloat(document.getElementById("npkMax").value);

    seuils.email = document.getElementById("emailInput").value;

    // sauvegarde locale
    localStorage.setItem("seuils", JSON.stringify(seuils));

    showPopup("Paramètres enregistrés ✔");
}


/********************************************
 * LECTURE DES DONNÉES THINGSPEAK
 ********************************************/
async function getData() {
    try {
        const res = await fetch("http://localhost:3000/api/data");
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

        // affichage
        Object.keys(valeurs).forEach(key => {
            document.getElementById(idMap[key]).textContent =
                !isNaN(valeurs[key]) ? valeurs[key] : "—";
        });

        // vérification des seuils
        Object.keys(valeurs).forEach(type => {
            let value = valeurs[type];
            if (isNaN(value)) return;

            let min = seuils[type].min;
            let max = seuils[type].max;

            let message = null;

            const typeHuman = names[type];

            if (min !== null && value < min)
              message = `${typeHuman} trop bas : ${value} (min ${min})`;

            if (max !== null && value > max)
              message = `${typeHuman} trop haut : ${value} (max ${max})`;
        });

    } catch (err) {
        console.error("Erreur connexion :", err);
        showPopup("Erreur de connexion❌");
    }
}

/********************************************
 * MISE À JOUR AUTOMATIQUE
 ********************************************/
getData();
setInterval(getData, 15000);
