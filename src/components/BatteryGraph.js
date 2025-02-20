import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { useEffect, useState } from "react";
import { useRef } from "react";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const BatteryGraph = ({ batteryLevel }) => {
  const [batteryData, setBatteryData] = useState([]);
  const [timeLabels, setTimeLabels] = useState([]);
  const batteryDataRef = useRef([]);
  const timeLabelsRef = useRef([]);

  useEffect(() => {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (batteryDataRef.current.length >= 10) batteryDataRef.current.shift();
    if (timeLabelsRef.current.length >= 10) timeLabelsRef.current.shift();

    batteryDataRef.current.push(batteryLevel);
    timeLabelsRef.current.push(currentTime);
  }, [batteryLevel]);


  const data = {
    labels: timeLabelsRef.current, // Use timestamps instead of generic T1, T2, etc.
    datasets: [
      {
        label: "Battery Level (%)",
        data: batteryDataRef.current,
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="battery-graph-container" style={{ height: "200px", width: "100%", margin: "10px 0" }}>
      <Line data={data} options={{ responsive: true, maintainAspectRatio: false }} />
    </div>
    
  );
};

export default BatteryGraph;
