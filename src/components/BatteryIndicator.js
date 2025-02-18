import { ProgressBar, Alert } from "react-bootstrap";

const BatteryIndicator = ({ batteryLevel }) => {
  return (
    <div style={{ margin: "20px 0" }}>
      <h4>Battery Level</h4>
      <ProgressBar 
        now={batteryLevel} 
        label={`${batteryLevel}%`} 
        variant={batteryLevel < 20 ? "danger" : "success"} 
      />

      {batteryLevel < 20 && (
        <Alert variant="danger" className="battery-alert" style={{ marginTop: "10px" }}>
          ⚠️ Warning: Battery level is low! Find a charging station soon.
        </Alert>
      )}
    </div>
  );
};

export default BatteryIndicator;
