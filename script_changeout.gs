// HVAC Zoned Universal Pricing Extraction & JSON API Backend (v16.52.1)
// Updated: 2026-10-01 | Phase 1G Managed Create Naming | Phase 1F Managed Proposal Update |Phase 1E Backend Managed Proposal Listing | Phase 1D Backend Managed Proposal Load Foundation | Phase 1C Managed Proposal Docs Folder Routing | Phase 1A Managed Proposal Create Foundation | DURASTAR Integration, Common Site Transition, & Unified Mega-Auditing | Rich Z1 JSON Payload & DURASTAR Capitalization | Batch Approval Processor, Audit Ledger, & Mobile Triggers | AHRI Collision Detector & Full Z1 Alert Payload Restoration

/**
 * Serves the equipment data catalog as a JSON payload for external web apps.
 */
function doGet(e) {
    console.log("Starting Changeout JSON API Backend (v16.52.1)...");
    
    const enhancementData = getEnhancementData();
    // Fetch the 18-column data array
    const data = getEquipmentData();
    
    // Fetch Z1 self-healing alerts
    const masterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Unified Master");
    const alertValue = masterSheet ? masterSheet.getRange("Z1").getValue() : "";
    let alertPayload = null;
    if (alertValue) {
      try {
        alertPayload = JSON.parse(alertValue);
      } catch (err) {
        alertPayload = alertValue;
      }
    }
    
    // Return as a clean JSON payload
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: data, enhancements: enhancementData, alerts: alertPayload }))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Retrieves the equipment data catalog from the Unified Master spreadsheet tab.
 * Securely passes the data array to the frontend lookup UI.
 */
function getEquipmentData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Unified Master");
  if (!sheet) {
    console.log("Error: 'Unified Master' tab not found in spreadsheet.");
    return [];
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 12) return [];
  // Pull starting from row 12 across 20 columns (Col E to X is 20 columns, includes Flag)
  return sheet.getRange(12, 5, lastRow - 12 + 1, 20).getValues();
}

/**
 * Retrieves the enhancement data catalog from the Static_Enhancements spreadsheet tab.
 */
function getEnhancementData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Static_Enhancements");
  if (!sheet) {
    console.log("Warning: 'Static_Enhancements' tab not found in spreadsheet.");
    return [];
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  // Row 2 to end, Col 1 to 3
  const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  const results = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const category = String(row[0] || "").trim();
    const name = String(row[1] || "").trim();
    const price = row[2];
    
    // Ignore fully blank rows
    if (category === "" && name === "" && (price === "" || price === null)) {
      continue;
    }
    
    results.push({
      category: category,
      name: name,
      price: price
    });
  }
  
  return results;
}

/**
 * Extracts HVAC equipment pricing from the source sheet and pastes it into the active spreadsheet.
 * Target: Zoned Universal Script (AC, HP, Gas Furnace).
 * Uses the Bulk Array Method to prevent performance issues and timeout loops.
 * Segregated into distinct zones for clean maintenance.
 * Adopted the 18-Column Unified Schema (includes Tax Creditable).
 * Dynamically locates the header row and capacity row to prevent index shifts.
 * Includes fallback warnings for unrecognized cell background colors.
 */
const SOURCE_SPREADSHEET_ID = "15gWSfuY0A-uoLSw3XxCWA39CuZSzidnRqkolOk5UCSA";

const headersOutput = [
  "Source Row",
  "Site",
  "Capacity",
  "System Type",
  "Brand",
  "Series / Tier",
  "Mechanical Stage",
  "Application / Style",
  "SEER2",
  "EER2",
  "HSPF2",
  "AHRI",
  "Cooling BTU",
  "Heating BTU",
  "PAGE",
  "Width",
  "Height",
  "Price",
  "Tax Creditable"
];
  
  // Helper to convert Hex color to HSL Hue (0-360)
  function hexToHue(hex) {
    if (!hex || hex === "#ffffff" || hex.length < 7) return 0;
    const r = parseInt(hex.substring(1, 3), 16) / 255;
    const g = parseInt(hex.substring(3, 5), 16) / 255;
    const b = parseInt(hex.substring(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max === min) {
      h = 0; // achromatic
    } else {
      const d = max - min;
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return Math.round(h * 360);
  }
  
  // Helper to extract clean numbers
  function cleanNumber(val) {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  
  // Helper to extract AHRI number
  function extractAhri(str) {
    if (!str) return "";
    const match = String(str).match(/\d+/);
    return match ? match[0] : "";
  }
  
  // Helper to extract capacity/tonnage
  function extractCapacity(str) {
    if (!str) return "";
    const match = String(str).match(/(\d+(\.\d+)?)\s*-?\s*ton/i);
    return match ? match[1] + " Ton" : "";
  }
  
  // Helper to extract SEER2 value
  function extractSeer2(str) {
    if (!str) return "";
    const match = String(str).match(/(\d+(\.\d+)?)/);
    return match ? match[1] : "";
  }

  // Helper to parse the Salt Shield coating matrix
  function parseSaltShieldMatrix(sheet, startRow, categoryName) {
    const data = sheet.getRange(startRow, 1, 8, 8).getValues();
    const seerCols = [
      { colIdx: 2, label: "15-16 SEER2" },
      { colIdx: 4, label: "17 SEER2" },
      { colIdx: 5, label: "18 SEER2" },
      { colIdx: 6, label: "20+ SEER2" }
    ];
    
    const rowsToParse = [
      { rowIdx: 3, label: "1.5-2.5 Ton" },
      { rowIdx: 4, label: "3-5 Ton" },
      { rowIdx: 5, label: "1-4 Ton Package" },
      { rowIdx: 6, label: "9-24K Ductless" },
      { rowIdx: 7, label: "30-48K Ductless" }
    ];
    
    const results = [];
    for (let rInfo of rowsToParse) {
      const sizeLabel = rInfo.label;
      const rowVal = data[rInfo.rowIdx];
      for (let sInfo of seerCols) {
        const val = rowVal[sInfo.colIdx];
        const price = cleanNumber(val);
        if (price > 0) {
          results.push([
            categoryName,
            `${sizeLabel} | ${sInfo.label}`,
            price
          ]);
        }
      }
    }
    return results;
  }
  
function getMergedCellValue(r, c, mergedRanges, data) {
  for (let j = 0; j < mergedRanges.length; j++) {
    const range = mergedRanges[j];
    if (r >= range.getRow() && r <= range.getLastRow() &&
        c >= range.getColumn() && c <= range.getLastColumn()) {
      return data[range.getRow() - 1][range.getColumn() - 1];
    }
  }
  return data[r - 1][c - 1];
}

function findHeaderIndex(targetNames, headers) {
  for (let target of targetNames) {
    const idx = headers.findIndex(h => h.toUpperCase() === target.toUpperCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

  // Global scope established


  // ==========================================
  // ZONE 1: STRAIGHT COOL AC ENGINE
  // ==========================================
  function extractACAndOceana() {
    const sourceSpreadsheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
    const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const ZONE1_TAB_NAMES = ["1.5 Ton AC", "2 Ton AC", "2.5 Ton AC", "3 Ton AC", "3.5 Ton AC", "4 Ton AC", "5 Ton AC"];
    const ZONE1_DESTINATION_TAB_NAME = "Master_AC";
    
    console.log("Zone 1: Starting AC extraction...");
    const destSheet = activeSpreadsheet.getSheetByName(ZONE1_DESTINATION_TAB_NAME);
    if (!destSheet) {
      console.log("Zone 1 Warning: Destination sheet '" + ZONE1_DESTINATION_TAB_NAME + "' not found. Skipping Zone 1.");
    } else {
      const outputRows = [];
      
      for (const tabName of ZONE1_TAB_NAMES) {
        console.log("Zone 1: Processing tab: " + tabName);
        const sourceSheet = sourceSpreadsheet.getSheetByName(tabName);
        if (!sourceSheet) {
          console.log("Zone 1: Source sheet '" + tabName + "' not found. Skipping.");
          continue;
        }
        
        const lastRow = sourceSheet.getLastRow();
        const lastCol = sourceSheet.getLastColumn();
        if (lastRow < 7) {
          console.log("Zone 1: Source sheet '" + tabName + "' does not contain enough rows. Skipping.");
          continue;
        }
        
        const data = sourceSheet.getRange(1, 1, lastRow, lastCol).getValues();
        const colors = sourceSheet.getRange(1, 1, lastRow, lastCol).getBackgrounds();
        const mergedRanges = sourceSheet.getDataRange().getMergedRanges();
        
        const numRows = data.length;
        
        // Dynamic Capacity Locator
        let capacity = "";
        for (let r = 0; r < Math.min(10, data.length); r++) {
          const val = String(data[r][0] || "").trim();
          if (val.toUpperCase().includes("TON")) {
            capacity = val;
            break;
          }
        }
        
        let systemType = String(data[1][0] || "").trim();
        if (systemType === "") systemType = "STRAIGHT COOL";
        
        // Dynamic Y-Axis Header Locator
        let headerRowIndex = 6; // Default fallback to index 6 (row 7)
        for (let r = 0; r < Math.min(10, data.length); r++) {
          const rowValues = data[r].map(cell => String(cell || "").toUpperCase().trim());
          if (rowValues.includes("INVESTMENT PRICE") || rowValues.includes("PRICE")) {
            headerRowIndex = r;
            console.log("Zone 1: Dynamically located header row at index: " + headerRowIndex);
            break;
          }
        }
        
        const headers = data[headerRowIndex].map(h => String(h || "").trim());
        
        const seer2ColIndex = findHeaderIndex(["SEER2"], headers);
        const eer2ColIndex = findHeaderIndex(["EER2"], headers);
        const ahriColIndex = findHeaderIndex(["AHRI NUMBER", "AHRI NO", "AHRI"], headers);
        const btuColIndex = findHeaderIndex(["COOLING BTU", "BTU", "BTU's"], headers);
        const pageColIndex = findHeaderIndex(["PAGE", "PG", "PG."], headers);
        const widthColIndex = findHeaderIndex(["W", "Width"], headers);
        const heightColIndex = findHeaderIndex(["H", "Height"], headers);
        const priceColIndex = findHeaderIndex(["INVESTMENT PRICE", "PRICE"], headers);
        const taxColIndex = findHeaderIndex(["TAX CREDITABLE", "TAX CREDIT"], headers);
        
        if (priceColIndex === -1) {
          console.log("Zone 1: Required price header not found in '" + tabName + "'. Skipping.");
          continue;
        }
        
        let currentBrand = "";
        let currentMechStage = "SINGLE STAGE";
        let currentAppStyle = "STANDARD";
        
        const initialHeaderColA = String(data[headerRowIndex][0] || "").toString().toUpperCase().trim();
        if (initialHeaderColA === "CARRIER" || initialHeaderColA === "COMFORTMAKER" || initialHeaderColA === "RUUD") {
          currentBrand = initialHeaderColA;
        }
        
        const startRowIndex = headerRowIndex + 1;
        for (let i = startRowIndex; i < numRows; i++) {
          const row = data[i];
          const sheetRowNumber = i + 1;
          
          const colAValue = row[0];
          const colAStr = (colAValue || "").toString().toUpperCase().trim();
          const brandClean = colAStr.replace(/\s+/g, "");
          
          if (colAStr === "CARRIER" || colAStr === "COMFORTMAKER" || colAStr === "RUUD" || brandClean === "DURASTAR") {
            currentBrand = brandClean === "DURASTAR" ? "DURASTAR" : colAStr;
            currentMechStage = "SINGLE STAGE";
            currentAppStyle = "STANDARD";
          } else if (colAStr !== "") {
            // [!] FORCE FALLBACK RESET ON EVERY NEW SUB-HEADER
            currentMechStage = "SINGLE STAGE";
            currentAppStyle = "STANDARD";
            
            const rawText = colAStr.toUpperCase();
            if (rawText.includes("2 STAGE")) currentMechStage = "2 STAGE";
            else if (rawText.includes("VAR")) currentMechStage = "VARIABLE SPEED";
            
            if (rawText.includes("APARTMENT COASTAL")) currentAppStyle = "APARTMENT COASTAL";
            else if (rawText.includes("APARTMENT")) currentAppStyle = "APARTMENT";
            else if (rawText.includes("COASTAL")) currentAppStyle = "COASTAL";
            else if (rawText.includes("CROSSOVER")) currentAppStyle = "CROSSOVER";
          }
          
          const colBValue = row[1];
          const colBStr = String(colBValue || "").trim();
          if (colAStr.includes("INCLUDES") || colBStr.toUpperCase().includes("INCLUDES")) {
            break;
          }
          
          if (sourceSheet.isRowHiddenByFilter(sheetRowNumber) || sourceSheet.isRowHiddenByUser(sheetRowNumber)) {
            continue;
          }
          
          const priceValue = priceColIndex !== -1 ? row[priceColIndex] : "";
          const priceStr = String(priceValue === null || priceValue === undefined ? "" : priceValue);
          const cleanPriceStr = priceStr.replace(/[\$, ]/g, "");
          if (cleanPriceStr === "" || isNaN(Number(cleanPriceStr))) {
            continue;
          }
          
          const seriesColor = seer2ColIndex !== -1 ? colors[i][seer2ColIndex] : "#ffffff";
          let seriesName = "";
          const colorHex = seriesColor.toLowerCase();
          const hue = hexToHue(colorHex);
          
          if (currentBrand === "DURASTAR" || currentBrand === "RUUD") {
            seriesName = "STANDARD";
          } else {
            if (hue >= 180 && hue <= 270) {
              if (currentBrand === "CARRIER") seriesName = "INFINITY";
              else if (currentBrand === "COMFORTMAKER") seriesName = "MAIN LINE";
              else seriesName = "⚠️ UNRECOGNIZED COLOR";
            } else if (hue >= 70 && hue <= 160) {
              if (currentBrand === "CARRIER") seriesName = "PERFORMANCE";
              else if (currentBrand === "COMFORTMAKER") seriesName = "PERFORMER";
              else seriesName = "⚠️ UNRECOGNIZED COLOR";
            } else if (hue >= 35 && hue <= 65) {
              if (currentBrand === "CARRIER") seriesName = "COMFORT";
              else if (currentBrand === "COMFORTMAKER") seriesName = "BUILDER";
              else seriesName = "⚠️ UNRECOGNIZED COLOR";
            } else {
              seriesName = "⚠️ UNRECOGNIZED COLOR";
            }
          }
          
          const rawSeer2 = seer2ColIndex !== -1 ? row[seer2ColIndex] : "";
          const seer2Val = String(rawSeer2 === null || rawSeer2 === undefined ? "" : rawSeer2).replace(/\*/g, "").trim();
          const eer2Val = eer2ColIndex !== -1 ? row[eer2ColIndex] : "";
          const ahriVal = ahriColIndex !== -1 ? row[ahriColIndex] : "";
          const btuVal = btuColIndex !== -1 ? row[btuColIndex] : "";
          const pageVal = pageColIndex !== -1 ? String(getMergedCellValue(sheetRowNumber, pageColIndex + 1, mergedRanges, data) || "").trim() : "";
          const widthVal = widthColIndex !== -1 ? String(getMergedCellValue(sheetRowNumber, widthColIndex + 1, mergedRanges, data) || "").trim() : "";
          const heightVal = heightColIndex !== -1 ? String(getMergedCellValue(sheetRowNumber, heightColIndex + 1, mergedRanges, data) || "").trim() : "";
          const taxVal = taxColIndex !== -1 ? String(row[taxColIndex] || "").trim() : "";
          
          const outputRow = [
            "Row " + sheetRowNumber,
            "Common", // Site column (Col F)
            capacity,
            systemType,
            currentBrand,
            seriesName,
            currentMechStage,
            currentAppStyle,
            seer2Val,
            eer2Val,
            "", // HSPF2 (blank for AC)
            ahriVal,
            btuVal, // Cooling BTU
            "", // Heating BTU (blank for AC)
            pageVal,
            widthVal,
            heightVal,
            Number(cleanPriceStr),
            taxVal
          ];
          
          outputRows.push(outputRow);
        }
      }
      
      const destLastRow = destSheet.getLastRow();
      if (destLastRow >= 11) {
        destSheet.getRange(11, 5, destLastRow - 11 + 1, 22).clearContent();
      }
      destSheet.getRange(11, 5, 1, headersOutput.length).setValues([headersOutput]);
      if (outputRows.length > 0) {
        destSheet.getRange(12, 5, outputRows.length, 19).setValues(outputRows);
      }
      console.log("Zone 1: Completed AC extraction. Valid rows pasted: " + outputRows.length);
    }

// ==========================================
// ZONE 4: OCEANA EQUIPMENT (APPENDED)
// ==========================================
console.log("Zone 4: Starting Oceana Equipment extraction...");
const oceanaSheet = sourceSpreadsheet.getSheetByName("Oceana Pricing");
if (!oceanaSheet) {
  console.log("Zone 4 Warning: Source sheet 'Oceana Pricing' not found.");
} else {
  const oceanaData = oceanaSheet.getRange(1, 1, 15, 4).getValues();

  const parsedSystems = [];
  for (const col of [0, 1]) {
    const capRaw = String(oceanaData[2][col] || ""); // Row 3
    const capacity = extractCapacity(capRaw);
    const seerRaw = String(oceanaData[4][col] || ""); // Row 5
    const seer2 = extractSeer2(seerRaw);
    const stageRaw = String(oceanaData[6][col] || ""); // Row 7
    const stage = stageRaw.toUpperCase().includes("2-STAGE") || stageRaw.toUpperCase().includes("2 STAGE") ? "2 STAGE" : "SINGLE STAGE";
    const style = capRaw.toUpperCase().includes("COASTAL") ? "COASTAL" : "STANDARD";

    const carrierPriceRaw = String(oceanaData[8][col] || ""); // Row 9
    const carrierPrice = cleanNumber(carrierPriceRaw);
    const carrierAhriRaw = String(oceanaData[9][col] || ""); // Row 10
    const carrierAhri = extractAhri(carrierAhriRaw);

    if (carrierPrice > 0) {
      parsedSystems.push({
        capacity: capacity, brand: "CARRIER", series: "PERFORMANCE", stage: stage, style: style, seer2: seer2, ahri: carrierAhri, price: carrierPrice, rowNum: 9
      });
    }

    const cmPriceRaw = String(oceanaData[11][col] || ""); // Row 12
    const cmPrice = cleanNumber(cmPriceRaw);
    const cmAhriRaw = String(oceanaData[12][col] || ""); // Row 13
    const cmAhri = extractAhri(cmAhriRaw);

    if (cmPrice > 0) {
      parsedSystems.push({
        capacity: capacity, brand: "COMFORTMAKER", series: "PERFORMER", stage: stage, style: style, seer2: seer2, ahri: cmAhri, price: cmPrice, rowNum: 12
      });
    }
  }

  const destSheetAC = activeSpreadsheet.getSheetByName("Master_AC");
  if (destSheetAC && parsedSystems.length > 0) {
    const startRow = destSheetAC.getLastRow() + 1;
    const rowsToWrite = parsedSystems.map(sys => [
      "Row " + sys.rowNum, "Oceana", sys.capacity, "STRAIGHT COOL", sys.brand, sys.series, sys.stage, sys.style, sys.seer2, "", "", sys.ahri, "", "", "", "", "", sys.price, ""
    ]);
    destSheetAC.getRange(startRow, 5, rowsToWrite.length, 19).setValues(rowsToWrite);
    console.log(`Zone 4: Appended ${rowsToWrite.length} Oceana systems to Master_AC.`);
  }
  if (parsedSystems.length === 0) console.log("Zone 4 Warning: No valid Oceana systems found! Check coordinates.");
}
  }

  // ==========================================
  // ZONE 2: HEAT PUMP ENGINE
  // ==========================================
  function extractHeatPumps() {
    const sourceSpreadsheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
    const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const ZONE2_TAB_NAMES = ["1.5 Ton HP", "2 Ton HP", "2.5 Ton HP", "3 Ton HP", "3.5 Ton HP", "4 Ton HP", "5 Ton HP"];
    const ZONE2_DESTINATION_TAB_NAME = "Master_HP";
    
    console.log("Zone 2: Starting Heat Pump extraction...");
    const destSheet = activeSpreadsheet.getSheetByName(ZONE2_DESTINATION_TAB_NAME);
    if (!destSheet) {
      console.log("Zone 2 Warning: Destination sheet '" + ZONE2_DESTINATION_TAB_NAME + "' not found. Skipping Zone 2.");
    } else {
      const outputRows = [];
      
      for (const tabName of ZONE2_TAB_NAMES) {
        console.log("Zone 2: Processing tab: " + tabName);
        const sourceSheet = sourceSpreadsheet.getSheetByName(tabName);
        if (!sourceSheet) {
          console.log("Zone 2: Source sheet '" + tabName + "' not found. Skipping.");
          continue;
        }
        
        const lastRow = sourceSheet.getLastRow();
        const lastCol = sourceSheet.getLastColumn();
        if (lastRow < 7) {
          console.log("Zone 2: Source sheet '" + tabName + "' does not contain enough rows. Skipping.");
          continue;
        }
        
        const data = sourceSheet.getRange(1, 1, lastRow, lastCol).getValues();
        const colors = sourceSheet.getRange(1, 1, lastRow, lastCol).getBackgrounds();
        const mergedRanges = sourceSheet.getDataRange().getMergedRanges();
        
        const numRows = data.length;
        
        // Dynamic Capacity Locator
        let capacity = "";
        for (let r = 0; r < Math.min(10, data.length); r++) {
          const val = String(data[r][0] || "").trim();
          if (val.toUpperCase().includes("TON")) {
            capacity = val;
            break;
          }
        }
        
        let systemType = String(data[1][0] || "").trim();
        if (systemType === "") systemType = "STRAIGHT COOL";
        
        // Dynamic Y-Axis Header Locator
        let headerRowIndex = 6; // Default fallback to index 6 (row 7)
        for (let r = 0; r < Math.min(10, data.length); r++) {
          const rowStr = data[r].join(" ").toUpperCase();
          if ((rowStr.includes("INVESTMENT PRICE") || rowStr.includes("PRICE")) && (rowStr.includes("SEER2") || rowStr.includes("AHRI"))) {
            headerRowIndex = r;
            console.log("Zone 2: Dynamically located header row at index: " + headerRowIndex);
            break;
          }
        }
        
        const headers = data[headerRowIndex].map(h => String(h || "").trim());
        
        const seer2ColIndex = findHeaderIndex(["SEER2"], headers);
        const eer2ColIndex = findHeaderIndex(["EER2"], headers);
        const hspf2ColIndex = headers.findIndex(h => h.toUpperCase().includes("HSPF"));
        const ahriColIndex = findHeaderIndex(["AHRI NUMBER", "AHRI NO", "AHRI"], headers);
        const btuColIndex = findHeaderIndex(["COOLING BTU", "BTU", "BTU's"], headers);
        const heatBtuColIndex = findHeaderIndex(["HEATING BTU", "HEAT BTU"], headers);
        const pageColIndex = findHeaderIndex(["PAGE", "PG", "PG."], headers);
        const widthColIndex = findHeaderIndex(["W", "Width"], headers);
        const heightColIndex = findHeaderIndex(["H", "Height"], headers);
        const priceColIndex = findHeaderIndex(["INVESTMENT PRICE", "PRICE"], headers);
        const taxColIndex = findHeaderIndex(["TAX CREDITABLE", "TAX CREDIT"], headers);
        
        console.log("Zone 2 Diagnostic: Header Row = " + headerRowIndex);
        console.log("HSPF2 Col Index = " + hspf2ColIndex);
        
        if (priceColIndex === -1) {
          console.log("Zone 2: Required price header not found in '" + tabName + "'. Skipping.");
          continue;
        }
        
        let currentBrand = "";
        let currentMechStage = "SINGLE STAGE";
        let currentAppStyle = "STANDARD";
        
        const initialHeaderColA = String(data[headerRowIndex][0] || "").toString().toUpperCase().trim();
        if (initialHeaderColA === "CARRIER" || initialHeaderColA === "COMFORTMAKER" || initialHeaderColA === "RUUD") {
          currentBrand = initialHeaderColA;
        }
        
        const startRowIndex = headerRowIndex + 1;
        for (let i = startRowIndex; i < numRows; i++) {
          const row = data[i];
          const sheetRowNumber = i + 1;
          
          const colAValue = row[0];
          const colAStr = (colAValue || "").toString().toUpperCase().trim();
          const brandClean = colAStr.replace(/\s+/g, "");
          
          if (colAStr === "CARRIER" || colAStr === "COMFORTMAKER" || colAStr === "RUUD" || brandClean === "DURASTAR") {
            currentBrand = brandClean === "DURASTAR" ? "DURASTAR" : colAStr;
            currentMechStage = "SINGLE STAGE";
            currentAppStyle = "STANDARD";
          } else if (colAStr !== "") {
            // [!] FORCE FALLBACK RESET ON EVERY NEW SUB-HEADER
            currentMechStage = "SINGLE STAGE";
            currentAppStyle = "STANDARD";
            
            const rawText = colAStr.toUpperCase();
            if (rawText.includes("2 STAGE")) currentMechStage = "2 STAGE";
            else if (rawText.includes("VAR")) currentMechStage = "VARIABLE SPEED";
            
            if (rawText.includes("APARTMENT COASTAL")) currentAppStyle = "APARTMENT COASTAL";
            else if (rawText.includes("APARTMENT")) currentAppStyle = "APARTMENT";
            else if (rawText.includes("COASTAL")) currentAppStyle = "COASTAL";
            else if (rawText.includes("CROSSOVER")) currentAppStyle = "CROSSOVER";
          }
          
          const colBValue = row[1];
          const colBStr = String(colBValue || "").trim();
          if (colAStr.includes("INCLUDES") || colBStr.toUpperCase().includes("INCLUDES")) {
            break;
          }
          
          if (sourceSheet.isRowHiddenByFilter(sheetRowNumber) || sourceSheet.isRowHiddenByUser(sheetRowNumber)) {
            continue;
          }
          
          const priceValue = priceColIndex !== -1 ? row[priceColIndex] : "";
          const priceStr = String(priceValue === null || priceValue === undefined ? "" : priceValue);
          const cleanPriceStr = priceStr.replace(/[\$, ]/g, "");
          if (cleanPriceStr === "" || isNaN(Number(cleanPriceStr))) {
            continue;
          }
          
          const seriesColor = seer2ColIndex !== -1 ? colors[i][seer2ColIndex] : "#ffffff";
          let seriesName = "";
          const colorHex = seriesColor.toLowerCase();
          const hue = hexToHue(colorHex);
          
          if (currentBrand === "DURASTAR" || currentBrand === "RUUD") {
            seriesName = "STANDARD";
          } else {
            if (hue >= 180 && hue <= 270) {
              if (currentBrand === "CARRIER") seriesName = "INFINITY";
              else if (currentBrand === "COMFORTMAKER") seriesName = "MAIN LINE";
              else seriesName = "⚠️ UNRECOGNIZED COLOR";
            } else if (hue >= 70 && hue <= 160) {
              if (currentBrand === "CARRIER") seriesName = "PERFORMANCE";
              else if (currentBrand === "COMFORTMAKER") seriesName = "PERFORMER";
              else seriesName = "⚠️ UNRECOGNIZED COLOR";
            } else if (hue >= 35 && hue <= 65) {
              if (currentBrand === "CARRIER") seriesName = "COMFORT";
              else if (currentBrand === "COMFORTMAKER") seriesName = "BUILDER";
              else seriesName = "⚠️ UNRECOGNIZED COLOR";
            } else {
              seriesName = "⚠️ UNRECOGNIZED COLOR";
            }
          }
          
          const rawSeer2 = seer2ColIndex !== -1 ? row[seer2ColIndex] : "";
          const seer2Val = String(rawSeer2 === null || rawSeer2 === undefined ? "" : rawSeer2).replace(/\*/g, "").trim();
          const eer2Val = eer2ColIndex !== -1 ? row[eer2ColIndex] : "";
          const hspf2Val = hspf2ColIndex !== -1 ? row[hspf2ColIndex] : "";
          const ahriVal = ahriColIndex !== -1 ? row[ahriColIndex] : "";
          const btuVal = btuColIndex !== -1 ? row[btuColIndex] : "";
          const heatBtuVal = heatBtuColIndex !== -1 ? row[heatBtuColIndex] : "";
          const pageVal = pageColIndex !== -1 ? String(getMergedCellValue(sheetRowNumber, pageColIndex + 1, mergedRanges, data) || "").trim() : "";
          const widthVal = widthColIndex !== -1 ? String(getMergedCellValue(sheetRowNumber, widthColIndex + 1, mergedRanges, data) || "").trim() : "";
          const heightVal = heightColIndex !== -1 ? String(getMergedCellValue(sheetRowNumber, heightColIndex + 1, mergedRanges, data) || "").trim() : "";
          const taxVal = taxColIndex !== -1 ? String(row[taxColIndex] || "").trim() : "";
          
          const outputRow = [
            "Row " + sheetRowNumber,
            "Common", // Site column (Col F)
            capacity,
            systemType,
            currentBrand,
            seriesName,
            currentMechStage,
            currentAppStyle,
            seer2Val,
            eer2Val,
            hspf2Val,
            ahriVal,
            btuVal, // Cooling BTU
            heatBtuVal, // Heating BTU
            pageVal,
            widthVal,
            heightVal,
            Number(cleanPriceStr),
            taxVal
          ];
          
          outputRows.push(outputRow);
        }
      }
      
      const destLastRow = destSheet.getLastRow();
      if (destLastRow >= 11) {
        destSheet.getRange(11, 5, destLastRow - 11 + 1, 22).clearContent();
      }
      destSheet.getRange(11, 5, 1, headersOutput.length).setValues([headersOutput]);
      if (outputRows.length > 0) {
        destSheet.getRange(12, 5, outputRows.length, 19).setValues(outputRows);
      }
      console.log("Zone 2: Completed HP extraction. Valid rows pasted: " + outputRows.length);
    }
  }

  // ==========================================
  // ZONE 3: GAS FURNACE ENGINE
  // ==========================================
  function extractGasFurnaces() {
    const sourceSpreadsheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
    const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const ZONE3_TAB_NAMES = ["Gas Furnace 3-3.5", "Gas Furnace 4-5"];
    const ZONE3_DESTINATION_TAB_NAME = "Master_Furnace";
    
    console.log("Zone 3: Starting Gas Furnace extraction...");
    const destSheet = activeSpreadsheet.getSheetByName(ZONE3_DESTINATION_TAB_NAME);
    if (!destSheet) {
      console.log("Zone 3 Warning: Destination sheet '" + ZONE3_DESTINATION_TAB_NAME + "' not found. Skipping Zone 3.");
    } else {
      const outputRows = [];
      
      for (const tabName of ZONE3_TAB_NAMES) {
        console.log("Zone 3: Processing tab: " + tabName);
        const sourceSheet = sourceSpreadsheet.getSheetByName(tabName);
        if (!sourceSheet) {
          console.log("Zone 3: Source sheet '" + tabName + "' not found. Skipping.");
          continue;
        }
        
        const lastRow = sourceSheet.getLastRow();
        const lastCol = sourceSheet.getLastColumn();
        if (lastRow < 7) {
          console.log("Zone 3: Source sheet '" + tabName + "' does not contain enough rows. Skipping.");
          continue;
        }
        
        const data = sourceSheet.getRange(1, 1, lastRow, lastCol).getValues();
        const colors = sourceSheet.getRange(1, 1, lastRow, lastCol).getBackgrounds();
        const mergedRanges = sourceSheet.getDataRange().getMergedRanges();
        
        const numRows = data.length;
        
        // Dynamic Capacity Locator
        let capacity = "";
        for (let r = 0; r < Math.min(10, data.length); r++) {
          const val = String(data[r][0] || "").trim();
          if (val.toUpperCase().includes("TON")) {
            capacity = val;
            break;
          }
        }
        
        let systemType = String(data[1][0] || "").trim();
        if (systemType === "") systemType = "STRAIGHT COOL";
        
        // Dynamic Y-Axis Header Locator
        let headerRowIndex = 6; // Default fallback to index 6 (row 7)
        for (let r = 0; r < Math.min(10, data.length); r++) {
          const rowValues = data[r].map(cell => String(cell || "").toUpperCase().trim());
          if (rowValues.includes("INVESTMENT PRICE") || rowValues.includes("PRICE")) {
            headerRowIndex = r;
            console.log("Zone 3: Dynamically located header row at index: " + headerRowIndex);
            break;
          }
        }
        
        const headers = data[headerRowIndex].map(h => String(h || "").trim());
        
        const seer2ColIndex = findHeaderIndex(["SEER2"], headers);
        const eer2ColIndex = findHeaderIndex(["EER2"], headers);
        const ahriColIndex = findHeaderIndex(["AHRI NUMBER", "AHRI NO", "AHRI"], headers);
        const btuColIndex = findHeaderIndex(["COOLING BTU", "BTU", "BTU's"], headers);
        const heatBtuColIndex = findHeaderIndex(["HEATING BTU", "HEAT BTU"], headers);
        const pageColIndex = findHeaderIndex(["PAGE", "PG", "PG."], headers);
        const widthColIndex = findHeaderIndex(["W", "Width", "FURNACE W", "FURNAC E W"], headers);
        const heightColIndex = findHeaderIndex(["H", "Height", "FURNACE H W/COIL", "FURNAC E H W/COIL"], headers);
        const priceColIndex = findHeaderIndex(["INVESTMENT PRICE", "PRICE"], headers);
        const taxColIndex = findHeaderIndex(["TAX CREDITABLE", "TAX CREDIT"], headers);
        
        if (priceColIndex === -1) {
          console.log("Zone 3: Required price header not found in '" + tabName + "'. Skipping.");
          continue;
        }
        
        let currentBrand = "";
        let currentMechStage = "SINGLE STAGE";
        let currentAppStyle = "STANDARD";
        
        const initialHeaderColA = String(data[headerRowIndex][0] || "").toString().toUpperCase().trim();
        if (initialHeaderColA === "CARRIER" || initialHeaderColA === "COMFORTMAKER" || initialHeaderColA === "RUUD") {
          currentBrand = initialHeaderColA;
        }
        
        const startRowIndex = headerRowIndex + 1;
        for (let i = startRowIndex; i < numRows; i++) {
          const row = data[i];
          const sheetRowNumber = i + 1;
          
          const colAValue = row[0];
          const colAStr = (colAValue || "").toString().toUpperCase().trim();
          const brandClean = colAStr.replace(/\s+/g, "");
          
          if (colAStr === "CARRIER" || colAStr === "COMFORTMAKER" || colAStr === "RUUD" || brandClean === "DURASTAR") {
            currentBrand = brandClean === "DURASTAR" ? "DURASTAR" : colAStr;
            currentMechStage = "SINGLE STAGE";
            currentAppStyle = "STANDARD";
          } else if (colAStr !== "") {
            // [!] FORCE FALLBACK RESET ON EVERY NEW SUB-HEADER
            currentMechStage = "SINGLE STAGE";
            currentAppStyle = "STANDARD";
            
            const rawText = colAStr.toUpperCase();
            if (rawText.includes("2 STAGE")) currentMechStage = "2 STAGE";
            else if (rawText.includes("VAR")) currentMechStage = "VARIABLE SPEED";
            
            if (rawText.includes("APARTMENT COASTAL")) currentAppStyle = "APARTMENT COASTAL";
            else if (rawText.includes("APARTMENT")) currentAppStyle = "APARTMENT";
            else if (rawText.includes("COASTAL")) currentAppStyle = "COASTAL";
            else if (rawText.includes("CROSSOVER")) currentAppStyle = "CROSSOVER";
          }
          
          const colBValue = row[1];
          const colBStr = String(colBValue || "").trim();
          if (colAStr.includes("INCLUDES") || colBStr.toUpperCase().includes("INCLUDES")) {
            break;
          }
          
          if (sourceSheet.isRowHiddenByFilter(sheetRowNumber) || sourceSheet.isRowHiddenByUser(sheetRowNumber)) {
            continue;
          }
          
          const priceValue = priceColIndex !== -1 ? row[priceColIndex] : "";
          const priceStr = String(priceValue === null || priceValue === undefined ? "" : priceValue);
          const cleanPriceStr = priceStr.replace(/[\$, ]/g, "");
          if (cleanPriceStr === "" || isNaN(Number(cleanPriceStr))) {
            continue;
          }
          
          const seriesColor = seer2ColIndex !== -1 ? colors[i][seer2ColIndex] : "#ffffff";
          let seriesName = "";
          const colorHex = seriesColor.toLowerCase();
          const hue = hexToHue(colorHex);
          
          if (currentBrand === "DURASTAR" || currentBrand === "RUUD") {
            seriesName = "STANDARD";
          } else {
            if (hue >= 180 && hue <= 270) {
              if (currentBrand === "CARRIER") seriesName = "INFINITY";
              else if (currentBrand === "COMFORTMAKER") seriesName = "MAIN LINE";
              else seriesName = "⚠️ UNRECOGNIZED COLOR";
            } else if (hue >= 70 && hue <= 160) {
              if (currentBrand === "CARRIER") seriesName = "PERFORMANCE";
              else if (currentBrand === "COMFORTMAKER") seriesName = "PERFORMER";
              else seriesName = "⚠️ UNRECOGNIZED COLOR";
            } else if (hue >= 35 && hue <= 65) {
              if (currentBrand === "CARRIER") seriesName = "COMFORT";
              else if (currentBrand === "COMFORTMAKER") seriesName = "BUILDER";
              else seriesName = "⚠️ UNRECOGNIZED COLOR";
            } else {
              seriesName = "⚠️ UNRECOGNIZED COLOR";
            }
          }
          
          const rawSeer2 = seer2ColIndex !== -1 ? row[seer2ColIndex] : "";
          const seer2Val = String(rawSeer2 === null || rawSeer2 === undefined ? "" : rawSeer2).replace(/\*/g, "").trim();
          const eer2Val = eer2ColIndex !== -1 ? row[eer2ColIndex] : "";
          const ahriVal = ahriColIndex !== -1 ? row[ahriColIndex] : "";
          const btuVal = btuColIndex !== -1 ? row[btuColIndex] : "";
          const heatBtuVal = heatBtuColIndex !== -1 ? row[heatBtuColIndex] : "";
          const pageVal = pageColIndex !== -1 ? String(getMergedCellValue(sheetRowNumber, pageColIndex + 1, mergedRanges, data) || "").trim() : "";
          const widthVal = widthColIndex !== -1 ? String(getMergedCellValue(sheetRowNumber, widthColIndex + 1, mergedRanges, data) || "").trim() : "";
          const heightVal = heightColIndex !== -1 ? String(getMergedCellValue(sheetRowNumber, heightColIndex + 1, mergedRanges, data) || "").trim() : "";
          const taxVal = taxColIndex !== -1 ? String(row[taxColIndex] || "").trim() : "";
          
          const outputRow = [
            "Row " + sheetRowNumber,
            "Common", // Site column (Col F)
            capacity,
            systemType,
            currentBrand,
            seriesName,
            currentMechStage,
            currentAppStyle,
            seer2Val,
            eer2Val,
            "", // HSPF2 (blank for Furnace)
            ahriVal,
            btuVal, // Cooling BTU
            heatBtuVal, // Heating BTU
            pageVal,
            widthVal,
            heightVal,
            Number(cleanPriceStr),
            taxVal
          ];
          
          outputRows.push(outputRow);
        }
      }
      
      const destLastRow = destSheet.getLastRow();
      if (destLastRow >= 11) {
        destSheet.getRange(11, 5, destLastRow - 11 + 1, 22).clearContent();
      }
      destSheet.getRange(11, 5, 1, headersOutput.length).setValues([headersOutput]);
      if (outputRows.length > 0) {
        destSheet.getRange(12, 5, outputRows.length, 19).setValues(outputRows);
      }
      console.log("Zone 3: Completed Gas Furnace extraction. Valid rows pasted: " + outputRows.length);
    }
  }



  // ==========================================
  // ZONE 5: MASTER ENHANCEMENTS DICTIONARY
  // ==========================================
  function extractEnhancements() {
    const sourceSpreadsheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
    const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    console.log("Zone 5: Starting Master Enhancements Dictionary extraction...");
    const enhSheet = sourceSpreadsheet.getSheetByName("Enhancements");
    const oceanaSheet = sourceSpreadsheet.getSheetByName("Oceana Pricing");
  const destSheetEnh = activeSpreadsheet.getSheetByName("Master_Enhancements") || activeSpreadsheet.insertSheet("Master_Enhancements");
  
  const enhancementsRows = [];
  
  // 1. Extract from Enhancements tab
  if (enhSheet) {
    const enhLastRow = enhSheet.getLastRow();
    const enhData = enhSheet.getRange(1, 1, Math.max(enhLastRow, 40), 13).getValues();
    
    // a. "DURING AN INSTALL" (Rows 4 to 15, index 3 to 14)
    for (let r = 3; r <= 14; r++) {
      const name = String(enhData[r][0] || "").trim();
      const price = cleanNumber(enhData[r][3] || enhData[r][2] || enhData[r][1]);
      if (name && price > 0) {
        enhancementsRows.push(["During Install", name, price]);
      }
    }
    
    // b. "Deductions" (Rows 18 to 20, index 17 to 19)
    for (let r = 17; r <= 19; r++) {
      const name = String(enhData[r][7] || "").trim(); // Col H is index 7
      const price = cleanNumber(enhData[r][9] || enhData[r][8]); // Col J is index 9
      if (name && price !== 0) {
        enhancementsRows.push(["Deductions", name, price]);
      }
    }
  } else {
    console.log("Zone 5 Warning: Source sheet 'Enhancements' not found.");
  }
  
  // 2. Extract from Oceana Pricing tab
  if (oceanaSheet) {
    const oceanaData = oceanaSheet.getRange(1, 1, 40, 8).getValues();
    
    // a. Crane services (Row 16, index 15)
    const craneRaw = String(oceanaData[15][0] || "");
    const craneStr = craneRaw.includes('$') ? craneRaw.split('$').pop() : craneRaw;
    const cranePrice = cleanNumber(craneStr);
    if (cranePrice > 0) {
      enhancementsRows.push(["Oceana", "Crane services", cranePrice]);
    }
    
    // b. R454b travel premiums (Row 18, 20, 22; index 17, 19, 21)
    const r454bRows = [
      { rowIdx: 17, label: "R454b Floors 2-4" },
      { rowIdx: 19, label: "R454b Floors 5-7" },
      { rowIdx: 21, label: "R454b Floors 8-10" }
    ];
    for (let rInfo of r454bRows) {
      const cellRaw = String(oceanaData[rInfo.rowIdx][0] || "");
      const cellStr = cellRaw.includes('$') ? cellRaw.split('$').pop() : cellRaw;
      const price = cleanNumber(cellStr);
      if (price > 0) {
        enhancementsRows.push(["Oceana", rInfo.label, price]);
      }
    }
    
    // c. Heresite matrix (starts at Row 24)
    const heresiteRows = parseSaltShieldMatrix(oceanaSheet, 24, "Salt Shield Heresite");
    enhancementsRows.push(...heresiteRows);
    
    // d. Infiniguard matrix (starts at Row 33)
    const infiniguardRows = parseSaltShieldMatrix(oceanaSheet, 33, "Salt Shield Infiniguard");
    enhancementsRows.push(...infiniguardRows);
  }
  
  // 3. Write to Master_Enhancements destination sheet
  destSheetEnh.clear(); // Clear everything
  destSheetEnh.getRange(1, 1, 1, 3).setValues([["Category", "Enhancement Name", "Price / Rule"]]);
  if (enhancementsRows.length > 0) {
    destSheetEnh.getRange(2, 1, enhancementsRows.length, 3).setValues(enhancementsRows);
  }
  console.log("Zone 5: Completed Enhancements extraction. Valid rows pasted: " + enhancementsRows.length);
}

/**
 * Highly optimized unified event router.
 * Handles the "Add to Cart" system for the Proposal Builder 
 * AND the Master Checkbox triggers for the Audit Approval dashboard.
 */

// ==========================================
// ZONE 5.1: PACKAGE UNIT EXTRACTION
// ==========================================

function extractPackageUnits() {
  const sourceSpreadsheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const TAB_NAME = "Mobil Home";
  const DESTINATION_TAB_NAME = "Master_Package";
  
  console.log("Zone Package: Starting extraction...");
  const destSheet = activeSpreadsheet.getSheetByName(DESTINATION_TAB_NAME);
  const sourceSheet = sourceSpreadsheet.getSheetByName(TAB_NAME);
  
  if (!destSheet) {
    console.log("Zone Package Warning: Destination sheet '" + DESTINATION_TAB_NAME + "' not found. Skipping.");
    return;
  }
  if (!sourceSheet) {
    console.log("Zone Package Error: Source sheet '" + TAB_NAME + "' not found. Skipping.");
    return;
  }
  
  const lastRow = sourceSheet.getLastRow();
  const lastCol = sourceSheet.getLastColumn();
  if (lastRow < 7) {
    console.log("Zone Package: Source sheet does not contain enough rows. Skipping.");
    return;
  }
  
  const data = sourceSheet.getRange(1, 1, lastRow, lastCol).getValues();
  const outputRows = [];
  
  let currentBrand = "";
  let currentCapacity = "";
  let headerRowIndex = -1;
  let headers = [];
  
  let seer2ColIndex = -1, eer2ColIndex = -1, ahriColIndex = -1, coolingBtuColIndex = -1;
  let heatingBtuColIndex = -1, priceColIndex = -1, pageColIndex = -1, widthColIndex = -1;
  let heightColIndex = -1, taxColIndex = -1, hspf2ColIndex = -1;
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const sheetRowNumber = i + 1;
    const colAStr = String(row[0] || "").toUpperCase().trim();
    const colBStr = String(row[1] || "").toUpperCase().trim();
    
    // Brand detection
    if (colAStr === "CARRIER" || colAStr === "COMFORTMAKER" || colAStr === "RUUD" || colAStr.replace(/\s+/g, "") === "COMFORTMAKER") {
      currentBrand = colAStr === "CARRIER" ? "CARRIER" : ((colAStr === "RUUD") ? "RUUD" : "COMFORTMAKER");
    }
    
    // Capacity detection
    if (colAStr.includes("-TON") || colAStr.includes(" TON") || colAStr.includes("TON")) {
      currentCapacity = typeof extractCapacity === 'function' ? extractCapacity(colAStr) : colAStr.replace("-", " ");
    }
    
    // Header detection
    const rowValues = row.map(cell => String(cell || "").toUpperCase().trim());
    if (rowValues.includes("INVESTMENT PRICE") || rowValues.includes("PRICE") || rowValues.includes("SEER2")) {
      headerRowIndex = i;
      headers = row.map(h => String(h || "").toUpperCase().trim());
      
      seer2ColIndex = findHeaderIndex(["SEER2"], headers);
      eer2ColIndex = findHeaderIndex(["EER2"], headers);
      ahriColIndex = findHeaderIndex(["AHRI NUMBER", "AHRI NO", "AHRI"], headers);
      coolingBtuColIndex = findHeaderIndex(["COOLING BTU", "BTU", "BTU'S", "COOLING"], headers);
      heatingBtuColIndex = findHeaderIndex(["HEATING BTU", "HEAT BTU", "HEATING"], headers);
      pageColIndex = findHeaderIndex(["PAGE", "PG", "PG."], headers);
      widthColIndex = findHeaderIndex(["W", "WIDTH"], headers);
      heightColIndex = findHeaderIndex(["H", "HEIGHT"], headers);
      priceColIndex = findHeaderIndex(["INVESTMENT PRICE", "PRICE"], headers);
      taxColIndex = findHeaderIndex(["TAX CREDITABLE", "TAX CREDIT", "ENERGY STAR 6.1"], headers);
      hspf2ColIndex = findHeaderIndex(["HSPF2"], headers);
      
      if (colBStr !== "SC" && colBStr !== "HP") {
          continue;
      }
    }
    
    // Require headers defined
    if (headerRowIndex === -1) continue;
    
    // Row filtering: Must be SC or HP
    if (colBStr !== "SC" && colBStr !== "HP") {
      continue;
    }
    
    // Filter visually hidden rows
    if (sourceSheet.isRowHiddenByFilter(sheetRowNumber) || sourceSheet.isRowHiddenByUser(sheetRowNumber)) {
      continue;
    }
    
    const priceValue = priceColIndex !== -1 ? row[priceColIndex] : "";
    const cleanPriceStr = String(priceValue).replace(/[\$, ]/g, "");
    if (cleanPriceStr === "" || isNaN(Number(cleanPriceStr))) {
      continue;
    }
    
    const systemType = colBStr === "SC" ? "STRAIGHT COOL" : "HEAT PUMP";
    const rawAhri = ahriColIndex !== -1 ? String(row[ahriColIndex]) : "";
    
    const outputRow = [
      "Row " + sheetRowNumber,
      "Common", // Site
      currentCapacity,
      systemType,
      currentBrand,
      "", // Series / Tier
      "SINGLE STAGE", // Mechanical Stage
      "PACKAGE", // Application / Style
      seer2ColIndex !== -1 ? String(row[seer2ColIndex]) : "",
      eer2ColIndex !== -1 ? String(row[eer2ColIndex]) : "",
      hspf2ColIndex !== -1 ? String(row[hspf2ColIndex]) : "",
      typeof extractAhri === 'function' ? extractAhri(rawAhri) : rawAhri,
      coolingBtuColIndex !== -1 ? String(row[coolingBtuColIndex]) : "",
      heatingBtuColIndex !== -1 ? String(row[heatingBtuColIndex]) : "",
      pageColIndex !== -1 ? String(row[pageColIndex]) : "",
      "", // Width (blank)
      "", // Height (blank)
      Number(cleanPriceStr),
      taxColIndex !== -1 ? String(row[taxColIndex]) : ""
    ];
    
    outputRows.push(outputRow);
  }
  
  const headersOutput = [
    "Source Row", "Site", "Capacity", "System Type", "Brand",
    "Series / Tier", "Mechanical Stage", "Application / Style", "SEER2",
    "EER2", "HSPF2", "AHRI", "Cooling BTU", "Heating BTU",
    "PAGE", "Width", "Height", "Price", "Tax Creditable"
  ];
  
  const destLastRow = destSheet.getLastRow();
  if (destLastRow >= 11) {
    destSheet.getRange(11, 5, destLastRow - 11 + 1, 22).clearContent();
  }
  destSheet.getRange(11, 5, 1, headersOutput.length).setValues([headersOutput]);
  if (outputRows.length > 0) {
    destSheet.getRange(12, 5, outputRows.length, 19).setValues(outputRows);
  }
  console.log("Zone Package: Completed extraction. Valid rows pasted: " + outputRows.length);
}


function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();
  const range = e.range;
  const col = range.getColumn();
  const row = range.getRow();

  // ==========================================
  // ROUTE 1: AUDIT APPROVAL DASHBOARD (v16.20)
  // ==========================================
  if (sheetName === "Audit_Approval") {
    if (col !== 3) return; // Only listen to Column C (Approve column)
    
    // ACTION A: Run Approval (C2)
    if (row === 2 && range.getValue() === true) {
      range.uncheck(); // Instantly uncheck to reset the trigger
      processApprovals();
      return;
    }
    
    // ACTION B: Select All (C4)
    if (row === 4) {
      const isChecked = range.getValue() === true;
      const lastRow = sheet.getLastRow();
      if (lastRow >= 12) {
        const targetRange = sheet.getRange(12, 3, lastRow - 11, 1);
        if (isChecked) {
          targetRange.check();
        } else {
          targetRange.uncheck();
        }
      }
      return;
    }
    return; // Exit if Audit_Approval but not C2 or C4
  }

  // ==========================================
  // ROUTE 2: PROPOSAL BUILDER CART
  // ==========================================
  if (sheetName === "Proposal Builder") {
    // Only trigger if a Checkbox in Column D (Col 4) is clicked to TRUE
    if (col !== 4 || range.getValue() !== true) return;

    // ACTION 1: ADD TO CART (Checkboxes in D12 and below)
    if (row >= 12) {
      const toggles = sheet.getRange("F9:V9").getValues()[0];
      const rowData = sheet.getRange(row, 6, 1, 17).getValues()[0];

      const dict = {
        "STRAIGHT COOL": "AC", "HEAT PUMP": "HP", "GAS FURNACE": "FURN",
        "SINGLE STAGE": "1-STG", "2 STAGE": "2-STG", "VARIABLE SPEED": "VAR",
        "APARTMENT COASTAL": "APT COAST", "CROSSOVER": "CROSS", "STANDARD": "",
        "PERFORMANCE": "PERF", "PERFORMER": "PERF", "MAIN LINE": "MAIN",
        "COMFORTMAKER": "C-Maker", "COMFORT": "COMF"
      };

      const applyDict = (val) => {
        let str = String(val).trim();
        let upper = str.toUpperCase();
        return dict[upper] !== undefined ? dict[upper] : str;
      };

      let snippetParts = [];

      let brandStr = toggles[2] === true && rowData[2] !== "" ? applyDict(rowData[2]) : "";
      let seriesStr = toggles[3] === true && rowData[3] !== "" ? applyDict(rowData[3]) : "";
      let combinedBrand = (brandStr + " " + seriesStr).trim();
      if (combinedBrand !== "") snippetParts.push(combinedBrand);

      if (toggles[6] === true && rowData[6] !== "") snippetParts.push(rowData[6] + " SEER2");
      if (toggles[1] === true && rowData[1] !== "") snippetParts.push(applyDict(rowData[1]));
      if (toggles[4] === true && rowData[4] !== "") snippetParts.push(applyDict(rowData[4]));
      if (toggles[0] === true && rowData[0] !== "") snippetParts.push(applyDict(rowData[0]));
      if (toggles[5] === true && rowData[5] !== "") {
        let style = applyDict(rowData[5]);
        if (style !== "") snippetParts.push(style);
      }

      for (let i = 7; i < toggles.length; i++) {
        if (toggles[i] === true && rowData[i] !== "") {
          let val = rowData[i];
          if (typeof val === "number" && val > 100) val = "$" + val.toLocaleString();
          snippetParts.push(val);
        }
      }

      let snippet = snippetParts.join(" | ");
      if (snippet === "") snippet = "System Selected (No snippet toggles checked in Row 9)";

      const cartRange = sheet.getRange("B2:B10").getValues();
      let emptyRow = -1;
      for (let i = 0; i < cartRange.length; i++) {
        if (cartRange[i][0] === "") {
          emptyRow = i + 2; 
          break;
        }
      }

      if (emptyRow !== -1) {
        sheet.getRange(emptyRow, 2).setValue(snippet);
        const fullData = sheet.getRange(row, 5, 1, 19).getValues();
        sheet.getRange(emptyRow, 26, 1, 19).setValues(fullData);
      } else {
        SpreadsheetApp.getUi().alert("Cart is full! Please remove an item first.");
      }
      range.uncheck();
    }

    // ACTION 2: REMOVE FROM CART (Checkboxes in D2:D10)
    if (row >= 2 && row <= 10) {
      sheet.getRange(row, 1).clearContent(); 
      sheet.getRange(row, 2).clearContent(); 
      sheet.getRange(row, 26, 1, 19).clearContent(); 
      range.uncheck(); 
    }
  }
}

/**
 * Temporary function to inspect the row/column structure of 'Oceana Pricing' and 'Enhancements' tabs.
 * Writes the results to a file named 'sheets_structure.txt' in the Google Drive folder of the active spreadsheet.
 */
function debugDiscovery() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const SOURCE_SPREADSHEET_ID = "15gWSfuY0A-uoLSw3XxCWA39CuZSzidnRqkolOk5UCSA";
  let sourceSpreadsheet;
  try {
    sourceSpreadsheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
  } catch (e) {
    throw new Error("Unable to open source spreadsheet by ID. Error: " + e.message);
  }
  
  let output = "";
  
  // 1. Inspect Oceana Pricing tab
  const oceanaSheet = sourceSpreadsheet.getSheetByName("Oceana Pricing");
  if (oceanaSheet) {
    output += "=== OCEANA PRICING TAB ===\n";
    const lastRow = Math.min(oceanaSheet.getLastRow(), 100);
    const lastCol = Math.min(oceanaSheet.getLastColumn(), 20);
    const values = oceanaSheet.getRange(1, 1, lastRow, lastCol).getValues();
    const backgrounds = oceanaSheet.getRange(1, 1, lastRow, lastCol).getBackgrounds();
    for (let r = 0; r < values.length; r++) {
      let rowCells = [];
      for (let c = 0; c < values[r].length; c++) {
        let val = values[r][c];
        let bg = backgrounds[r][c];
        rowCells.push(`[Col ${c+1}: ${val} (${bg})]`);
      }
      output += `Row ${r+1}: ${rowCells.join(" | ")}\n`;
    }
  } else {
    output += "Oceana Pricing tab not found!\n";
  }
  
  output += "\n\n";
  
  // 2. Inspect Enhancements tab
  const enhSheet = sourceSpreadsheet.getSheetByName("Enhancements");
  if (enhSheet) {
    output += "=== ENHANCEMENTS TAB ===\n";
    const lastRow = Math.min(enhSheet.getLastRow(), 150);
    const lastCol = Math.min(enhSheet.getLastColumn(), 20);
    const values = enhSheet.getRange(1, 1, lastRow, lastCol).getValues();
    for (let r = 0; r < values.length; r++) {
      let rowCells = [];
      for (let c = 0; c < values[r].length; c++) {
        rowCells.push(`[Col ${c+1}: ${values[r][c]}]`);
      }
      output += `Row ${r+1}: ${rowCells.join(" | ")}\n`;
    }
  } else {
    output += "Enhancements tab not found!\n";
  }
  
  // Write to Drive folder of the active spreadsheet
  const activeFile = DriveApp.getFileById(activeSpreadsheet.getId());
  const parents = activeFile.getParents();
  const parentFolder = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  // Delete existing file if any
  const existingFiles = parentFolder.getFilesByName("sheets_structure.txt");
  while (existingFiles.hasNext()) {
    existingFiles.next().setTrashed(true);
  }
  parentFolder.createFile("sheets_structure.txt", output);
  console.log("Discovery complete! File sheets_structure.txt created in spreadsheet folder.");
}

// ==========================================
// ZONE 6: DIFF CHECKER & ROW AUDITOR (v16.30)
// ==========================================
function checkPriceDifferences(skipEmail = false) {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = activeSpreadsheet.getSheetByName("Unified Master");
  const approvalSheet = activeSpreadsheet.getSheetByName("Audit_Approval");
  const ALERT_EMAIL = "dan.platts.ac@gmail.com";
  
  let alertMessages = [];
  let auditEvents = [];
  let newCount = 0;
  let updateCount = 0;
  let missingCount = 0;
  
  let newSystemsRaw = [];
  let missingSystemsRaw = [];
  let standardUpdates = [];
  
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

  console.log("Zone 6: Starting Unified Mega-Auditor with Collision Detection...");

  function rowToAuditSystem(row) {
    return {
        sourceRow: String(row[0] || "").trim(),
        site: String(row[1] || "").trim(),
        capacity: String(row[2] || "").trim(),
        systemType: String(row[3] || "").trim(),
        brand: String(row[4] || "").trim(),
        seriesTier: String(row[5] || "").trim(),
        mechanicalStage: String(row[6] || "").trim(),
        applicationStyle: String(row[7] || "").trim(),
        seer2: String(row[8] || "").trim(),
        eer2: String(row[9] || "").trim(),
        hspf2: String(row[10] || "").trim(),
        ahri: String(row[11] || "").trim(),
        coolingBtu: String(row[12] || "").trim(),
        heatingBtu: String(row[13] || "").trim(),
        page: String(row[14] || "").trim(),
        width: String(row[15] || "").trim(),
        height: String(row[16] || "").trim(),
        price: Number(row[17]) || 0,
        taxCreditable: String(row[18] || "").trim()
    };
  }

  function buildAuditIdentity(row) {
    const system = rowToAuditSystem(row);
    const parts = [];

    if (system.brand) {
        parts.push(system.brand);
    }

    if (system.ahri) {
        parts.push(`AHRI: ${system.ahri}`);
    }

    if (system.capacity) {
        parts.push(system.capacity);
    }

    if (system.mechanicalStage) {
        parts.push(system.mechanicalStage);
    }

    if (system.systemType) {
        parts.push(system.systemType);
    }

    if (system.applicationStyle) {
        parts.push(system.applicationStyle);
    }

    if (Number(system.price) > 0) {
        parts.push(
            "$" + Number(system.price).toLocaleString("en-US")
        );
    }

    if (
        system.site &&
        system.site.toUpperCase() !== "COMMON"
    ) {
        parts.push(system.site.toUpperCase());
    }

    return parts.join(" · ");
  }

  function compareEquipment(dynamicTabName, staticTabName) {
    const dynSheet = activeSpreadsheet.getSheetByName(dynamicTabName);
    const statSheet = activeSpreadsheet.getSheetByName(staticTabName);
    if (!dynSheet || !statSheet) return;

    const dynLastRow = dynSheet.getLastRow();
    const statLastRow = statSheet.getLastRow();

    if (dynLastRow < 12 || statLastRow < 12) return;

    const dynData = dynSheet.getRange(12, 5, dynLastRow - 11, 20).getValues();
    const statData = statSheet.getRange(12, 5, statLastRow - 11, 19).getValues();

    const staticMap = {};
    for (let r = 0; r < statData.length; r++) {
      const row = statData[r];
      if (String(row[4]||"").trim() === "") continue; // Skip blank brands
      
      const site = String(row[1] || "").trim();
      const capacity = String(row[2] || "").trim();
      const sysType = String(row[3] || "").trim();
      const brand = String(row[4] || "").trim();
      const series = String(row[5] || "").trim();
      const stage = String(row[6] || "").trim();
      const style = String(row[7] || "").trim();
      const seer2 = String(row[8] || "").trim();
      const btu = String(row[12] || "").trim();
      const ahri = String(row[11] || "").trim();
      const price = Number(row[17]) || 0;

      const fingerprint = `${site}_${capacity}_${sysType}_${brand}_${series}_${stage}_${style}_${seer2}_${btu}`.toUpperCase();
      staticMap[fingerprint] = { rowData: row, ahri: ahri, price: price, site: site, style: style };
    }

    const masterMap = {};
    for (let row of dynData) {
      const brand = String(row[4] || "").trim();
      if (brand === "") continue;
      
      const site = String(row[1] || "").trim();
      const capacity = String(row[2] || "").trim();
      const sysType = String(row[3] || "").trim();
      const series = String(row[5] || "").trim();
      const stage = String(row[6] || "").trim();
      const style = String(row[7] || "").trim();
      const seer2 = String(row[8] || "").trim();
      const btu = String(row[12] || "").trim();
      const ahri = String(row[11] || "").trim();
      
      const fingerprint = `${site}_${capacity}_${sysType}_${brand}_${series}_${stage}_${style}_${seer2}_${btu}`.toUpperCase();
      masterMap[fingerprint] = row;

      if (!staticMap[fingerprint]) {
        newSystemsRaw.push({ rowData: row, ahri: ahri, site: site, style: style, tab: dynamicTabName });
      }
    }

    for (let fingerprint in staticMap) {
      const statItem = staticMap[fingerprint];
      if (masterMap[fingerprint]) {
        const newRow = masterMap[fingerprint];
        const newPrice = Number(newRow[17]) || 0;
        const newAhri = String(newRow[11] || "").trim();
        const changes = [];

        const structuredChanges = [];

        if (statItem.price !== newPrice && statItem.price > 0 && newPrice > 0) {
          changes.push(`Price: ${statItem.price} ➔ ${newPrice}`);
          structuredChanges.push({ field: "price", label: "Price", oldValue: statItem.price, newValue: newPrice });
        }
        if (statItem.ahri !== newAhri && statItem.ahri !== "" && newAhri !== "") {
          changes.push(`AHRI: ${statItem.ahri} ➔ ${newAhri}`);
          structuredChanges.push({ field: "ahri", label: "AHRI", oldValue: statItem.ahri, newValue: newAhri });
        }

        if (changes.length > 0) {
          const flagText = changes.join(" | ");
          const identity = buildAuditIdentity(newRow);
          const msg = `🚨 UPDATE | ${dynamicTabName} | ${identity}\n   ↳ ${flagText}`;
          alertMessages.push(msg);
          auditEvents.push({
            type: "UPDATE",
            tab: dynamicTabName,
            system: rowToAuditSystem(newRow),
            changes: structuredChanges,
            message: msg
          });
          standardUpdates.push([false, timestamp, newRow[0], newRow[1], newRow[2], newRow[3], newRow[4], newRow[5], newRow[6], newRow[7], newRow[8], newRow[9], newRow[10], newRow[11], newRow[12], newRow[13], newRow[14], newRow[15], newRow[16], newRow[17], newRow[18], flagText]);
          updateCount++;
        }
      } else {
        missingSystemsRaw.push({ rowData: statItem.rowData, ahri: statItem.ahri, site: statItem.site, style: statItem.style, tab: dynamicTabName });
      }
    }
  }

  function compareEnhancements() {
    const dynSheet = activeSpreadsheet.getSheetByName("Master_Enhancements");
    const statSheet = activeSpreadsheet.getSheetByName("Static_Enhancements");
    if (!dynSheet || !statSheet) return;

    const dynData = dynSheet.getDataRange().getValues();
    const statData = statSheet.getDataRange().getValues();

    const staticMap = {};
    for (let i = 1; i < statData.length; i++) {
      const category = String(statData[i][0] || "").trim();
      const name = String(statData[i][1] || "").trim(); 
      const price = Number(statData[i][2]) || 0; 
      const key = `${category}||${name}`;

      if (category && name) {
        staticMap[key] = price;
      }
    }

    for (let i = 1; i < dynData.length; i++) {
      const category = String(dynData[i][0] || "").trim();
      const name = String(dynData[i][1] || "").trim();
      const newPrice = Number(dynData[i][2]) || 0;
      const key = `${category}||${name}`;
      
      if (category && name && staticMap[key] !== undefined) {
        const oldPrice = staticMap[key];
        if (newPrice !== oldPrice) {
          const msg = `🚨 ENHANCEMENT | '${name}' changed from $${oldPrice} to $${newPrice}.`;
          alertMessages.push(msg);
          auditEvents.push({
            type: "ENHANCEMENT",
            tab: "Master_Enhancements",
            enhancement: { category: category, name: name },
            changes: [{ field: "price", label: "Price", oldValue: oldPrice, newValue: newPrice }],
            message: msg
          });
          updateCount++;
        }
      }
    }
  }

  compareEquipment("Master_AC", "Static_AC");
  compareEquipment("Master_HP", "Static_HP");
  compareEquipment("Master_Furnace", "Static_Furnace");
    compareEquipment("Master_Package", "Static_Package");
  compareEnhancements();

  // ==========================================
  // THE COLLISION DETECTOR (Fuzzy Matching)
  // ==========================================
  let finalDiscrepancies = [...standardUpdates];
  let webAppPayloadSystems = [];
  
  let matchedNewIndexes = new Set();
  let matchedMissingIndexes = new Set();

  for (let i = 0; i < newSystemsRaw.length; i++) {
    const newItem = newSystemsRaw[i];
    let foundMatch = false;

    for (let j = 0; j < missingSystemsRaw.length; j++) {
      if (matchedMissingIndexes.has(j)) continue;
      const missItem = missingSystemsRaw[j];

      // Secondary Key: STRICTLY AHRI + Site (Ignoring Style/Stage for broader typo catching)
      if (newItem.ahri && missItem.ahri && newItem.ahri === missItem.ahri && newItem.site === missItem.site) {
        
        foundMatch = true;
        matchedNewIndexes.add(i);
        matchedMissingIndexes.add(j);
        
        // Generate detailed conflict flag comparing all variables
        const oldPrice = Number(missItem.rowData[17]) || 0;
        const newPrice = Number(newItem.rowData[17]) || 0;
        const oldStage = String(missItem.rowData[6] || "").trim();
        const newStage = String(newItem.rowData[6] || "").trim();
        const oldStyle = String(missItem.rowData[7] || "").trim();
        const newStyle = String(newItem.rowData[7] || "").trim();
        
        let conflictNotes = [];
        let structChanges = [];
        if (oldPrice !== newPrice) {
            conflictNotes.push(`Price: ${oldPrice} ➔ ${newPrice}`);
            structChanges.push({ field: "price", label: "Price", oldValue: oldPrice, newValue: newPrice });
        }
        if (oldStage !== newStage) {
            conflictNotes.push(`Stage: '${oldStage}' ➔ '${newStage}'`);
            structChanges.push({ field: "mechanicalStage", label: "Mechanical Stage", oldValue: oldStage, newValue: newStage });
        }
        if (oldStyle !== newStyle) {
            conflictNotes.push(`Style: '${oldStyle}' ➔ '${newStyle}'`);
            structChanges.push({ field: "applicationStyle", label: "Application Style", oldValue: oldStyle, newValue: newStyle });
        }
        
        const flagText = conflictNotes.length > 0 ? "⚠️ FORMAT CONFLICT: " + conflictNotes.join(" | ") : "⚠️ FORMAT CONFLICT: Unspecified variant";
        
        // Push to approval queue using the NEW row's data to apply the fix
        const r = newItem.rowData;
        const identity = buildAuditIdentity(r);
        const msg = `⚠️ FORMAT CONFLICT | ${newItem.tab} | ${identity}\n  ↳ ${flagText}`;
        alertMessages.push(msg);
        auditEvents.push({
            type: "FORMAT_CONFLICT",
            tab: newItem.tab,
            system: rowToAuditSystem(r),
            changes: structChanges,
            message: msg
        });
        finalDiscrepancies.push([false, timestamp, r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12], r[13], r[14], r[15], r[16], r[17], r[18], flagText]);
        updateCount++;
        break;
      }
    }
  }

  // Process remaining unmatched NEW systems
  for (let i = 0; i < newSystemsRaw.length; i++) {
    if (!matchedNewIndexes.has(i)) {
      newCount++;
      const r = newSystemsRaw[i].rowData;
      const flagText = "NEW SYSTEM CATALOGED IN MASTER";
      finalDiscrepancies.push([false, timestamp, r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12], r[13], r[14], r[15], r[16], r[17], r[18], flagText]);
      
      const identity = buildAuditIdentity(r);
      const msg = `🆕 NEW SYSTEM | ${identity}`;
      alertMessages.push(msg);
      auditEvents.push({
          type: "NEW_SYSTEM",
          tab: newSystemsRaw[i].tab,
          system: rowToAuditSystem(r),
          changes: [],
          message: msg
      });
      
      webAppPayloadSystems.push({
        site: String(r[1]).trim(), capacity: String(r[2]).trim(), systemType: String(r[3]).trim(), 
        brand: String(r[4]).trim(), seriesTier: String(r[5]).trim(), mechanicalStage: String(r[6]).trim(), 
        applicationStyle: String(r[7]).trim(), seer2: String(r[8]).trim(), eer2: String(r[9]).trim(),
        hspf2: String(r[10]).trim(), ahri: String(r[11]).trim(), coolingBtu: String(r[12]).trim(), 
        heatingBtu: String(r[13]).trim(), page: String(r[14]).trim(), width: String(r[15]).trim(), 
        height: String(r[16]).trim(), price: Number(r[17]) || 0, taxCreditable: String(r[18]).trim(), flag: flagText
      });
    }
  }

  // Process remaining unmatched MISSING systems
  for (let j = 0; j < missingSystemsRaw.length; j++) {
    if (!matchedMissingIndexes.has(j)) {
      missingCount++;
      const r = missingSystemsRaw[j].rowData;
      const flagText = "MISSING IN MASTER";
      finalDiscrepancies.push([false, timestamp, "N/A", r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12], r[13], r[14], r[15], r[16], r[17], r[18], flagText]);
      
      const identity = buildAuditIdentity(r);
      const msg = `❌ MISSING SYSTEM | ${identity}`;
      alertMessages.push(msg);
      auditEvents.push({
          type: "MISSING_SYSTEM",
          tab: missingSystemsRaw[j].tab,
          system: rowToAuditSystem(r),
          changes: [],
          message: msg
      });
    }
  }

  // Populate Audit_Approval Tab
  if (approvalSheet) {
    const appLast = approvalSheet.getLastRow();
    if (appLast >= 12) {
      approvalSheet.getRange(12, 3, appLast - 11, 22).clearContent();
      approvalSheet.getRange(12, 3, appLast - 11, 1).removeCheckboxes();
    }
    if (finalDiscrepancies.length > 0) {
      const targetRange = approvalSheet.getRange(12, 3, finalDiscrepancies.length, 22);
      targetRange.setValues(finalDiscrepancies);
      approvalSheet.getRange(12, 3, finalDiscrepancies.length, 1).insertCheckboxes();
    }
  }

  // Write Reverse-Lookup Z1 Payload - NOW INCLUDING ALL ALERTS
  if (masterSheet) {
    const totalAlerts = alertMessages.length;
    if (totalAlerts > 0 || newCount > 0) {
      const payload = JSON.stringify({
        newCount: newCount,
        updateCount: updateCount,
        missingCount: missingCount,
        totalAlerts: totalAlerts,
        systems: webAppPayloadSystems,
        alerts: alertMessages,
        events: auditEvents
      });
      masterSheet.getRange("Z1").setValue(payload);
    } else {
      masterSheet.getRange("Z1").setValue("");
    }
  }

  // Dispatch alert email
  if (!skipEmail && alertMessages.length > 0) {
    const subject = `🚨 HVAC Auditor: ${newCount} New, ${updateCount} Updated, ${missingCount} Missing`;
    const body = "The automated background script detected the following changes today:\n\n" +
      alertMessages.join("\n\n") +
      "\n\nPlease review the 'Audit_Approval' tab in your spreadsheet to process these updates.";
    MailApp.sendEmail(ALERT_EMAIL, subject, body);
  }
}

// ==========================================
// ZONE 7: BATCH APPROVAL PROCESSOR (v16.20)
// ==========================================
function processApprovals() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const approvalSheet = ss.getSheetByName("Audit_Approval");
  const historySheet = ss.getSheetByName("Audit_History");

  if (!approvalSheet || !historySheet) {
    SpreadsheetApp.getUi().alert("Error: Missing Audit_Approval or Audit_History tabs.");
    return;
  }

  const lastRow = approvalSheet.getLastRow();
  if (lastRow < 12) {
    SpreadsheetApp.getUi().alert("No pending items to approve.");
    return;
  }

  const data = approvalSheet.getRange(12, 3, lastRow - 11, 22).getValues();
  const historyRows = [];
  const rowsToDelete = [];
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const isChecked = row[0] === true; // Col C (Approve)
    if (!isChecked) continue;

    const sysType = String(row[5] || "").toUpperCase(); // Col H -> index 5
    const flag = String(row[21] || "").toUpperCase(); // Col X -> index 21

        let targetTab = "";
    if (String(row[9] || "").toUpperCase().trim() === "PACKAGE") targetTab = "Static_Package";
    else if (sysType.includes("HEAT PUMP") || sysType.includes("HP")) targetTab = "Static_HP";
    else if (sysType.includes("FURNACE") || sysType.includes("GAS")) targetTab = "Static_Furnace";
    else targetTab = "Static_AC";

    const staticSheet = ss.getSheetByName(targetTab);
    if (!staticSheet) continue;

    // Fingerprint for finding exact row
    const site = String(row[3] || "").trim();
    const capacity = String(row[4] || "").trim();
    const brand = String(row[6] || "").trim();
    const series = String(row[7] || "").trim();
    const stage = String(row[8] || "").trim();
    const style = String(row[9] || "").trim();
    const seer2 = String(row[10] || "").trim();
    const btu = String(row[14] || "").trim();
    const fingerprint = `${site}_${capacity}_${sysType}_${brand}_${series}_${stage}_${style}_${seer2}_${btu}`.toUpperCase();

    const statLastRow = staticSheet.getLastRow();
    let statData = [];
    if (statLastRow >= 12) {
      statData = staticSheet.getRange(12, 5, statLastRow - 11, 19).getValues();
    }

    if (flag.includes("NEW SYSTEM")) {
      const newStaticRow = row.slice(2, 21); // Extract Col E to W
      staticSheet.getRange(statLastRow + 1, 5, 1, 19).setValues([newStaticRow]);
    } else if (flag.includes("MISSING")) {
      for (let r = 0; r < statData.length; r++) {
        const sr = statData[r];
        const statFinger = `${String(sr[1]).trim()}_${String(sr[2]).trim()}_${String(sr[3]).trim()}_${String(sr[4]).trim()}_${String(sr[5]).trim()}_${String(sr[6]).trim()}_${String(sr[7]).trim()}_${String(sr[8]).trim()}_${String(sr[12]).trim()}`.toUpperCase();
        if (statFinger === fingerprint) {
          staticSheet.deleteRow(12 + r);
          break;
        }
      }
    } else {
      for (let r = 0; r < statData.length; r++) {
        const sr = statData[r];
        const statFinger = `${String(sr[1]).trim()}_${String(sr[2]).trim()}_${String(sr[3]).trim()}_${String(sr[4]).trim()}_${String(sr[5]).trim()}_${String(sr[6]).trim()}_${String(sr[7]).trim()}_${String(sr[8]).trim()}_${String(sr[12]).trim()}`.toUpperCase();
        if (statFinger === fingerprint) {
          staticSheet.getRange(12 + r, 16).setValue(row[13]); // Update AHRI (Col P)
          staticSheet.getRange(12 + r, 22).setValue(row[19]); // Update Price (Col V)
          break;
        }
      }
    }

    const hRow = [...row];
    hRow[0] = "APPROVED"; 
    hRow[1] = timestamp;
    historyRows.push(hRow);
    rowsToDelete.push(12 + i);
  }

  // Write to Audit_History
  if (historyRows.length > 0) {
    historySheet.getRange(historySheet.getLastRow() + 1, 3, historyRows.length, 22).setValues(historyRows);
  }

  // Delete processed rows in reverse order to preserve indexes
  for (let i = rowsToDelete.length - 1; i >= 0; i--) {
    approvalSheet.deleteRow(rowsToDelete[i]);
  }

  if (historyRows.length > 0) {
    // Recalculate Z1 payload automatically 
    checkPriceDifferences(true); 
    SpreadsheetApp.getUi().alert(`Successfully approved and cataloged ${historyRows.length} items!`);
  } else {
    SpreadsheetApp.getUi().alert("No valid items checked. Please check the boxes in Column C.");
  }
}

// ==========================================
// ZONE 8: PROPOSAL EXPORT BACKEND (v16.52.1)
// ==========================================

const PROPOSAL_ROOT_FOLDER_ID = '1K3bKIPtx3ujlO1dgY3AGSuwZnjtlygkZ';
const PROPOSAL_TEMPLATE_ID = '10aUtR_s55ZXmnP09OeSsBd990_Si3m1uD-hg8XH2d24';
const PROPOSAL_CONTENT_PLACEHOLDER = '{{PROPOSAL_CONTENT}}';

function jsonResponse(obj) {
    return ContentService
        .createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    try {
        const raw = e && e.postData && typeof e.postData.contents === 'string' ? e.postData.contents : '';

        if (!raw) {
            return jsonResponse({
                success: false,
                error: 'Missing request body.'
            });
        }

        const payload = JSON.parse(raw);
        const action = String(payload.action || '').trim();

        if (action === 'getProposalFolders') {
            return jsonResponse(getProposalFolders());
        }

        if (action === 'createProposalExport') {
            return jsonResponse(createProposalExport(payload));
        }

        if (action === 'getProposalState') {
            return jsonResponse(getProposalState(payload));
        }

        if (action === 'listManagedProposals') {
            return jsonResponse(listManagedProposals(payload));
        }

        if (action === 'updateProposalExport') {
            return jsonResponse(updateProposalExport(payload));
        }

        return jsonResponse({
            success: false,
            error: 'Unknown action.'
        });

    } catch (err) {
        console.error(err);
        return jsonResponse({
            success: false,
            error: err && err.message ? err.message : String(err)
        });
    }
}

function getProposalFolders() {
    const root = DriveApp.getFolderById(PROPOSAL_ROOT_FOLDER_ID);
    const iterator = root.getFolders();
    const folders = [];

    while (iterator.hasNext()) {
        const folder = iterator.next();
        folders.push({
            id: folder.getId(),
            name: folder.getName()
        });
    }

    folders.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });

    return {
        success: true,
        folders: folders
    };
}

function validateProposalDestinationFolder(destinationFolderId) {
    const root = DriveApp.getFolderById(PROPOSAL_ROOT_FOLDER_ID);
    const children = root.getFolders();

    while (children.hasNext()) {
        const folder = children.next();
        if (folder.getId() === destinationFolderId) {
            return folder;
        }
    }

    throw new Error('Invalid proposal destination folder.');
}

function sanitizeProposalFilenamePart(value) {
    if (!value) return 'Unknown';
    let clean = String(value).trim();
    clean = clean.replace(/[\x00-\x1F\x7F]/g, '');
    clean = clean.replace(/[\\\/:\*\?"<>\|]/g, '-');
    clean = clean.replace(/\s+/g, ' ');
    clean = clean.replace(/-+/g, '-');
    return clean || 'Unknown';
}

function escapeProposalRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getNextProposalVersion(folder, stem) {
    const escapedStem = escapeProposalRegex(stem);
    const pattern = new RegExp('^' + escapedStem + '(\\d+)(?:\\.pdf)?$', 'i');

    const files = folder.getFiles();
    let maxVersion = 0;

    while (files.hasNext()) {
        const file = files.next();
        const match = file.getName().match(pattern);
        if (match) {
            const v = parseInt(match[1], 10);
            if (v > maxVersion) {
                maxVersion = v;
            }
        }
    }

    return maxVersion + 1;
}

/**
 * Read-only. Throws if a managed proposal with this exact baseName already exists
 * in the destination (live PDF/Doc, or a Rev 1 archive left by a past Update).
 */
function assertManagedProposalBaseNameAvailable(destinationFolder, baseName) {
    const docs = getProposalSubfolderIfExists(destinationFolder, 'Proposal Docs');
    const archive = getProposalSubfolderIfExists(destinationFolder, 'Archive');
    const docArchive = archive && getProposalSubfolderIfExists(archive, 'Google Docs');
    const inUse =
        destinationFolder.getFilesByName(baseName + '.pdf').hasNext() ||
        destinationFolder.getFilesByName(baseName).hasNext() ||
        (docs && docs.getFilesByName(baseName).hasNext()) ||
        (archive && archive.getFilesByName(baseName + '_v1.pdf').hasNext()) ||
        (docArchive && docArchive.getFilesByName(baseName + '_v1').hasNext());
    if (inUse) {
        throw new Error('A proposal named "' + baseName + '" already exists in this destination folder. ' +
            'Load that proposal and use Update, or change the customer name or proposal date.');
    }
}

function generateProposalId() {
    const rawDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyMMdd');
    const charset = '0123456789ABCDEF';
    let suffix = '';
    for (let i = 0; i < 6; i++) {
        suffix += charset[Math.floor(Math.random() * charset.length)];
    }
    return 'PROP-' + rawDate + '-' + suffix;
}

/**
 * Read-only helper. Returns a direct-child folder with the given name inside
 * parentFolder, or null if none exists. Throws if duplicate names are detected.
 * NEVER creates a folder.
 */
function getProposalSubfolderIfExists(parentFolder, folderName) {
    const iter = parentFolder.getFoldersByName(folderName);
    let found = null;
    while (iter.hasNext()) {
        const f = iter.next();
        if (found !== null) {
            throw new Error('Duplicate subfolder "' + folderName + '" detected inside folder "' + parentFolder.getName() + '". Data integrity review required.');
        }
        found = f;
    }
    return found; // null if not found
}

function getOrCreateProposalSubfolder(destinationFolder, folderName) {
    const folders = destinationFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
        return folders.next();
    }
    return destinationFolder.createFolder(folderName);
}

/**
 * READ-ONLY. Retrieves the managed proposal manifest and validates it.
 * Returns the proposal state including builderState and file resolution status.
 * Does NOT create, modify, move, or trash any files or folders.
 */
function getProposalState(payload) {
    const proposalId = String(payload.proposalId || '').trim();
    const destinationFolderId = String(payload.destinationFolderId || '').trim();

    // --- Validate proposalId format ---
    const PROPOSAL_ID_RE = /^PROP-\d{6}-[0-9A-F]{6}$/;
    if (!proposalId || !PROPOSAL_ID_RE.test(proposalId)) {
        throw new Error('Invalid or missing proposalId. Expected format: PROP-YYMMDD-XXXXXX.');
    }

    // --- Validate destinationFolderId ---
    const destinationFolder = validateProposalDestinationFolder(destinationFolderId);

    // --- Read-only Proposal Data lookup ---
    const dataFolder = getProposalSubfolderIfExists(destinationFolder, 'Proposal Data');
    if (!dataFolder) {
        return {
            success: false,
            managed: false,
            notFound: true,
            error: 'Managed proposal state not found.'
        };
    }

    // --- Exact manifest filename lookup ---
    const manifestFileName = proposalId + '_manifest.json';
    const manifestIter = dataFolder.getFilesByName(manifestFileName);
    let manifestFile = null;
    let duplicateDetected = false;
    while (manifestIter.hasNext()) {
        const f = manifestIter.next();
        if (manifestFile !== null) {
            duplicateDetected = true;
            break;
        }
        manifestFile = f;
    }
    if (duplicateDetected) {
        throw new Error('Duplicate manifest files found for proposalId "' + proposalId + '". Data integrity review required.');
    }
    if (!manifestFile) {
        return {
            success: false,
            managed: false,
            notFound: true,
            error: 'Managed proposal state not found.'
        };
    }

    // --- Parse manifest ---
    let manifest;
    try {
        manifest = JSON.parse(manifestFile.getBlob().getDataAsString());
    } catch (parseErr) {
        throw new Error('Failed to parse manifest JSON for proposalId "' + proposalId + '": ' + parseErr.message);
    }
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
        throw new Error('Manifest is not a valid object for proposalId "' + proposalId + '".');
    }

    // --- Validate proposalId consistency ---
    if (manifest.proposalId !== proposalId) {
        throw new Error('Manifest proposalId mismatch. File contains "' + manifest.proposalId + '", requested "' + proposalId + '".');
    }

    // --- Validate destinationFolderId consistency ---
    if (manifest.destinationFolderId !== destinationFolderId) {
        throw new Error('Manifest destinationFolderId mismatch. Manifest belongs to a different destination folder.');
    }

    // --- Required field validation ---
    const required = ['schemaVersion', 'proposalId', 'currentRevision', 'destinationFolderId', 'currentFiles', 'builderState'];
    for (const field of required) {
        if (!(field in manifest)) {
            throw new Error('Manifest missing required field: "' + field + '".');
        }
    }
    const cf = manifest.currentFiles;
    if (!cf || typeof cf !== 'object') {
        throw new Error('Manifest currentFiles is missing or invalid.');
    }
    if (!cf.googleDocId || !cf.pdfId || !cf.baseName) {
        throw new Error('Manifest currentFiles is missing googleDocId, pdfId, or baseName.');
    }
    if (!manifest.builderState || typeof manifest.builderState !== 'object' || Array.isArray(manifest.builderState)) {
        throw new Error('Manifest builderState is missing or invalid.');
    }

    // --- File ID resolution (read-only, non-fatal on missing) ---
    const warnings = [];
    let googleDocExists = false;
    let googleDocUrl = null;
    let pdfExists = false;
    let pdfUrl = null;

    try {
        const docFile = DriveApp.getFileById(cf.googleDocId);
        googleDocExists = true;
        googleDocUrl = docFile.getUrl();
    } catch (e) {
        warnings.push('Google Doc ID ' + cf.googleDocId + ' could not be resolved: ' + e.message);
    }

    try {
        const pdfFile = DriveApp.getFileById(cf.pdfId);
        pdfExists = true;
        pdfUrl = pdfFile.getUrl();
    } catch (e) {
        warnings.push('PDF ID ' + cf.pdfId + ' could not be resolved: ' + e.message);
    }

    return {
        success: true,
        managed: true,
        proposalId: manifest.proposalId,
        currentRevision: manifest.currentRevision,
        destinationFolderId: manifest.destinationFolderId,
        createdAt: manifest.createdAt || null,
        updatedAt: manifest.updatedAt || null,
        currentFiles: {
            googleDocId: cf.googleDocId,
            pdfId: cf.pdfId,
            baseName: cf.baseName,
            googleDocExists: googleDocExists,
            pdfExists: pdfExists,
            googleDocUrl: googleDocUrl,
            pdfUrl: pdfUrl
        },
        builderState: manifest.builderState,
        warnings: warnings
    };
}

/**
 * READ-ONLY. Lists managed proposals for one validated destination folder.
 * Returns lightweight metadata for each valid managed manifest found in
 * the destination's Proposal Data subfolder. Never creates, modifies, or
 * trashes any file or folder.
 */
function listManagedProposals(payload) {
    const destinationFolderId = String(payload.destinationFolderId || '').trim();
    const PROPOSAL_ID_RE = /^PROP-\d{6}-[0-9A-F]{6}$/;
    const MANIFEST_FILENAME_RE = /^(PROP-\d{6}-[0-9A-F]{6})_manifest\.json$/;

    // --- Validate destinationFolderId ---
    const destinationFolder = validateProposalDestinationFolder(destinationFolderId);

    const warnings = [];
    const proposals = [];
    const seenIds = {}; // proposalId -> index in proposals (for duplicate detection)
    const duplicateIds = {}; // proposalId -> true if flagged as duplicate

    // --- Read-only Proposal Data lookup ---
    const dataFolder = getProposalSubfolderIfExists(destinationFolder, 'Proposal Data');
    if (!dataFolder) {
        // No Proposal Data folder means no managed proposals yet — not an error.
        return {
            success: true,
            managed: true,
            destinationFolderId: destinationFolderId,
            proposals: [],
            warnings: []
        };
    }

    // --- Enumerate candidate manifest files ---
    const fileIter = dataFolder.getFiles();
    while (fileIter.hasNext()) {
        const file = fileIter.next();
        const fileName = file.getName();

        // Only consider files whose names match the managed manifest convention.
        const match = MANIFEST_FILENAME_RE.exec(fileName);
        if (!match) continue; // unrelated file — skip silently

        const proposalIdFromFilename = match[1];
        let manifest;

        // --- Parse and validate manifest (errors are per-file, non-fatal) ---
        try {
            const raw = file.getBlob().getDataAsString();
            manifest = JSON.parse(raw);
        } catch (e) {
            warnings.push('Skipped unreadable manifest ' + fileName + ': ' + e.message);
            continue;
        }

        if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
            warnings.push('Skipped invalid manifest ' + fileName + ': not a valid JSON object.');
            continue;
        }

        // proposalId field must exist and match filename
        const pid = String(manifest.proposalId || '').trim();
        if (!pid || !PROPOSAL_ID_RE.test(pid)) {
            warnings.push('Skipped invalid manifest ' + fileName + ': proposalId missing or malformed.');
            continue;
        }
        if (pid !== proposalIdFromFilename) {
            warnings.push('Skipped invalid manifest ' + fileName + ': proposalId "' + pid + '" does not match filename.');
            continue;
        }

        // destinationFolderId must match selected destination
        if (manifest.destinationFolderId !== destinationFolderId) {
            warnings.push('Skipped invalid manifest ' + fileName + ': destination mismatch.');
            continue;
        }

        // Required listing fields
        if (!manifest.currentFiles || typeof manifest.currentFiles !== 'object') {
            warnings.push('Skipped invalid manifest ' + fileName + ': missing currentFiles.');
            continue;
        }
        if (!manifest.currentFiles.baseName) {
            warnings.push('Skipped invalid manifest ' + fileName + ': missing currentFiles.baseName.');
            continue;
        }
        if (manifest.currentRevision === undefined || manifest.currentRevision === null) {
            warnings.push('Skipped invalid manifest ' + fileName + ': missing currentRevision.');
            continue;
        }

        // --- Duplicate proposalId detection ---
        if (duplicateIds[pid]) {
            // Already flagged as duplicate — skip without adding another warning (already warned).
            continue;
        }
        if (pid in seenIds) {
            // First duplicate encounter — remove the already-added entry and flag both.
            proposals.splice(seenIds[pid], 1);
            // Adjust all later indices in seenIds
            for (const k in seenIds) {
                if (seenIds[k] > seenIds[pid]) seenIds[k]--;
            }
            delete seenIds[pid];
            duplicateIds[pid] = true;
            warnings.push('Duplicate managed proposal ID "' + pid + '" detected in Proposal Data. Both entries excluded.');
            continue;
        }

        // Valid entry — collect lightweight metadata (NO builderState)
        const entry = {
            proposalId: pid,
            baseName: manifest.currentFiles.baseName,
            currentRevision: manifest.currentRevision,
            createdAt: manifest.createdAt || null,
            updatedAt: manifest.updatedAt || null
        };
        seenIds[pid] = proposals.length;
        proposals.push(entry);
    }

    // --- Sort newest-first (updatedAt desc, createdAt desc, baseName asc) ---
    proposals.sort(function (a, b) {
        const au = a.updatedAt || a.createdAt || '';
        const bu = b.updatedAt || b.createdAt || '';
        if (au > bu) return -1;
        if (au < bu) return 1;
        if (a.baseName < b.baseName) return -1;
        if (a.baseName > b.baseName) return 1;
        return 0;
    });

    return {
        success: true,
        managed: true,
        destinationFolderId: destinationFolderId,
        proposals: proposals,
        warnings: warnings
    };
}

function createProposalManifest(dataFolder, destinationFolderId, proposalId, currentRevision, docId, pdfId, baseName, builderState) {
    const now = new Date().toISOString();
    const manifest = {
        schemaVersion: 1,
        proposalId: proposalId,
        currentRevision: currentRevision,
        createdAt: now,
        updatedAt: now,
        destinationFolderId: destinationFolderId,
        currentFiles: {
            googleDocId: docId,
            pdfId: pdfId,
            baseName: baseName
        },
        builderState: builderState
    };
    const fileName = proposalId + "_manifest.json";
    const file = dataFolder.createFile(fileName, JSON.stringify(manifest), MimeType.PLAIN_TEXT);
    return file;
}

function updateProposalExport(payload) {
    const proposalId = String(payload.proposalId || '').trim();
    const folderId = String(payload.destinationFolderId || '').trim();
    const loadedRevision = payload.loadedRevision;
    const state = payload.builderState;
    const text = payload.proposalText;
    if (!/^PROP-\d{6}-[0-9A-F]{6}$/.test(proposalId) ||
        !Number.isSafeInteger(loadedRevision) || loadedRevision < 1 ||
        typeof text !== 'string' || !text.trim() ||
        !state || typeof state !== 'object' || Array.isArray(state) ||
        !state.proposalAppState || !state.systemScratchpads ||
        !Array.isArray(state.selectedProposalRows)) {
        throw new Error('Invalid managed proposal update payload.');
    }
    const destination = validateProposalDestinationFolder(folderId);
    const lock = LockService.getScriptLock();
    try { lock.waitLock(15000); }
    catch (e) { throw new Error('Lock timeout: Could not safely update proposal.'); }
    try {
        const data = getProposalSubfolderIfExists(destination, 'Proposal Data');
        if (!data) throw new Error('Managed proposal state not found.');
        const found = data.getFilesByName(proposalId + '_manifest.json');
        if (!found.hasNext()) throw new Error('Managed proposal state not found.');
        const file = found.next();
        if (found.hasNext()) throw new Error('Duplicate managed proposal manifests found.');
        const oldText = file.getBlob().getDataAsString();
        const manifest = JSON.parse(oldText);
        if (!manifest || manifest.proposalId !== proposalId ||
            manifest.destinationFolderId !== folderId ||
            !Number.isSafeInteger(manifest.currentRevision) ||
            !manifest.builderState || !manifest.currentFiles ||
            !manifest.currentFiles.googleDocId || !manifest.currentFiles.pdfId ||
            !manifest.currentFiles.baseName) throw new Error('Invalid managed proposal manifest.');
        if (manifest.currentRevision !== loadedRevision) {
            return {success:false,error:'STALE_REVISION',
                currentRevision:manifest.currentRevision,message:'A newer revision exists. Reload before updating.'};
        }
        const oldDoc = DriveApp.getFileById(manifest.currentFiles.googleDocId);
        const oldPdf = DriveApp.getFileById(manifest.currentFiles.pdfId);
        const oldDocName = oldDoc.getName(), oldPdfName = oldPdf.getName();
        const base = manifest.currentFiles.baseName;
        const archivedDocName = base + '_v' + loadedRevision;
        const archivedPdfName = archivedDocName + '.pdf';
        const snapshotName = proposalId + '_builder_state_v' + loadedRevision + '.json';
        const existingDataArchive = getProposalSubfolderIfExists(data,'Archive');
        const existingArchive = getProposalSubfolderIfExists(destination,'Archive');
        const existingDocArchive = existingArchive && getProposalSubfolderIfExists(existingArchive,'Google Docs');
        if ((existingDataArchive && existingDataArchive.getFilesByName(snapshotName).hasNext()) ||
            (existingArchive && existingArchive.getFilesByName(archivedPdfName).hasNext()) ||
            (existingDocArchive && existingDocArchive.getFilesByName(archivedDocName).hasNext()))
            throw new Error('Revision archive already exists; data review required.');
        const docs = getProposalSubfolderIfExists(destination,'Proposal Docs');
        if (!docs) throw new Error('Proposal Docs folder is missing.');
        let newDoc=null, newPdf=null, snapshot=null, docMoved=false, pdfMoved=false;
        try {
            newDoc=DriveApp.getFileById(PROPOSAL_TEMPLATE_ID).makeCopy(base,docs);
            const doc=DocumentApp.openById(newDoc.getId());
            doc.getBody().replaceText('\\{\\{PROPOSAL_CONTENT\\}\\}',text);
            doc.saveAndClose();
            newPdf=destination.createFile(newDoc.getAs(MimeType.PDF).setName(base+'.pdf'));
            const dataArchive=existingDataArchive || data.createFolder('Archive');
            const archive=existingArchive || destination.createFolder('Archive');
            const docArchive=existingDocArchive || archive.createFolder('Google Docs');
            snapshot=dataArchive.createFile(snapshotName,oldText,MimeType.PLAIN_TEXT);
            oldDoc.setName(archivedDocName);
            oldDoc.moveTo(docArchive); docMoved=true;
            oldPdf.setName(archivedPdfName);
            oldPdf.moveTo(archive); pdfMoved=true;
            manifest.currentRevision=loadedRevision+1;
            manifest.updatedAt=new Date().toISOString();
            manifest.currentFiles={googleDocId:newDoc.getId(),pdfId:newPdf.getId(),baseName:base};
            manifest.builderState=state;
            file.setContent(JSON.stringify(manifest));
            return {success:true,managed:true,proposalId:proposalId,
                currentRevision:manifest.currentRevision,destinationFolderId:folderId,
                createdAt:manifest.createdAt||null,updatedAt:manifest.updatedAt,
                currentFiles:{googleDocId:newDoc.getId(),pdfId:newPdf.getId(),baseName:base,
                    googleDocExists:true,pdfExists:true,googleDocUrl:newDoc.getUrl(),pdfUrl:newPdf.getUrl()}};
        } catch(e) {
            const failures=[];
            try { file.setContent(oldText); } catch(r) { failures.push('manifest: '+r.message); }
            try { if(docMoved) oldDoc.moveTo(docs); oldDoc.setName(oldDocName); }
            catch(r) { failures.push('Doc: '+r.message); }
            try { if(pdfMoved) oldPdf.moveTo(destination); oldPdf.setName(oldPdfName); }
            catch(r) { failures.push('PDF: '+r.message); }
            if(!failures.length) {
                try { if(snapshot) snapshot.setTrashed(true); } catch(r) { failures.push('snapshot: '+r.message); }
                try { if(newDoc) newDoc.setTrashed(true); } catch(r) { failures.push('new Doc: '+r.message); }
                try { if(newPdf) newPdf.setTrashed(true); } catch(r) { failures.push('new PDF: '+r.message); }
            }
            if(failures.length) throw new Error('Update failed; recovery needs review ('+failures.join('; ')+'). Original: '+e.message);
            throw e;
        }
    } finally { lock.releaseLock(); }
}
function createProposalExport(payload) {
    const destinationFolderId = payload.destinationFolderId;
    const proposalDateRaw = payload.proposalDate || '';
    const customerNameRaw = payload.customerName || '';
    const addressRaw = payload.address || '';
    const proposalTextRaw = payload.proposalText || '';

    if (!destinationFolderId || !proposalDateRaw || !customerNameRaw || !addressRaw || !proposalTextRaw) {
        throw new Error('Missing required proposal payload fields.');
    }

    const destinationFolder = validateProposalDestinationFolder(destinationFolderId);

    let zip = (payload.zip || '').trim();
    let cleanAddress = addressRaw.trim();

    if (!zip) {
        const zipMatch = cleanAddress.match(/\b(\d{5})(?:-\d{4})?\b/);
        zip = zipMatch ? zipMatch[1] : 'No ZIP';
    }

    const commaIndex = cleanAddress.indexOf(',');
    let streetAddress = commaIndex !== -1 ? cleanAddress.substring(0, commaIndex).trim() : cleanAddress;

    const safeDate = sanitizeProposalFilenamePart(proposalDateRaw);
    const safeCustomer = sanitizeProposalFilenamePart(customerNameRaw);
    const safeStreet = sanitizeProposalFilenamePart(streetAddress);
    const safeZip = sanitizeProposalFilenamePart(zip);

    const stem = `${safeDate} - ${safeCustomer} - Proposal V`;
    const isManaged = payload.builderState && typeof payload.builderState === 'object' && !Array.isArray(payload.builderState);

    let lock = null;
    if (isManaged) {
        lock = LockService.getScriptLock();
        try {
            lock.waitLock(15000);
        } catch (e) {
            throw new Error('Lock timeout: Could not quickly obtain lock for managed proposal creation.');
        }
    }

    try {
        let nextVersion = null;
        let baseName;
        if (isManaged) {
            baseName = `${safeDate} - ${safeCustomer} - Proposal`;
            assertManagedProposalBaseNameAvailable(destinationFolder, baseName);
        } else {
            nextVersion = getNextProposalVersion(destinationFolder, stem);
            baseName = stem + nextVersion;
        }

        const templateFile = DriveApp.getFileById(PROPOSAL_TEMPLATE_ID);
        const docDestinationFolder = isManaged
            ? getOrCreateProposalSubfolder(destinationFolder, 'Proposal Docs')
            : destinationFolder;
        const docFile = templateFile.makeCopy(baseName, docDestinationFolder);

        let pdfFile = null;
        let manifestFile = null;

        try {
            const doc = DocumentApp.openById(docFile.getId());
            const body = doc.getBody();
            body.replaceText('\\{\\{PROPOSAL_CONTENT\\}\\}', proposalTextRaw);
            doc.saveAndClose();

            const completedDocFile = DriveApp.getFileById(docFile.getId());
            const pdfBlob = completedDocFile.getAs(MimeType.PDF).setName(baseName + '.pdf');
            pdfFile = destinationFolder.createFile(pdfBlob);

            let proposalId = null;
            if (isManaged) {
                proposalId = generateProposalId();
                const dataFolder = getOrCreateProposalSubfolder(destinationFolder, 'Proposal Data');
                manifestFile = createProposalManifest(
                    dataFolder,
                    destinationFolderId,
                    proposalId,
                    1,
                    docFile.getId(),
                    pdfFile.getId(),
                    baseName,
                    payload.builderState
                );
            }

            const response = {
                success: true,
                baseName: baseName,
                docId: docFile.getId(),
                googleDocUrl: docFile.getUrl(),
                pdfFileId: pdfFile.getId(),
                pdfUrl: pdfFile.getUrl()
            };

            if (!isManaged) {
                response.version = nextVersion;
            }

            if (isManaged) {
                response.managed = true;
                response.proposalId = proposalId;
                response.currentRevision = 1;
                response.manifestFileId = manifestFile.getId();
            }

            return response;

        } catch (err) {
            try {
                docFile.setTrashed(true);
                if (pdfFile) pdfFile.setTrashed(true);
                if (manifestFile) manifestFile.setTrashed(true);
            } catch (cleanupErr) {
                console.error('Cleanup failed', cleanupErr);
            }
            throw err;
        }
    } finally {
        if (lock) {
            lock.releaseLock();
        }
    }
}


// Added for manual Apps Script IDE OAuth trigger
function testDocumentAuthorization() {
  const doc =
    DocumentApp.openById(
      PROPOSAL_TEMPLATE_ID
    );

  console.log(
    'Document authorization OK: ' +
    doc.getName()
  );
}
