import React, { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  DirectionsRenderer,
  Autocomplete,
  useLoadScript,
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
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
});

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
  const [loading, setLoading] = useState(false);


  const startLocationRef = useRef(null);
  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("❌ Google Maps API Key is missing!");
    addNotification("⚠️ API Key issue detected!", "danger");
}

  console.log("Google Maps API Key:", process.env.REACT_APP_GOOGLE_MAPS_API_KEY);

  const backendApiKey = process.env.BACKEND_GOOGLE_MAPS_API_KEY;


  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            });
        },
        (error) => {
            console.error("Geolocation Error:", error);
            addNotification("⚠️ Location access denied!", "warning");
        }
    );
}, []);

// Remove notifications after 5 seconds
useEffect(() => {
    if (notifications.length === 0) return;

    const timer = setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
    }, 5000);

    return () => clearTimeout(timer);
}, [notifications]);

// Function to add notifications
const addNotification = (message, type = "info") => {
    setNotifications((prev) => [...prev, { message, type }]);
};



 
useEffect(() => {
  // Simulate battery drain (for testing)
  const interval = setInterval(() => {
    setBatteryLevel((prev) => (prev > 0 ? prev - 1 : 0));
  }, 3000); // Decrease battery every 3 seconds

  return () => clearInterval(interval);
}, []);

useEffect(() => {
  if (map && userLocation) {
      map.setCenter(userLocation);
  }
}, [map, userLocation]);

const handleMapLoad = (mapInstance) => {
  setMap(mapInstance);
  window.addEventListener("resize", () => {
      if (userLocation) {
          mapInstance.setCenter(userLocation);
      }
  });
};



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

  // Call function to load data

  if (trackLocation) {
    trackUserLocation();
  } else {
    if (watchId) navigator.geolocation.clearWatch(watchId);
  }
}, [trackLocation]);


  if (!isLoaded) return <div>Loading Google Maps...</div>;
  
  

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
  const R = 6371; // Earth's radius in km
  const dLat = ((coords2.latitude - coords1.latitude) * Math.PI) / 180;
  const dLng = ((coords2.longitude - coords1.longitude) * Math.PI) / 180;
  const lat1 = (coords1.latitude * Math.PI) / 180;
  const lat2 = (coords2.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const calculateBatteryConsumption = (distance, vehicleType, batteryLevel, setBatteryLevel, addNotification) => {
  if (!vehicleType) return;

  const consumptionRate = batteryConsumptionRates[vehicleType];
  if (!consumptionRate) {
    addNotification("Battery level is low!", "warning");
    return;
  }

  const consumedBattery = distance * consumptionRate;
  const newBatteryLevel = Math.max(0, batteryLevel - consumedBattery); // Prevent negative battery

  setBatteryLevel(newBatteryLevel);
  addNotification(`Battery level reduced to ${newBatteryLevel.toFixed(2)}%`);

  if (newBatteryLevel <= 0) {
    addNotification("Battery depleted! You need to recharge.");
  }
};

  
  
const fetchUserLocation = async () => {
  return new Promise(async (resolve) => {
    const permission = await navigator.permissions.query({ name: "geolocation" });
    
    if (permission.state === "denied") {
      console.warn("⚠️ Geolocation permission denied.");
      addNotification("⚠️ Location access denied. Using default location.", "warning");
      resolve({ latitude: 28.6139, longitude: 77.2090 }); // New Delhi
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error("⚠️ Geolocation Error:", error);
        addNotification("⚠️ Unable to fetch location. Using default location.", "warning");
        resolve({ latitude: 28.6139, longitude: 77.2090 }); // Default fallback
      }
    );
  });
};

  
const fetchGeocode = async (address) => {
  if (!address) {
    console.error("⚠️ Geocoding Error: Address is empty!");
    return null;
  }

  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
                params: {
                    address: encodeURIComponent(address),
                    key: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
                },
            });

            if (!response.data || response.data.status !== "OK") {
              console.error("❌ Geocoding API Error:", response.data.status);
              addNotification("❌ Invalid location. Try again!", "danger");
              return null;
          }
          return response.data.results[0].geometry.location;
          
        } catch (error) {
            console.error("Geocoding Error:", error);
            addNotification("❌ Error fetching location.", "danger");
            return null;
        }
    };



    const fetchDirections = async (startCoords, nearestStation) => {
      if (!startCoords || !nearestStation) {
          addNotification("❌ Invalid route locations. Please try again.", "danger");
          return null;
      }

      try {
          const response = await axios.get(
              `https://maps.googleapis.com/maps/api/directions/json`,
              {
                  params: {
                      origin: `${startCoords.lat},${startCoords.lng}`,
                      destination: `${nearestStation.latitude},${nearestStation.longitude}`,
                      mode: "driving",
                      key: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
                  },
              }
          );
          const data = response.data;
if (!data || data.status !== "OK") {
    addNotification("❌ Failed to fetch route. Try again.", "danger");
    return;
}

          
// Ensure data is properly assigned
          if (!data.routes || !data.routes[0] || !data.routes[0].legs) {
              addNotification("❌ Route data incomplete!", "danger");
              return;
          }
          
          // Now safely use `data`
          setDirections(data);

        const routeLeg = data.routes[0].legs[0];
          
        const routeDistance = routeLeg.distance.value / 1000;
        const batteryUsage = routeDistance * batteryConsumptionRates[vehicleType];
        
        setBatteryLevel((prev) => Math.max(0, prev - batteryUsage));
        setStoredBatteryUsage(batteryUsage);
        setStoredTravelTime(routeLeg.duration.text);
        
        addNotification(`📍 Estimated Travel Time: ${routeLeg.duration.text}`, "info");
        addNotification(`🔋 Estimated Battery Usage: ${batteryUsage.toFixed(2)}%`, "info");
        
        setCenter(startCoords);
        
        
      } catch (error) {
          console.error("❌ Failed to fetch directions:", error);
          addNotification("❌ Error fetching route data.", "danger");
          return null;
      }
  };

  const getNearestStation = (coords) => {
    if (!coords) {
        addNotification("⚠️ Invalid coordinates!", "warning");
        return null;
    }

    if (!chargingStations.length) {
        addNotification("⚠️ No charging stations available!", "warning");
        return null;
    }

    const validStations = chargingStations.filter(station =>
        station.latitude && station.longitude && station["Supported Vehicle Types"]?.includes(vehicleType)
    );

    if (!validStations.length) {
        addNotification("⚠️ No stations support your vehicle type!", "warning");
        return null;
    }

    return validStations.reduce((closest, station) => {
        const stationCoords = { lat: parseFloat(station.latitude), lng: parseFloat(station.longitude) };

        const distance = haversineDistance(coords, stationCoords);

        return distance < closest.distance ? { ...station, distance } : closest;
    }, { distance: Infinity });
};


  
  
 
const calculateRoute = async () => {
  console.log("🚀 Calculating Route...");
  console.log("📍 Search Type:", searchType);
  console.log("📍 Start Location (Before Geocoding):", startLocation);

  if (!vehicleType) {
    addNotification("⚠️ Please select a vehicle type!", "warning");
    return;
  }

  let startCoords = null;
  if (searchType === "startLocation") {
    startCoords = await fetchGeocode(startLocation);
  } else {
    startCoords = userLocation || await fetchUserLocation();
  }


  if (!startCoords || typeof startCoords.lat !== "number" || typeof startCoords.lng !== "number") {
    console.error("⚠️ Invalid start location:", startCoords);
    addNotification("⚠️ Unable to determine your location!", "warning");
    return;
}

  

  const nearestStation = getNearestStation(startCoords);
  if (!nearestStation) return;

  console.log("📍 Destination (Charging Station):", nearestStation);
  setLoading(true);
  try {
    const data = await fetchDirections(startCoords, nearestStation);
    if (!data) return;

    if (data && data.status === "OK") {
      setDirections(data);
  
      const routeDistance = data.routes[0].legs[0].distance.value / 1000;
      const batteryUsage = routeDistance * batteryConsumptionRates[vehicleType];

      setBatteryLevel((prev) => Math.max(0, prev - batteryUsage));
      setStoredBatteryUsage(batteryUsage);
      setStoredTravelTime(data.routes[0].legs[0].duration.text);

      addNotification(`📍 Estimated Travel Time: ${data.routes[0].legs[0].duration.text}`, "info");
      addNotification(`🔋 Estimated Battery Usage: ${batteryUsage.toFixed(2)}%`, "info");

      setCenter(startCoords);
    } else {
      addNotification("❌ Failed to fetch route. Try again.", "danger");
    }
  } catch (error) {
    console.error("❌ Error fetching directions:", error);
    addNotification("❌ Error fetching route data. Check API configuration.", "danger");
  }finally{
    setLoading(false);
  }
};



const calculateActualTravelTime = () => {
  if (!directions?.routes?.[0]?.legs)  {
      addNotification("⚠️ Please calculate a route first!", "warning");
      return;
  }

  const actualTime = directions.routes[0].legs[0].duration.text;
  setActualTravelTime(actualTime);
  addNotification(`⏳ Actual Travel Time: ${actualTime}`, "info");
};

  

  
  
  
  const handlePlaceChanged = () => {
    if (startLocationRef.current) {
      const place = startLocationRef.current.getPlace();
      if (place && place.geometry) {
          setStartLocation(place.formatted_address);
      }
  }
  
  };

  const loadGoogleMapsScript = () => {
    if (window.google?.maps) return; // Prevent multiple loads

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => console.log("✅ Google Maps API Loaded");
    document.body.appendChild(script);
};
loadGoogleMapsScript();

  
  
  
  

  
  

  return (
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
  <Form.Control
    type="range"
    min="0"
    max="100"
    value={batteryLevel}
    onChange={(e) => setBatteryLevel(parseInt(e.target.value))}
  />
</Form.Group>

<Button variant="primary" onClick={calculateRoute} className="mt-2" disabled={loading}>
    {loading ? "Calculating..." : "Calculate Route"}
</Button>

<Button variant="success" className="ml-2 mt-2" onClick={calculateActualTravelTime}>
    Log Travel Time
</Button>
<Button
    variant="info"
    className="ml-2 mt-2"
    onClick={() => setTrackLocation((prev) => !prev)}
    disabled={loading}
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
    <Marker
    key={`${station.latitude}-${station.longitude}`} 
    position={{ lat: parseFloat(station.latitude), lng: parseFloat(station.longitude) }}
/>
))}
</GoogleMap>

            
          </Col>
        </Row>
      </Container>
  );
};

export default EVChargingMap;
