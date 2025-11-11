const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");

// ==================== GOOGLE AUTH CLIENT ====================
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json", // download this from Google Cloud
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}
// ==================== CONFIG ====================
const SPREADSHEET_ID = "1KD-4498UGe-EZHkA3PLunYHoXAbUmdBzj-SzUvBMS28";
const TARGET_TAB = "CREATIVE INVENTORY (2)";
const RANGE = `${TARGET_TAB}!A6:Z`; // include headers (row 6–7 in your sheet)

// ==================== FETCH + FORMAT ====================
async function fetchCreativeSheetData() {
  try {
    const sheets = await getSheetsClient();
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    let rows = resp.data.values || [];
    if (!rows.length) return [];

    // === Identify header row ===
    const headerIndex = rows.findIndex((r) =>
      r.join(" ").toUpperCase().includes("ITEM DESCRIPTION")
    );
    if (headerIndex === -1) {
      console.warn("⚠️ Header row not found, returning raw data");
      return rows;
    }

    const headers = rows[headerIndex].map((h) => h.trim());
    const dataRows = rows.slice(headerIndex + 1);

    // === Parse grouped sections ===
    const structured = [];
    let currentSection = null;

    for (const row of dataRows) {
      const clean = row.map((v) => (v ? v.toString().trim() : ""));
      const [itemNo, description, uom, actual, damaged, disposal, good, remarks] = clean;

      const isSectionHeader =
        description &&
        !itemNo &&
        !uom &&
        !actual &&
        !damaged &&
        !disposal &&
        !good &&
        !remarks;

      if (isSectionHeader) {
        currentSection = { section: description, items: [] };
        structured.push(currentSection);
      } else if (currentSection && description) {
        currentSection.items.push({
          "Item No.": itemNo || "",
          "Item Description": description || "",
          UOM: uom || "",
          "Actual Count": actual || "",
          "Damage / For Repair": damaged || "",
          "For Disposal": disposal || "",
          "Good Inventory": good || "",
          Remarks: remarks || "",
        });
      }
    }

    return {
      headers: headers,
      grouped: structured,
    };
  } catch (err) {
    console.error("❌ Error fetching Google Sheets data:", err.message);
    throw err;
  }
}

// ==================== EXPORTS ====================
module.exports = {
  getSheetsClient,
  fetchCreativeSheetData,
  SPREADSHEET_ID,
};
