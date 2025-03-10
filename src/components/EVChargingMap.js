import React, { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  MarkerF,
  InfoWindow,
  DirectionsRenderer,
  LoadScript,
  Autocomplete,
  DirectionsService,
} from "@react-google-maps/api";
import { Button, Form, Container, Row, Col } from "react-bootstrap";
import axios from "axios";
import Papa from "papaparse";
import { ProgressBar, Alert } from "react-bootstrap";
import BatteryIndicator from "./BatteryIndicator";  // Import Battery Indicator
import BatteryGraph from "./BatteryGraph";  // Import Battery Graph
import loadExcelData from "../loadExcelData"; // Import the function
import NotificationsSidebar from "./NotificationsSidebar";
import { useLoadScript } from "@react-google-maps/api";


const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL
const libraries = ["places", "geometry"];
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
  const startLocationRef = useRef(null);
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,// Add any required libraries
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
  const [mapInstance, setMapInstance] = useState(null);
  const [stations, setStations] = useState([]);
  

  useEffect(() => {
    loadGoogleMapsScript();
  }, []);
  

// Get user location on mount
useEffect(() => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (!position || !position.coords) {
        console.error("Geolocation data is undefined");
        return;
      }
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    (error) => {
      console.error("Error getting location:", error);
    },
    { enableHighAccuracy: true }
  );
}, []);

useEffect(() => {
  if (startLocation && startLocation.lat && startLocation.lng) {
    console.log("Start location is valid:", startLocation);
  } else {
    console.warn("Invalid or missing start location");
  }
}, [startLocation]);

// Remove notifications after 5 seconds
useEffect(() => {
  if (notifications.length === 0) return;

  const timer = setTimeout(() => {
    setNotifications((prev) => (prev.length > 0 ? prev.slice(1) : prev));
  }, 5000);

  return () => {
    clearTimeout(timer);
  };
}, [notifications]);

// Handle window resize and keep the map centered
useEffect(() => {
  const handleResize = () => {
    if (map && center) {
      map.setCenter(center);
    }
  };

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, [map, center]);

// Simulate battery drain (for testing)
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 5000);

  return () => clearInterval(interval);
}, []);

// Ensure the map is updated when user location changes
useEffect(() => {
  if (!map || !userLocation || typeof map.setCenter !== "function") return;

  map.setCenter(userLocation);
}, [map, userLocation]);

// Fetch charging stations from the backend
useEffect(() => {
  const controller = new AbortController();

  fetch(`${BACKEND_URL}/api/getStations`, { signal: controller.signal })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => setStations(data))
    .catch((error) => {
      if (error.name !== "AbortError") {
        console.error("Error fetching stations:", error);
      }
    });

  return () => controller.abort();
}, []);

// Handle Google Maps autocomplete
/* global google */
useEffect(() => {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.warn("Google Maps API is not loaded yet.");
    return;
  }

  const input = document.getElementById("destination-input");
  if (!input) return;

  const autocomplete = new window.google.maps.places.Autocomplete(input);

  const handlePlaceChanged = () => {
    const place = autocomplete.getPlace();
    if (place.geometry && place.geometry.location) {
      setDestination({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    }
  };

  autocomplete.addListener("place_changed", handlePlaceChanged);

  return () => {
    if (autocomplete) {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    }
  };
}, []);

// Google Maps autocomplete service (seems unused)
useEffect(() => {
  if (window.google) {
    new window.google.maps.places.AutocompleteService();
  }
}, []);

// Track user location dynamically
useEffect(() => {
  let watchId;

  if (trackLocation) {
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => console.error("Tracking error:", error),
      { enableHighAccuracy: true }
    );
  }

  return () => {
    if (watchId !== undefined) {
      navigator.geolocation.clearWatch(watchId);
    }
  };
}, [trackLocation]);

// Cleanup function for removing an element safely
useEffect(() => {
  return () => {
    const element = document.getElementById("some-id");
    if (element) {
      element.remove(); // Safe way to remove an element
    }
  };
}, []);





 // Removed unnecessary isLoaded check
                
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

  const addNotification = (message, type = "info") => {
    setNotifications((prev) => [...prev, { message, type }]);
};

const fetchData = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/getStations`);
    const data = await response.json();
    setStations(data);
  } catch (error) {
    console.error("Error fetching stations:", error);
  }
};
  
  

const trackUserLocation = () => {
  if (navigator.geolocation) {
    const id = navigator.geolocation.watchPosition(
      (position) => {
        if (!position || !position.coords) {
          console.error("Invalid geolocation data received");
          return;
        }

        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        console.log("User Location:", newLocation);

        if (
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
        addNotification("⚠️ Unable to track location!", "warning");
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
    if (!address) {
      addNotification("⚠️ Please enter a valid address.", "warning");
      return null;
    }

    console.log("📍 Geocoding Address:", address);

    const response = await axios.get(
      `${process.env.REACT_APP_BACKEND_URL}/geocode?address=${encodeURIComponent(address)}`
    );

    console.log("📍 Geocode Response:", response.data);

    if (!response.data || response.data.status !== "OK" || !response.data.results.length) {
      console.error("❌ Geocoding failed:", response.data?.status || "No response");
      addNotification("⚠️ Address not found. Please enter a valid location.", "warning");
      return null;
    }

    return response.data.results[0].geometry.location;
  } catch (error) {
    console.error("Geocoding API error:", error);
    addNotification("⚠️ Unable to fetch location. Try again later.", "danger");
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
    addNotification("⚠️ Invalid vehicle type selected!", "warning");
    return;
  }

  const consumedBattery = distance * consumptionRate;
  const newBatteryLevel = Math.max(0, batteryLevel - consumedBattery); // Prevent negative battery

  setBatteryLevel(newBatteryLevel);
  addNotification(`🔋 Battery level reduced to ${newBatteryLevel.toFixed(2)}%`);

  if (newBatteryLevel === 0) {
    addNotification("⚠️ Battery depleted! You need to recharge immediately.");
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
  },
  { enableHighAccuracy: true, timeout: 10000 } // Add high accuracy and timeout
);

  });
};

  
const fetchGeocode = async (address) => {
  if (!address || !address.trim()) { // Ensure it's a string
    console.error("⚠️ Geocoding Error: Address is empty!");
    addNotification?.("⚠️ Please enter a valid address!", "warning");
    return null;
  }
  

  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
      params: {
        address: address,
        key: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      },
    });

    if (!response.data || response.data.status !== "OK" || !response.data.results.length) {
      console.error("❌ Geocoding API Error:", response.data.status);
      addNotification?.("❌ Invalid location. Try again!", "danger");
      return null;
    }

    return response.data.results[0].geometry.location;
  } catch (error) {
    console.error("Geocoding Error:", error);
    addNotification?.("❌ Error fetching location.", "danger");
    return null;
  }
};





const fetchDirections = async (startCoords, nearestStation) => {
  if (!startCoords || !nearestStation) {
    addNotification?.("❌ Invalid route locations. Please try again.", "danger");
    return null;
  }

  if (!window.google || !window.google.maps) {
    console.error("Google Maps API is not loaded.");
    addNotification?.("⚠️ Google Maps API not loaded. Try again later.", "warning");
    return null;
  }

  const directionsService = new google.maps.DirectionsService();

  return new Promise((resolve, reject) => {
    directionsService.route(
      {
        origin: new google.maps.LatLng(startCoords.latitude, startCoords.longitude),
        destination: new google.maps.LatLng(nearestStation.latitude, nearestStation.longitude),
        travelMode: google.maps.TravelMode.DRIVING, // Ensure travelMode exists
        provideRouteAlternatives: true, // Add alternate routes if possible

      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          console.log("✅ Directions API Response:", result);
          resolve(result);
        } else {
          console.error("❌ Directions request failed:", status);
          addNotification?.("❌ Failed to fetch route. Try again.", "danger");
          reject(status);
        }
      }
    );
  });
};


  

const getNearestStation = (coords) => {
  if (!coords) {
    addNotification?.("⚠️ Invalid coordinates!", "warning");
    return null;
  }

  if (!chargingStations?.length) {
    addNotification?.("⚠️ No charging stations available!", "warning");
    return null;
  }

  if (!vehicleType) {
    addNotification?.("⚠️ Please select a vehicle type!", "warning");
    return null;
  }

  const validStations = chargingStations.filter(station =>
    station.latitude && station.longitude &&
    !isNaN(+station.latitude) && !isNaN(+station.longitude) &&
    station["Supported Vehicle Types"]?.includes(vehicleType)
  );
  

  if (!validStations.length) {
    addNotification?.("⚠️ No stations support your vehicle type!", "warning");
    return null;
  }

  const nearest = validStations.reduce((closest, station) => {
    const stationCoords = { lat: parseFloat(station.latitude), lng: parseFloat(station.longitude) };
    const distance = haversineDistance(coords, stationCoords); // Ensure this function is defined
    return distance < closest.distance ? { station, distance } : closest;
  }, { station: null, distance: Infinity });

  return nearest.station || null;
};


const calculateRoute = async () => {
  console.log("🚀 Calculating Route...");
  console.log("📍 Search Type:", searchType);
  console.log("📍 Start Location (Before Geocoding):", startLocation);

  if (!vehicleType) {
    addNotification?.("⚠️ Please select a vehicle type!", "warning");
    return;
  }

  let startCoords = null;
  if (searchType === "startLocation") {
    startCoords = await fetchGeocode(startLocation);
  } else {
    startCoords = userLocation || await fetchUserLocation();
  }

  if (!startCoords || isNaN(startCoords.latitude) || isNaN(startCoords.longitude)) {
    console.error("⚠️ Invalid start location:", startCoords);
    addNotification?.("⚠️ Unable to determine your location!", "warning");
    return;
  }

  console.log("✅ Start Coordinates:", startCoords);

  const nearestStation = getNearestStation(startCoords);
  if (!nearestStation) {
    addNotification?.("⚠️ No nearby charging station found!", "warning");
    return;
  }

  console.log("📍 Destination (Charging Station):", nearestStation);

  if (loading) return;
  setLoading(true);

  try {
    const data = await fetchDirections(startCoords, nearestStation);
    if (!data) throw new Error("Failed to fetch route");

    setDirections?.(data);  

    const routeDistance = data.routes[0].legs[0].distance.value / 1000;
    const batteryUsage = routeDistance * batteryConsumptionRates[vehicleType];

    setBatteryLevel?.((prev) => Math.max(0, prev - batteryUsage));
    setStoredBatteryUsage?.(parseFloat(batteryUsage));
    setStoredTravelTime?.(data.routes[0].legs[0]?.duration?.text || "N/A");

    addNotification?.(`📍 Estimated Travel Time: ${data.routes[0].legs[0].duration.text}`, "info");
    addNotification?.(`🔋 Estimated Battery Usage: ${batteryUsage.toFixed(2)}%`, "info");

    setCenter?.({ lat: startCoords.latitude, lng: startCoords.longitude });

  } catch (error) {
    console.error("❌ Error fetching directions:", error);
    addNotification?.("❌ Error fetching route data. Check API configuration.", "danger");
  } finally {
    setLoading(false);
  }
};






const calculateActualTravelTime = () => {
  if (!directions?.routes?.[0]?.legs)  {
      addNotification("⚠️ Please calculate a route first!", "warning");
      return;
  }
const actualTime = directions?.routes?.[0]?.legs?.[0]?.duration?.text || "N/A";

  setActualTravelTime(actualTime);
  addNotification(`⏳ Actual Travel Time: ${actualTime}`, "info");
};

  

  
  
  
const handlePlaceChanged = () => {
  if (startLocationRef.current) {
    const place = startLocationRef.current.getPlace();

    if (!place.geometry || !place.geometry.location) {
      console.error("Invalid start location");
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    setStartLocation({ latitude: lat, longitude: lng });


    // Pan the map to the selected location
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(14); // Optional: Zoom into the location
    }
  }
};






const loadGoogleMapsScript = () => {
  if (window.google?.maps) return; // Skip if already loaded

  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
  if (existingScript) return; // Skip if script is already added

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
};


 return(
  <LoadScript
  googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
  libraries={["places"]}
>
  <Container className="mt-4">
    <Row className="justify-content-center">
      <Col xs={12} md={8}>
        <h2 className="text-center">Find Nearest EV Charging Station</h2>

        <Form>
          <Form.Group>
            <Form.Label>Search by</Form.Label>
            <Form.Control
              as="select"
              className="form-control-lg"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="startLocation">Start Location</option>
              <option value="currentLocation">Current Location</option>
            </Form.Control>
          </Form.Group>

          {searchType === "startLocation" && (
            <Form.Group>
              <Form.Label>Enter Start Location</Form.Label>
              <Autocomplete
                onLoad={(autocomplete) => (startLocationRef.current = autocomplete)}
                onPlaceChanged={handlePlaceChanged}
              >
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

          <Button variant="primary" onClick={!loading ? calculateRoute : null} className="mt-2" disabled={loading}>
            {loading ? "Calculating..." : "Calculate Route"}
          </Button>

          <Button variant="success" className="ml-2 mt-2" onClick={calculateActualTravelTime}>
            Log Travel Time
          </Button>

          <Button
            variant="info"
            className="ml-2 mt-2"
            onClick={() => {
              setTrackLocation((prev) => !prev);
              addNotification(trackLocation ? "🔴 Live Tracking Disabled" : "🟢 Live Tracking Enabled", "info");
            }}
            disabled={loading}
          >
            {trackLocation ? "Disable" : "Enable"} Live Tracking
          </Button>
        </Form>

        <div className="battery-graph-container">
          <BatteryGraph batteryLevel={batteryLevel} />
        </div>

        <div style={{ display: "flex" }}>
          <div style={{ flex: 1 }}>
            {/* Google Map */}
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={12}
              center={userLocation || { lat: 28.6139, lng: 77.2090 }}
              onLoad={(map) => {
                if (!mapInstance) {
                  setMapInstance(map); // Store the map instance
                }
              }}
            >
              {directions && <DirectionsRenderer directions={directions} />}
              {chargingStations.map((station, index) => (
  <MarkerF
    key={`${station.latitude}-${station.longitude}`} // Ensure unique key
    position={{ lat: parseFloat(station.latitude), lng: parseFloat(station.longitude) }}
    icon={{
      url: "https://maps.google.com/mapfiles/kml/shapes/charging_station.png",
      scaledSize: window.google?.maps ? new window.google.maps.Size(30, 30) : null, // Prevent undefined error
    }}
  />
))}

            </GoogleMap>
          </div>

          {/* Right Side: Notifications Sidebar */}
          <NotificationsSidebar notifications={notifications} />
        </div>
      </Col>
    </Row>
  </Container>
</LoadScript>

  );
};

export default EVChargingMap;
