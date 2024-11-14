require('dotenv').config();
const express = require('express');
const mqttService = require('./services/mqttService');
const mqttRoutes = require('./routes/mqttRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Iniciar servicio MQTT
mqttService.init();

app.use(express.json());
app.use('/api/mqtt', mqttRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});