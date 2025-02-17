import React, { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  DirectionsRenderer,
  Autocomplete,
  LoadScript,
} from "@react-google-maps/api";
import { Button, Form, Container, Row, Col } from "react-bootstrap";
import axios from "axios";
import Papa from "papaparse";
import { ProgressBar, Alert } from "react-bootstrap";
import BatteryIndicator from "./BatteryIndicator";  // Import Battery Indicator
import BatteryGraph from "./BatteryGraph";  // Import Battery Graph
import loadExcelData from "../loadExcelData"; // Import the function
import NotificationsSidebar from "./NotificationsSidebar";




const libraries = ["places"];
const mapContainerStyle = {
  width: "100%",
  height: "50vh",
  minHeight: "300px",
};


const batteryConsumptionRates = {
  EV1: 0.15, // 0.15 kWh per km
  EV2: 0.18, // 0.18 kWh per km
  EV3: 0.20, // 0.20 kWh per km
};



const EVChargingMap = () => {
  const [map, setMap] = useState(null);
  const [directions, setDirections] = useState(null);
  const [startLocation, setStartLocation] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [batteryLevel, setBatteryLevel] = useState(100); // Assume 100% charge initially
  const [searchType, setSearchType] = useState("startLocation");
  const [center, setCenter] = useState({ lat: 28.6139, lng: 77.209 });
  const [userLocation, setUserLocation] = useState(null);
  const [chargingStations, setChargingStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [trackLocation, setTrackLocation] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [actualTravelTime, setActualTravelTime] = useState(null);
  const mapRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const autocompleteRef = useRef(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [destination, setDestination] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [storedBatteryUsage, setStoredBatteryUsage] = useState(null);
  const [storedTravelTime, setStoredTravelTime] = useState(null);







  const startLocationRef = useRef(null);
  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const backendApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY_BACKEND;

 
useEffect(() => {
  // Simulate battery drain (for testing)
  const interval = setInterval(() => {
    setBatteryLevel((prev) => (prev > 0 ? prev - 1 : 0));
  }, 3000); // Decrease battery every 3 seconds

  return () => clearInterval(interval);
}, []);


useEffect(() => {
  if (!window.google) return; // Ensure Google API is loaded
  const input = document.getElementById("destination-input");
  if (input) {
    const autocomplete = new window.google.maps.places.Autocomplete(input);
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        setDestination(place.geometry.location);
      }
    });
  }
}, []);
/* global google */
useEffect(() => {
  if (window.google) {
    const service = new window.google.maps.places.AutocompleteService();
  }
}, []);




useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await loadExcelData(); // Load Excel file
      setChargingStations(data); // Store the stations in state
    } catch (error) {
      console.error("Error loading Excel data:", error);
    }
  };

  fetchData(); // Call function to load data

  if (trackLocation) {
    trackUserLocation();
  } else {
    if (watchId) navigator.geolocation.clearWatch(watchId);
  }
}, [trackLocation]);
  
  

  const BatteryIndicator = ({ batteryLevel }) => {
    return (
      <div>
        <h5>Battery Level: {batteryLevel.toFixed(2)}%</h5>
        <ProgressBar
          now={batteryLevel}
          label={`${batteryLevel.toFixed(2)}%`}
          variant={batteryLevel < 20 ? "danger" : batteryLevel < 50 ? "warning" : "success"}
        />
        {batteryLevel < 20 && (
  <Alert variant="danger">
    ⚠️ Warning: Battery level is low! Find a charging station soon.
  </Alert>
)}

      </div>
    );
  };
  
  

  const trackUserLocation = () => {
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
  
          // ✅ Debugging
          console.log("User Location:", newLocation);
  
          // ✅ Validate the location before updating state
          if (
            newLocation &&
            typeof newLocation.lat === "number" &&
            typeof newLocation.lng === "number" &&
            !isNaN(newLocation.lat) &&
            !isNaN(newLocation.lng)
          ) {
            setUserLocation(newLocation);
            setCenter(newLocation);
          } else {
            console.error("Invalid location received:", newLocation);
          }
        },
        (error) => {
          console.warn("Geolocation error:", error);
          addNotification("Battery level is low!", "warning");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      setWatchId(id);
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };
  
  const findNearestChargingStation = (origin, chargingStations) => {
    let nearestStation = null;
    let minDistance = Number.MAX_VALUE;

    chargingStations.forEach(station => {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(origin.lat, origin.lng),
            new google.maps.LatLng(station.lat, station.lng)
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearestStation = station;
        }
    });

    return nearestStation;
};



const getCoordinates = async (address) => {
  try {
    if (!address) return null;
    console.log("📍 Geocoding Address:", address);

    const response = await axios.get(
      `${process.env.REACT_APP_BACKEND_URL}/geocode?address=${encodeURIComponent(address)}`
    );

    console.log("📍 Geocode Response:", response.data);

    if (response.data.status !== "OK" || response.data.results.length === 0) {
      console.error("❌ Geocoding failed:", response.data.status);
      addNotification("⚠️ Invalid address. Try another.", "warning");
      return null;
    }

    return response.data.results[0].geometry.location;
  } catch (error) {
    console.error("Geocoding API error:", error);
    return null;
  }
};


  

  

  const haversineDistance = (coords1, coords2) => {
    const R = 6371;
    const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
    const dLng = ((coords2.lng - coords1.lng) * Math.PI) / 180;
    const lat1 = (coords1.lat * Math.PI) / 180;
    const lat2 = (coords2.lat * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };
  const calculateBatteryConsumption = (distance) => {
    if (!vehicleType || !batteryConsumptionRates[vehicleType]) {
      addNotification("⚠️ Invalid vehicle type or missing consumption rate!", "warning");
      return;
    }
  
    const consumptionRate = batteryConsumptionRates[vehicleType];
    const consumedBattery = distance * consumptionRate;
    const newBatteryLevel = Math.max(0, batteryLevel - consumedBattery);
  
    setBatteryLevel(newBatteryLevel);
    setNotifications([...notifications, `🔋 Battery level reduced to ${newBatteryLevel.toFixed(2)}%`]);
  
    if (newBatteryLevel <= 0) {
      setNotifications([...notifications, "❌ Battery depleted! You need to recharge."]);
    }
  };
  
  
  const fetchUserLocation = async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported by browser"));
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => reject(error)
      );
    });
  };
  
  
  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/geocode?address=${encodeURIComponent(address)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
  
      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].geometry.location;
      } else {
        addNotification("❌ Geocoding failed! Please enter a valid address.", "danger");
        return null;
      }
    } catch (error) {
      console.error("❌ Geocoding API error:", error);
      addNotification("❌ Error fetching geocode data. Check API settings.", "danger");
      return null;
    }
  };
  
  
  
  


  const getNearestStation = (coords) => {
    if (!coords || !chargingStations || chargingStations.length === 0) return null;
    
    let nearest = null;
    let minDistance = Infinity;
  
    chargingStations.forEach((station) => {
      if (!station.latitude || !station.longitude || !station["Supported Vehicle Types"]?.includes(vehicleType)) return;
  
      const stationCoords = {
        lat: parseFloat(station.latitude),
        lng: parseFloat(station.longitude),
      };
  
      const distance = haversineDistance(coords, stationCoords);
      if (distance < minDistance && distance <= 50) {
        minDistance = distance;
        nearest = { ...station, distance: minDistance };
      }
    });
  
    if (!nearest) {
      addNotification("⚠️ No nearby charging station found!", "warning");
    }
  
    return nearest;
  };
  
  

  
  const calculateRoute = async () => {
    console.log("🚀 Calculating Route...");
  
    if (!vehicleType) {
      addNotification("⚠️ Please select a vehicle type!", "warning");
      return;
    }
  
    let startCoords = searchType === "startLocation"
      ? await geocodeAddress(startLocation)
      : userLocation || await fetchUserLocation();
  
    if (!startCoords || !startCoords.lat || !startCoords.lng) {
      addNotification("⚠️ Unable to determine your location!", "warning");
      return;
    }
  
    const nearestStation = getNearestStation(startCoords);
    if (!nearestStation) {
      addNotification("⚠️ No nearby charging station found!", "warning");
      return;
    }
  
    const destination = { lat: parseFloat(nearestStation.latitude), lng: parseFloat(nearestStation.longitude) };
  
    console.log("📍 Destination (Charging Station):", destination);
  
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/directions?origin=${startCoords.lat},${startCoords.lng}&destination=${destination.lat},${destination.lng}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
  
      if (data.status === "OK") {
        setDirections(data);
        addNotification(`📍 Estimated Travel Time: ${data.routes[0].legs[0].duration.text}`, "info");
      } else {
        addNotification("❌ Failed to fetch route. Try again.", "danger");
      }
    } catch (error) {
      console.error("❌ Error fetching directions:", error);
      addNotification("❌ Error fetching route data. Check API configuration.", "danger");
    }
  };
  
  
  


  const calculateActualTravelTime = () => {
    if (!directions || !directions.routes || !directions.routes[0].legs) {
      addNotification("⚠️ Please calculate a route first!", "warning");
      return;
    }
  
    const actualTime = directions.routes[0].legs[0].duration.text;
    setActualTravelTime(actualTime);
    addNotification(`⏳ Actual Travel Time: ${actualTime}`);
  };
  
  
  const handlePlaceSelect = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        setStartLocation(place.formatted_address);
      }
    }
  };

  const addNotification = (message, type = "info") => {
    setNotifications((prev) => [...prev, { message, type }]);
  };
  
  
  const handlePlaceChanged = () => {
    if (startLocationRef.current) {
      const place = startLocationRef.current.getPlace();
      if (place && place.geometry) {
        setStartLocation(place.formatted_address);
      }
    }
  };
  
  
  

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
      <Container className="mt-4">
        <Row className="justify-content-center">
          <Col xs={12} md={8}>
            <h2 className="text-center">Find Nearest EV Charging Station</h2>

            <Form>
              <Form.Group>
                <Form.Label>Search by</Form.Label>
                <Form.Control as="select" className="form-control-lg" value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                  <option value="startLocation">Start Location</option>
                  <option value="currentLocation">Current Location</option>
                </Form.Control>
              </Form.Group>

              {searchType === "startLocation" && (
                <Form.Group>
                  <Form.Label>Enter Start Location</Form.Label>
                  <Autocomplete onLoad={(autocomplete) => (startLocationRef.current = autocomplete)} onPlaceChanged={handlePlaceChanged}>
                    <Form.Control
                      type="text"
                      ref={startLocationRef}
                      placeholder="Enter Start Location"
                      onChange={(e) => setStartLocation(e.target.value)}
                    />
                  </Autocomplete>
            
                </Form.Group>
              )}

              <Form.Group>
                <Form.Label>Vehicle Type</Form.Label>
                <Form.Control
                  as="select"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  <option value="">Select Vehicle Type</option>
                  <option value="EV1">EV1</option>
                  <option value="EV2">EV2</option>
                  <option value="EV3">EV3</option>
                </Form.Control>
              </Form.Group>
              <Form.Group>
  <Form.Label>Battery Level: {Math.round(batteryLevel)}%</Form.Label>

  <Form.Control type="range" min="0" max="100" value={batteryLevel} readOnly />
</Form.Group>

              <Button variant="primary" onClick={calculateRoute}>Calculate Route</Button>
              <Button variant="success" className="ml-2" onClick={calculateActualTravelTime}>Log Travel Time</Button>
              <Button
              variant="info"
              className="ml-2"
              onClick={() => {
                setTrackLocation((prev) => !prev);
              }}
              >
                {trackLocation ? "Disable" : "Enable"} Live Tracking
              </Button>
            </Form>
            <div className="battery-graph-container">
            <BatteryGraph batteryLevel={batteryLevel} />
            </div>

            <div style={{ display: "flex" }}>
            {/* Left Side: Map */}
            <div style={{ flex: 1 }}>
            {/* Your Google Map and other UI elements */}
            </div>

            {/* Right Side: Notifications Sidebar */}
            <NotificationsSidebar notifications={notifications} />
            </div>
        
            <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={12}
            center={userLocation || center}
            onLoad={(map) => {
              setMap(map);
              window.addEventListener("resize", () => {
                if (userLocation) {
                  map.setCenter(userLocation);
                }
              });
            }}
            >

              {directions && <DirectionsRenderer directions={directions} />}
              {chargingStations.map((station, index) => (
                <Marker key={index} position={{ lat: parseFloat(station.latitude), lng: parseFloat(station.longitude) }} />
              ))}
            </GoogleMap>
            
          </Col>
        </Row>
      </Container>
    </LoadScript>
  );
};

export default EVChargingMap;
