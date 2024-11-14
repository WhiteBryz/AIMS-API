const { database } = require('../config/firebase');
const { ref, set } = require('firebase/database');

const saveMessageToFirebase = async (msg) => {
    try {
        const timestamp = Date.now();
        await set(ref(database, `messages/${timestamp}`), {
            message: msg,
            timestamp,
        });
        console.log('Message saved to Firebase');
    } catch (error) {
        console.error('Error saving message to Firebase:', error);
    }
};

module.exports = { saveMessageToFirebase };