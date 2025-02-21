require("dotenv").config({ path: ".env.backend" });
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const googleMapsApiKey = process.env.BACKEND_GOOGLE_MAPS_API_KEY;

app.use(express.json());

app.use(cors({
    origin: ["http://localhost:3000", "https://evatlas.vercel.app"], // ✅ Allow both local & deployed frontend
    methods: ["GET", "POST", "OPTIONS"], 
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ Battery Status API
app.get("/battery-status", (req, res) => {
    const batteryLevel = Math.floor(Math.random() * 100);
    res.json({ level: batteryLevel });
});

// ✅ Geocoding API
app.get("/geocode", async (req, res) => {
    try {
        const { address } = req.query;
        if (!address) return res.status(400).json({ error: "❌ Address parameter is required" });

        const { data } = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
            params: { address, key: googleMapsApiKey },
        });

        if (data.status !== "OK") {
            return res.status(400).json({ error: "❌ Geocoding failed", details: data.status });
        }

        res.json(data);
    } catch (error) {
        console.error("Geocoding API Error:", error);
        res.status(500).json({ error: "❌ Internal server error" });
    }
});

// ✅ Directions API
app.get("/directions", async (req, res) => {
    try {
        const { origin, destination } = req.query;
        if (!origin || !destination) return res.status(400).json({ error: "❌ Both origin and destination are required" });

        const { data } = await axios.get("https://maps.googleapis.com/maps/api/directions/json", {
            params: { origin, destination, mode: "driving", key: googleMapsApiKey },
        });

        if (data.status !== "OK") {
            return res.status(400).json({ error: "❌ Failed to fetch directions", details: data.status });
        }

        res.json(data);
    } catch (error) {
        console.error("Directions API Error:", error);
        res.status(500).json({ error: "❌ Internal server error" });
    }
});

// ✅ Route Calculation API
app.post("/calculate-route", async (req, res) => {
    try {
        const { origin, destination } = req.body;
        if (!origin || !destination) return res.status(400).json({ error: "❌ Both origin and destination are required" });

        const { data } = await axios.get("https://maps.googleapis.com/maps/api/directions/json", {
            params: { origin, destination, mode: "driving", key: googleMapsApiKey },
        });

        res.json(data);
    } catch (error) {
        console.error("Error fetching directions:", error);
        res.status(500).json({ error: "❌ Failed to fetch directions" });
    }
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
