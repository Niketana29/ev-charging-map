import React, { useState, useEffect } from "react";
import NotificationsSidebar from "./components/NotificationsSidebar";
import BatteryIndicator from "./components/BatteryIndicator";
import EVChargingMap from "./components/EVChargingMap";
import "./App.css";

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL; // ✅ Use backend URL

const App = () => {
    const [notifications, setNotifications] = useState([]);
    const [batteryLevel, setBatteryLevel] = useState(80);
    const [estimatedTime, setEstimatedTime] = useState("");

    useEffect(() => {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // ✅ Fetch Battery Level from Backend
    useEffect(() => {
        fetch(`${BACKEND_URL}/battery-status`)
            .then((res) => res.json())
            .then((data) => setBatteryLevel(data.level));
    }, []);

    return (
        <div className="app-container">
            <EVChargingMap setEstimatedTime={setEstimatedTime} />
            <BatteryIndicator batteryLevel={batteryLevel} />
            {estimatedTime && <p>Estimated Travel Time: {estimatedTime} mins</p>}
            <NotificationsSidebar notifications={notifications} />
        </div>
    );
};

export default App;
