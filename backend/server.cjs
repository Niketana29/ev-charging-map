require('dotenv').config();  // Load environment variables
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const API_KEY = process.env.BACKEND_GOOGLE_MAPS_API_KEY;
if (!API_KEY) {
    console.error("❌ Google Maps API Key is missing! Set BACKEND_GOOGLE_MAPS_API_KEY in .env(backend)");
    process.exit(1); // Stop the server if API key is missing
}

app.get("/geocode", async (req, res) => {
    try {
        const { address } = req.query;
        if (!address) {
            return res.status(400).json({ error: "Address is required" });
        }

        // Make request to Google Geocoding API
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`
        );

        const data = response.data;
        if (data.status !== "OK") {
            return res.status(400).json({ error: data.status });
        }

        res.json(data);
    } catch (error) {
        console.error("Error fetching geocode data:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

app.get("/directions", async (req, res) => {
    const { origin, destination } = req.query;
    if (!origin || !destination) {
        return res.status(400).json({ error: "Missing origin or destination" });
    }

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${process.env.BACKEND_GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Directions API error:", error);
        res.status(500).json({ error: "Failed to fetch directions" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Backend is running on http://localhost:${PORT}`);
});

