require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Geocoding API Endpoint
app.get("/directions", async (req, res) => {
  const { origin, destination } = req.query;
  if (!origin || !destination) {
    return res.status(400).json({ error: "Missing origin or destination" });
  }

  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${process.env.GOOGLE_MAPS_API_KEY}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Directions API error:", error);
    res.status(500).json({ error: "Failed to fetch directions" });
  }
});


// Start Server
app.listen(5000, () => console.log("✅ Backend running at http://localhost:5000"));
