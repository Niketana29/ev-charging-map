import React, { useState } from "react";
import { useLoadScript } from "@react-google-maps/api";
import NotificationsSidebar from "./components/NotificationsSidebar";
import BatteryIndicator from "./components/BatteryIndicator";
import EVChargingMap from "./components/EVChargingMap";
import "./App.css";

const libraries = ["places"];

const App = () => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries,
    });

    const [notifications, setNotifications] = useState([]);
    const [batteryLevel, setBatteryLevel] = useState(80);
    const [estimatedTime, setEstimatedTime] = useState("");

    const addNotification = (message) => {
        setNotifications((prev) => [...prev, { id: Date.now(), text: message }]);
    };

    const clearNotifications = () => setNotifications([]);
    const removeNotification = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));

    if (!isLoaded) return <p>Loading Google Maps...</p>;

    return (
        <div className="app-container" style={{ display: "flex", flexDirection: "row", height: "100vh" }}>
            <div style={{ flex: 1, padding: "20px" }}>
                <EVChargingMap addNotification={addNotification} setEstimatedTime={setEstimatedTime} />
                <BatteryIndicator batteryLevel={batteryLevel} />

                {estimatedTime && (
                    <p style={{ fontSize: "16px", fontWeight: "bold", margin: "10px 0", color: "#333" }}>
                        Estimated Travel Time: {estimatedTime} mins
                    </p>
                )}

                <button
                    onClick={() => addNotification(`⚡ Battery Consumption Estimate: ${(Math.random() * 0.5).toFixed(2)} kWh`)}
                    style={{ background: "#007bff", color: "white", padding: "10px", borderRadius: "5px", margin: "10px 5px" }}
                >
                    Show Battery Info
                </button>

                <button
                    onClick={() => addNotification(`🕒 Estimated Travel Time: ${estimatedTime || Math.floor(Math.random() * 20) + 5} mins`)}
                    style={{ background: "#28a745", color: "white", padding: "10px", borderRadius: "5px", margin: "10px 5px" }}
                >
                    Show Travel Time
                </button>
            </div>

            <NotificationsSidebar notifications={notifications} clearNotifications={clearNotifications} removeNotification={removeNotification} />
        </div>
    );
};

export default App;
