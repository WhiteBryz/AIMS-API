const { database } = require('../config/firebase');
const { ref, set, get, update } = require('firebase/database');

const saveMessageToFirebase = async (msg) => {
    try {
        const timestamp = Date.now();
        const currentJsonInfo = JSON.parse(msg);

        const year = new Date(timestamp).getFullYear();
        const month = new Date(timestamp).getMonth() + 1; // Meses en JS son 0-11
        const day = new Date(timestamp).getDate();
        const lecturaPath = `Readings/${year}/${month}/${day}/${timestamp}`;
        
        // Guardar la nueva lectura
        await set(ref(database, lecturaPath), {
            fecha: currentJsonInfo.fecha,
            hora: currentJsonInfo.hora,
            timestamp: currentJsonInfo.timestamp,
            humedadAmbiente: currentJsonInfo.humedadAmbiente,
            humedadSuelo: currentJsonInfo.humedadSuelo,
            iluminacion: currentJsonInfo.iluminacion,
            nivelAgua: currentJsonInfo.nivelAgua,
            temperaturaAmbiente: currentJsonInfo.temperaturaAmbiente,
        });

        // Obtener todas las lecturas del día
        const lecturasRef = ref(database, `Readings/${year}/${month}/${day}`);
        const lecturasSnapshot = await get(lecturasRef);
        const lecturas = lecturasSnapshot.exists() ? Object.values(lecturasSnapshot.val()) : [];

        if (lecturas.length === 0) {
            console.log("No hay lecturas para calcular estadísticas.");
            return;
        }

        // Calcular estadísticas para cada campo
        const estadisticas = {
            lastTimeStamp: {
                lastTimeStamp: currentJsonInfo.timestamp
            },
            humedadAmbiente: {
                estadistics: calcularEstadisticas(lecturas, "humedadAmbiente"),
                actual: currentJsonInfo.humedadAmbiente
            },
            humedadSuelo: {
                estadisticas: calcularEstadisticas(lecturas, "humedadSuelo"),
                actual: currentJsonInfo.humedadSuelo
            },
            iluminacion:{
                estadisticas: calcularEstadisticas(lecturas, "iluminacion"),
                actual: currentJsonInfo.iluminacion
            },
            nivelAgua:{
                estadisticas: calcularEstadisticas(lecturas, "nivelAgua"),
                actual: currentJsonInfo.nivelAgua
            },
            temperaturaAmbiente:{
                estadisticas: calcularEstadisticas(lecturas, "temperaturaAmbiente"),
                actual: currentJsonInfo.temperaturaAmbiente
            },
        };

        // Actualizar las estadísticas diarias
        const statsRef = ref(database, `Statistics/daily`);
        await set(statsRef, estadisticas);

        console.log("Lectura guardada y estadísticas actualizadas.");
    } catch (error) {
        console.error("Error saving message to Firebase:", error);
    }
};

// Función para actualizar promedios
function updateAverage(currentAvg = 0, newValue, count = 1) {
    return (currentAvg * (count - 1) + newValue) / count;
}

const getMessages = async (req, res) => {
    try {
        const snapshot = await get(ref(database, 'messages'));
        const messages = snapshot.exists() ? snapshot.val() : {};
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching messages' });
    }
};

const mqtt = require('mqtt');
let client;

const publishMessage = (req, res) => {
    const { topic, message } = req.body;

    if (!client) {
        client = mqtt.connect(process.env.MQTT_BROKER_URL);
    }

    client.publish(topic, message, (error) => {
        if (error) {
            res.status(500).json({ error: 'Failed to publish message' });
        } else {
            res.status(200).json({ message: `Message published to topic ${topic}` });
        }
    });
};

const subscribeToTopic = (req, res) => {
    const { topic } = req.body;

    if (!client) {
        client = mqtt.connect(process.env.MQTT_BROKER_URL);
    }

    client.subscribe(topic, (error) => {
        if (error) {
            res.status(500).json({ error: 'Failed to subscribe to topic' });
        } else {
            res.status(200).json({ message: `Subscribed to topic ${topic}` });
        }
    });
};

const calcularEstadisticas = (lecturas, campo) => {
    let suma = 0;
    let min = Infinity;
    let max = -Infinity;

    lecturas.forEach((lectura) => {
        const valor = lectura[campo];
        const timestamp = lectura.timestamp;

        if (valor !== undefined) {
            suma += valor;
            if (valor < min) min = valor;
            if (valor > max) max = valor;
        }
    });

    const promedio = Math.round(suma / lecturas.length);

    return {
        promedio,
        min,
        max
    };
};


module.exports = {
    saveMessageToFirebase,
    getMessages,
    publishMessage,
    subscribeToTopic
};