const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

require("dotenv").config({ path: ".env(backend)" }); // Ensure correct environment file is used


const cors = require("cors");
app.use(cors({
    origin: ["http://localhost:3000", "https://evatlas.vercel.app"], // Allow both local and deployed frontend
    methods: ["GET", "POST"], // Restrict allowed methods
    credentials: true, // Allow credentials (if needed)
}));


const googleMapsApiKey = process.env.BACKEND_GOOGLE_MAPS_API_KEY; // Ensure correct variable name


// Fetch Battery Status
app.get("/battery-status", (req, res) => {
  const batteryLevel = Math.floor(Math.random() * 100); // Simulated battery level
  res.json({ level: batteryLevel });
});

app.get("/geocode", async (req, res) => {
  try {
      const { address } = req.query;
      if (!address) {
          return res.status(400).json({ error: "❌ Address parameter is required" });
      }

      const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
          params: {
              address,
              key: googleMapsApiKey,
          },
      });

      if (response.data.status !== "OK") {
          return res.status(400).json({ error: "❌ Geocoding failed", details: response.data.status });
      }

      res.json(response.data);
  } catch (error) {
      console.error("Geocoding API Error:", error);
      res.status(500).json({ error: "❌ Internal server error" });
  }
});

app.get("/directions", async (req, res) => {
  try {
      const { origin, destination } = req.query;

      if (!origin || !destination) {
          return res.status(400).json({ error: "❌ Both origin and destination are required" });
      }

      const response = await axios.get("https://maps.googleapis.com/maps/api/directions/json", {
          params: {
              origin,
              destination,
              mode: "driving",
              key: googleMapsApiKey,
          },
      });

      if (response.data.status !== "OK") {
          return res.status(400).json({ error: "❌ Failed to fetch directions", details: response.data.status });
      }

      res.json(response.data);
  } catch (error) {
      console.error("Directions API Error:", error);
      res.status(500).json({ error: "❌ Internal server error" });
  }
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

