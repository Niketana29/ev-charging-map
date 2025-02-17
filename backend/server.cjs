require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());

app.get("/geocode", async (req, res) => {
    const { address } = req.query;
    if (!address) {
        return res.status(400).json({ error: "Missing address parameter" });
    }

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Geocoding API error:", error);
        res.status(500).json({ error: "Failed to fetch geocode data" });
    }
});

app.get("/directions", async (req, res) => {
    const { origin, destination } = req.query;
    if (!origin || !destination) {
        return res.status(400).json({ error: "Missing origin or destination" });
    }

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${process.env.GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Directions API error:", error);
        res.status(500).json({ error: "Failed to fetch directions" });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

