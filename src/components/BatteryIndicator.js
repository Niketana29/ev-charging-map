import { ProgressBar, Alert } from "react-bootstrap";

const BatteryIndicator = ({ batteryLevel = 100 }) => {
  return (
    <div style={{ margin: "20px 0" }}>
      <h4>Battery Level</h4>
      <ProgressBar 
        now={batteryLevel} 
        label={`${batteryLevel}%`} 
        variant={batteryLevel < 20 ? "danger" : batteryLevel < 50 ? "warning" : "success"}
 
      />

    {batteryLevel < 20 && (
      <Alert variant="danger" className="battery-alert" style={{ marginTop: "10px", fontWeight: "bold" }}>
      ⚠️ Critical Battery! Please locate a charging station immediately.
      </Alert>
    )}

    </div>
  );
};

export default BatteryIndicator;
