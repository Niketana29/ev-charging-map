require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Geocoding API Endpoint
app.get("/geocode", async (req, res) => {
  const address = req.query.address;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`;

  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching geocode data:", error);
    res.status(500).json({ error: "Failed to fetch geocode data" });
  }
});

// Start Server
app.listen(5000, () => console.log("✅ Backend running at http://localhost:5000"));
