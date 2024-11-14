const mqtt = require('mqtt');
const { saveMessageToFirebase } = require('../controllers/mqttController');

const init = () => {
    const client = mqtt.connect(process.env.MQTT_BROKER_URL);

    client.on('connect', () => {
        console.log('Connected to MQTT broker');
        client.subscribe(process.env.MQTT_TOPIC, (err) => {
            if (err) console.error('Subscription error:', err);
        });
    });

    client.on('message', (topic, message) => {
        const msg = message.toString();
        console.log(`Received message on topic ${topic}: ${msg}`);
        saveMessageToFirebase(msg);
    });
};

module.exports = { init };