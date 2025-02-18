const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Fetch Battery Status
app.get("/battery-status", (req, res) => {
  const batteryLevel = Math.floor(Math.random() * 100); // Simulated battery level
  res.json({ level: batteryLevel });
});

// Route Calculation (Using Backend API Key)
app.post("/calculate-route", async (req, res) => {
  const { origin, destination } = req.body;

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json`,
      {
        params: {
          origin: encodeURIComponent(origin),
          destination: encodeURIComponent(destination),
          mode: "driving",  // Use correct 'mode' instead of 'travelMode'
          key: process.env.BACKEND_GOOGLE_MAPS_API_KEY,
        },
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching directions:", error);
    res.status(500).json({ error: "Failed to fetch directions" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
