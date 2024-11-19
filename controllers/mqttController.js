const { database } = require('../config/firebase');
const { ref, set, get, update } = require('firebase/database');

const saveMessageToFirebase = async (msg) => {
    try {
        const timestamp = Date.now();
        const currentJsonInfo = JSON.parse(msg);

        const year = new Date(timestamp).getFullYear();
        const month = new Date(timestamp).getMonth() + 1; // Meses en JS son 0-11
        const day = new Date(timestamp).getDate();
        await set(ref(database, `Readings/${year}/${month}/${day}/${timestamp}`), {
            fecha: currentJsonInfo.fecha,
            hora: currentJsonInfo.hora,
            humedadAmbiente: currentJsonInfo.humedadAmbiente,
            humedadSuelo: {
                sensor1: currentJsonInfo.humedadSuelo.sensor1,
                sensor2: currentJsonInfo.humedadSuelo.sensor2,
            },
            iluminacion: currentJsonInfo.iluminacion,
            nivelAgua: currentJsonInfo.nivelAgua,
            riegoManual: currentJsonInfo.riegoManual,
            temperaturaAmbiente: currentJsonInfo.temperaturaAmbiente,
            timestamp,
        });

        // Actualiza estadísticas
        const statsRef = ref(database, `Statistics/daily`);
        const statsSnapshot = await get(statsRef);
        const currentStats = statsSnapshot.val() || {};

        const countLecturas = currentStats.countLecturas || 0;

        // Variables de lectura actual
        const humedadAmbiente = currentJsonInfo.humedadAmbiente || 0;
        const sensor1 = currentJsonInfo.humedadSuelo.sensor1 || 0;
        const sensor2 = currentJsonInfo.humedadSuelo.sensor2 || 0;
        const iluminacion = currentJsonInfo.iluminacion || 0;
        const temperaturaAmbiente = currentJsonInfo.temperaturaAmbiente || 0;
        const nivelAgua = currentJsonInfo.nivelAgua || 0;
        const lastDayRegistered = currentJsonInfo.fecha || 0;
        const lastHourRegistered = currentJsonInfo.hora || 0;

        // Actualiza promedio, máximo y mínimo
        const updateStats = {
            countLecturas: countLecturas + 1,
            lastDayRegistered: lastDayRegistered,
            lastHourRegistered: lastHourRegistered,
            humedadAmbiente: {
                currentHumedadAmbiente: humedadAmbiente,
                promedioHumedadAmbiente: updateAverage(currentStats.humedadAmbiente?.promedioHumedadAmbiente, humedadAmbiente, countLecturas + 1),
                maxHumedadAmbiente: Math.max(currentStats.humedadAmbiente?.maxHumedadAmbiente || -Infinity, humedadAmbiente),
                minHumedadAmbiente: Math.min(currentStats.humedadAmbiente?.minHumedadAmbiente || Infinity, humedadAmbiente),
            },
            sensor1: {
                currentHumedadSensor1: sensor1,
                promedioHumedadSensor1: updateAverage(currentStats.sensor1?.promedioHumedadSensor1, sensor1, countLecturas + 1),
                maxHumedadSensor1: Math.max(currentStats.sensor2?.maxHumedadSensor1 || -Infinity, sensor2),
                minHumedadSensor1: Math.min(currentStats.sensor2?.minHumedadSensor1 || Infinity, sensor2),
            },
            sensor2: {
                currentHumedadSensor2: sensor2,
                promedioHumedadSensor2: updateAverage(currentStats.sensor2?.promedioHumedadSensor2, sensor2, countLecturas + 1),
                maxHumedadSensor2: Math.max(currentStats.maxHumedadSensor2 || -Infinity, sensor2),
                minHumedadSensor2: Math.min(currentStats.minHumedadSensor2 || Infinity, sensor2),
            },
            temperaturaAmbiente: {
                currentTemperaturaAmbiente: temperaturaAmbiente,
                promedioTemperaturaAmbiente: updateAverage(currentStats.temperaturaAmbiente?.promedioTemperaturaAmbiente, temperaturaAmbiente, countLecturas + 1),
                maxTemperaturaAmbiente: Math.max(currentStats.temperaturaAmbiente?.maxTemperaturaAmbiente || -Infinity, temperaturaAmbiente),
                minTemperaturaAmbiente: Math.min(currentStats.temperaturaAmbiente?.minTemperaturaAmbiente || Infinity, temperaturaAmbiente),
            },
            iluminacion: {
                currentIluminacion: iluminacion,
                iluminacionMax: Math.max(currentStats.iluminacionMax || -Infinity, iluminacion),
            },
            nivelAgua: {
                estanque1: nivelAgua
            },
        };

        await update(statsRef, updateStats);

        console.log('Message and statistics updated in Firebase');
    } catch (error) {
        console.error('Error saving message to Firebase:', error);
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

module.exports = {
    saveMessageToFirebase,
    getMessages,
    publishMessage,
    subscribeToTopic
};