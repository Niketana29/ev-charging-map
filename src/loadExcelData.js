import * as XLSX from "xlsx";

const loadExcelData = async () => {
  try {
    const response = await fetch("/verified_ev_stations_v2.xlsx"); // Load file from public folder
    const arrayBuffer = await response.arrayBuffer(); // Convert to ArrayBuffer
    const workbook = XLSX.read(arrayBuffer, { type: "array" }); // Read workbook
    const sheetName = workbook.SheetNames[0]; // Get first sheet
    const sheet = workbook.Sheets[sheetName]; // Get sheet data
    const jsonData = XLSX.utils.sheet_to_json(sheet); // Convert to JSON

    console.log("Excel Data:", jsonData); // Debugging output
    return jsonData; // Return JSON data
  } catch (error) {
    console.error("Error loading Excel file:", error);
    return [];
  }
};

export default loadExcelData;
