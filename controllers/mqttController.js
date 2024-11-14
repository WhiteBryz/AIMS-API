const { database } = require('../config/firebase');
const { ref, set } = require('firebase/database');

const saveMessageToFirebase = async (msg) => {
    try {
        const timestamp = Date.now();
        await set(ref(database, `Example/${timestamp}`), {
            message: msg,
            timestamp,
        });
        console.log('Message saved to Firebase');
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