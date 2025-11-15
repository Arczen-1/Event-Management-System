const { google } = require("googleapis");

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json", // download this from Google Cloud
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

const SPREADSHEET_ID = "17n0-GRnQWhQVDme94Uz3E0WOru_nP8AMH2v3QhEL9rQ";
const RANGE = "All Inventory!A:Z"; // if the tab is literally "Sheet1"
 // tab name + range

async function fetchMonitoringData() {
  const sheets = await getSheetsClient();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "All Inventory!A:Z",  // ✅ make sure "Sheet1" matches your actual tab name
  });

  const rows = resp.data.values || [];
  let sections = [];
  let currentSection = { header: [], rows: [] };

  rows.forEach((row) => {
  // detect header row for either monitoring sheet or inventory sheet
  if (
    (row.includes("DATE") && row.includes("ONHAND")) ||
    (row.includes("Item ID") && row.includes("Item Name"))
  ) {
    // save previous section if it exists
    if (currentSection.rows.length > 0) sections.push(currentSection);
    currentSection = { header: row, rows: [] };
  } else if (row.length > 0) {
    currentSection.rows.push(row);
  }
});

  // push the last section
  if (currentSection.rows.length > 0) sections.push(currentSection);

  return sections;
}



module.exports = { 
  getSheetsClient,
  fetchMonitoringData,
  SPREADSHEET_ID   };