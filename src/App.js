import React, { useState } from 'react';
import NotificationsSidebar from "./components/NotificationsSidebar";
import './App.css';
import BatteryIndicator from "./components/BatteryIndicator";
import EVChargingMap from "./components/EVChargingMap";

const App = () => {
    const [notifications, setNotifications] = useState([]);
    const [batteryLevel, setBatteryLevel] = useState(80);  // Example default level
    const [estimatedTime, setEstimatedTime] = useState('');

    const addNotification = (message) => {
        setNotifications((prev) => [...prev, { id: Date.now(), text: message }]);
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    return (
        <div className="app-container" style={{ display: "flex", flexDirection: "row", height: "100vh" }}>
            {/* Left Section: Map & Controls */}
            <div style={{ flex: 1, padding: "20px" }}>
                <EVChargingMap addNotification={addNotification} />
                <BatteryIndicator batteryLevel={batteryLevel} />

                {/* Buttons to trigger notifications dynamically */}
                <button 
                    onClick={() => addNotification(`Estimated Battery Consumption: ${(Math.random() * 0.5).toFixed(2)} kWh`)}
                    style={{
                        background: "#007bff",
                        color: "white",
                        border: "none",
                        padding: "10px",
                        borderRadius: "5px",
                        cursor: "pointer",
                        margin: "10px 5px"
                    }}
                >
                    Show Battery Info
                </button>

                <button 
                    onClick={() => addNotification(`Actual Travel Time: ${Math.floor(Math.random() * 20) + 5} mins`)}
                    style={{
                        background: "#28a745",
                        color: "white",
                        border: "none",
                        padding: "10px",
                        borderRadius: "5px",
                        cursor: "pointer",
                        margin: "10px 5px"
                    }}
                >
                    Show Travel Time
                </button>
            </div>

            {/* Right Section: Notifications Sidebar */}
            <NotificationsSidebar notifications={notifications} clearNotifications={clearNotifications} />
        </div>
    );
};

export default App;
