import React, { useState } from 'react';
import NotificationsSidebar from "./components/NotificationsSidebar";
import './App.css';
import BatteryGraph from "./components/BatteryGraph";
import BatteryIndicator from "./components/BatteryIndicator";
import EVChargingMap from "./components/EVChargingMap";

const App = () => {
    const [notifications, setNotifications] = useState([]);
    const [batteryLevel, setBatteryLevel] = useState(80);  // Example default level
    const [batteryData, setBatteryData] = useState([50, 60, 70, 80, 90]);  // Sample graph data

    const addNotification = (message) => {
        setNotifications((prev) => [...prev, { id: Date.now(), text: message }]);
    };

    const clearNotifications = () => {
        setNotifications([]);
    };
    const showBatteryInfo = () => {
        setNotifications("Battery Info: " + batteryLevel + "%");
        setSidebarOpen(true);  // Open sidebar automatically
    };
    
    const showTravelTime = () => {
        setNotification("Estimated Travel Time: " + estimatedTime);
        setSidebarOpen(true);  // Open sidebar automatically
    };
    

    return (
        <div className="app-container" style={{ display: "flex", flexDirection: "row", height: "100vh" }}>
            {/* Left Section: Map & Controls */}
            <div style={{ flex: 1, padding: "20px" }}>
                <EVChargingMap addNotification={addNotification} />
                <BatteryIndicator batteryLevel={batteryLevel} />

                {/* Buttons to trigger notifications dynamically */}
                <button onClick={() => addNotification(`Estimated Battery Consumption: ${(Math.random() * 0.5).toFixed(2)} kWh`)}>
                    Show Battery Info
                </button>
                <button onClick={() => addNotification(`Actual Travel Time: ${Math.floor(Math.random() * 20) + 5} mins`)}>
                    Show Travel Time
                </button>
            </div>

            {/* Right Section: Notifications Sidebar */}
            <NotificationsSidebar notifications={notifications} clearNotifications={clearNotifications} />
        </div>
    );
};

export default App;
