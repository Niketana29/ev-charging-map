import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { useEffect, useState } from "react";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const BatteryGraph = ({ batteryLevel }) => {
  const [batteryData, setBatteryData] = useState([]);

  useEffect(() => {
    // Debounce updates to prevent excessive re-renders
    const timer = setTimeout(() => {
      setBatteryData((prevData) => [...prevData.slice(-9), batteryLevel]); // Keep last 10 values
    }, 500); 

    return () => clearTimeout(timer); // Cleanup function
  }, [batteryLevel]);

  const BatteryGraph = ({ batteryData }) => {
    const data = {
      labels: batteryData.map((_, index) => `T${index + 1}`),
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

};

export default BatteryGraph;
