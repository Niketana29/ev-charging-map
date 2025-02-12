import { ProgressBar, Alert } from "react-bootstrap";

const BatteryIndicator = ({ batteryLevel }) => {
  return (
    <div>
      
      {batteryLevel < 20 && (
        <Alert variant="danger" className="battery-alert">
          ⚠️ Warning: Battery level is low! Find a charging station soon.
        </Alert>
      )}
    </div>
  );
};

export default BatteryIndicator;
