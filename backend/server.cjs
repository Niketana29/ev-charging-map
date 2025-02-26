const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: ".env(backend)" });

const app = express();
const PORT = process.env.PORT || 5000;
const GOOGLE_MAPS_API_KEY = process.env.BACKEND_GOOGLE_MAPS_API_KEY;


app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("EV Charging Backend is Running...");
});

// ✅ Fetch Nearest Charging Station (Example)
app.get("/nearest-station", async (req, res) => {
    try {
        const { latitude, longitude } = req.query;
        if (!latitude || !longitude) {
            return res.status(400).json({ error: "Missing latitude or longitude" });
        }

        // Fetch nearest station logic using Google Places API
        const fetch = require("node-fetch");
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=charging_station&key=${GOOGLE_MAPS_API_KEY}`
        );

        const data = await response.json();
        if (data.results.length === 0) {
            return res.status(404).json({ error: "No charging station found nearby" });
        }

        res.json({ nearestStation: data.results[0] });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ API to Fetch Battery Status (Dummy Example)
app.get("/battery-status", (req, res) => {
    res.json({ level: Math.floor(Math.random() * 100) + 1 });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
