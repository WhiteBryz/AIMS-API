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

        console.log('Message and statistics updated in Firebase');
    } catch (error) {
        console.error('Error saving message to Firebase:', error);
    }
};

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