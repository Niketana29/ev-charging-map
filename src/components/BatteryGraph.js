import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { useEffect, useState } from "react";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const BatteryGraph = ({ batteryLevel }) => {
  const [batteryData, setBatteryData] = useState([]);
  const [timeLabels, setTimeLabels] = useState([]);

  useEffect(() => {
    const currentTime = new Date().toLocaleTimeString(); // Capture current time

    // Ensure only the last 10 entries are stored
    setBatteryData((prevData) => [...prevData.slice(-9), batteryLevel]);
    setTimeLabels((prevLabels) => [...prevLabels.slice(-9), currentTime]); // Store timestamps
  }, [batteryLevel]);

  const data = {
    labels: timeLabels, // Use timestamps instead of generic T1, T2, etc.
    datasets: [
      {
        label: "Battery Level (%)",
        data: batteryData,
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
    <div style={{ height: "200px", width: "100%", margin: "10px 0" }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default BatteryGraph;
