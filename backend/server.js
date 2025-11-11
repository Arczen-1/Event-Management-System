const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const Admin = require("./models/Admin");
const User = require("./models/User");
const Contract = require("./models/Contract");
const Counter = require("./models/Counter");
const CreativeRequest = require("./models/CreativeRequest");
const { fetchCreativeSheetData } = require("./gsheetshelper3");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());


// MongoDB database connection
mongoose.connect("mongodb+srv://CapIT2467:CAPSTONE67@capstone.a1edsw6.mongodb.net/?appName=CAPSTONE") // Connect to local MongoDB instance
// Database connection event handlers
const db = mongoose.connection
db.on("error", console.error.bind(console, "MongoDB connection error:")) // Log connection errors
db.once("open", () => console.log("MongoDB Connected")) // Log successful connectionn


// ==================== SEED DEFAULT ACCOUNTS ====================
;(async () => {
  const existingAdmin = await Admin.findOne({ username: "admin" });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash("password123", 10);
    await Admin.create({ username: "admin", password: hashed });
    console.log("✅ Default admin created (username: admin, password: password123)");
  }

  const existingCM = await User.findOne({ username: "creativemanager" });
  if (!existingCM) {
    const hashed = await bcrypt.hash("password123", 10);
    await User.create({
      username: "creativemanager",
      fullName: "Creative Manager",
      password: hashed,
      email: "creativemanager@example.com",
      role: "Creative Manager",
      status: "approved",
    });
    console.log("✅ Default Creative Manager created");
  }
})();

// ==================== API ROUTES ====================

// POST /login - User authentication endpoint
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body // Extract credentials from request

    // First check if user is an admin
    const admin = await Admin.findOne({ username })
    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password) // Compare password with hash
      if (!isMatch) return res.status(400).json({ message: "Invalid password" })
      return res.json({ message: "Login successful", user: { username: admin.username, role: admin.role } })
    }

    // If not admin, check regular users (only approved ones can login)
    const user = await User.findOne({ username, status: "approved" })
    if (!user) return res.status(400).json({ message: "Invalid username or account not approved" })
      

    const isMatch = await bcrypt.compare(password, user.password) // Compare password with hash
    if (!isMatch) return res.status(400).json({ message: "Invalid password" })

    res.json({ message: "Login successful", user: { username: user.username, role: user.role } })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// POST /register - User registration endpoint
app.post("/register", async (req, res) => {
  try {
    const { username, fullName, password, email } = req.body // Extract user data from request

    // Check if username or email already exists in database
    const existingUser = await User.findOne({ $or: [{ username }, { email }] })
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" })
    }

    // Hash the password for security (salt rounds: 10)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user with pending status (requires admin approval)
    const user = new User({
      username,
      fullName,
      password: hashedPassword,
      email,
      status: "pending", // New users start as pending
    })

    await user.save() // Save user to database
    res.json({ message: "Registration successful. Waiting for admin approval." })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// GET /admin/pending-users - Get all users waiting for approval (admin only)
app.get("/admin/pending-users", async (req, res) => {
  try {
    // Find all users with pending status, exclude password field for security
    const pendingUsers = await User.find({ status: "pending" }).select("-password")
    res.json(pendingUsers)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// PUT /admin/approve-user/:userId - Approve a pending user and assign department (admin only)
app.put("/admin/approve-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params // Extract user ID from URL
    const { role } = req.body // Extract department/role from request body

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" })
    }

    // Validate that role/department is provided
    if (!role) {
      return res.status(400).json({ message: "Role is required" })
    }

    // Find user by ID
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Prevent approving already approved users
    if (user.status === "approved") {
      return res.status(400).json({ message: "User is already approved" })
    }

    // Update user status to approved and assign role/department
    user.role = role
    user.status = "approved"
    await user.save() // Save changes to database

    res.json({
      message: "User approved successfully",
      user: { id: user._id, username: user.username, role: user.role },
    })
  } catch (error) {
    console.error("Approve user error:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
})

// PUT /admin/reject-user/:userId - Reject and permanently delete a pending user (admin only)
app.put("/admin/reject-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params // Extract user ID from URL

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" })
    }

    // Find user by ID
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Only allow rejecting pending users (not already approved/rejected)
    if (user.status !== "pending") {
      return res.status(400).json({ message: "Only pending users can be rejected" })
    }

    // Permanently delete the user account from database
    await User.findByIdAndDelete(userId)

    res.json({ message: "User account rejected and removed successfully" })
  } catch (error) {
    console.error("Reject user error:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
})

// PUT /admin/assign-role/:userId - Change department/role of an existing user (admin only)
app.put("/admin/assign-role/:userId", async (req, res) => {
  try {
    const { userId } = req.params // Extract user ID from URL
    const { role } = req.body // Extract new role/department from request body

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" })
    }

    // Validate that role/department is provided
    if (!role) {
      return res.status(400).json({ message: "Role is required" })
    }

    // Find user by ID
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update user's role/department
    user.role = role
    await user.save() // Save changes to database

    res.json({
      message: "Role assigned successfully",
      user: { id: user._id, username: user.username, role: user.role },
    })
  } catch (error) {
    console.error("Assign role error:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
})

// GET /admin/users - Get all users in the system (admin only)
app.get("/admin/users", async (req, res) => {
  try {
    // Find all users, exclude password field for security
    const users = await User.find().select("-password")
    res.json(users)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// DELETE /admin/delete-user/:userId - Permanently delete any user account (admin only)
app.delete("/admin/delete-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params // Extract user ID from URL

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" })
    }

    // Find user by ID
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Permanently delete user from database
    await User.findByIdAndDelete(userId)
    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
})

// ==================== GOOGLE SHEETS HELPER ====================

const { fetchMonitoringData, getSheetsClient, SPREADSHEET_ID } = require("./googleSheetsHelper");


app.get("/monitoring", async (req, res) => {
  try {
    const data = await fetchMonitoringData();
    console.log("Fetched monitoring data:", data);
    res.json(data);
  } catch (err) {
    console.error("Error fetching monitoring data:", err);
    res.status(500).json({ error: "Failed to fetch monitoring data" });
  }
});

app.get("/inventory", async (req, res) => {
  try {
    const sections = await fetchMonitoringData();

    // Flatten your sheet rows into simple items list
    // Assuming each "section" looks like: header: [...], rows: [[date, item, qty, ...], ...]
    const items = sections.flatMap(section => 
      section.rows.map(row => ({
        itemName: row[0], 
        quantity: row[2], 
      }))
    );

    res.json(items);
  } catch (err) {
    console.error("Error fetching inventory:", err);
    res.status(500).json({ message: "Error retrieving inventory from Google Sheets" });
  }
});

// ==================== FABRICATION REQUEST ROUTES ====================

const FabricationRequest = require("./models/fabricationRequest");

// GET /fabrication-requests - fetch all requests
app.get("/fabrication-requests", async (req, res) => {
  try {
    const requests = await FabricationRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error("Error fetching fabrication requests:", error);
    res.status(500).json({ message: "Server error while fetching fabrication requests" });
  }
});

// POST /fabrication-requests - create new fabrication request
app.post("/fabrication-requests", async (req, res) => {
  try {
     const { username, item, quantity, remarks } = req.body;

    const newRequest = new FabricationRequest({
      username,
      item,
      quantity,
      remarks,
    });

    await newRequest.save();
    res.status(201).json({ message: "Fabrication request created successfully", request: newRequest });
  } catch (error) {
    console.error("Error creating fabrication request:", error);
    res.status(500).json({ message: "Server error while creating fabrication request" });
  }
});

app.get("/inventory-movement", async (req, res) => {
  try {
    const sheets = await getSheetsClient();
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "'invty movement monitoring'!B:I", // fetch block
    });

    let rows = resp.data.values || [];

    // 🔹 Remove completely empty rows
    rows = rows.filter(row => row.some(cell => cell && cell.trim() !== ""));

    // 🔹 If first row is headers, skip it
    if (rows.length < 2) return res.json([]);

    const headers = [
      "Item Code",        // B
      "Item Description", // C
      "UOM",              // D
      "On-hand (Start)",  // F
      "Quantity",         // G
      "Damages",          // H
      "On-hand (End)",    // I
    ];

    const data = rows.slice(1).map((row) => ({
      "Item Code": row[0] || "",
      "Item Description": row[1] || "",
      "UOM": row[2] || "",
      "On-hand (Start)": row[4] || "",
      "Quantity": row[5] || "",
      "Damages": row[6] || "",
      "On-hand (End)": row[7] || "",
    }));

    res.json(data);
  } catch (error) {
    console.error("Error fetching inventory movement data:", error);
    res.status(500).json({ error: "Failed to fetch inventory movement data" });
  }
});

// ==================== CHECKLIST ROUTES ====================

// GET /inventory/checklist - Verify that inventory items have valid quantities before approval
app.get("/inventory/checklist", async (req, res) => {
  try {
    const sheets = await getSheetsClient();
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "'invty movement monitoring'!B:I",
    });

    let rows = resp.data.values || [];
    rows = rows.filter(row => row.some(cell => cell && cell.trim() !== ""));

    if (rows.length < 2) {
      return res.status(400).json({ error: "No inventory data found" });
    }

    // Skip header row
    const data = rows.slice(1).map((row) => ({
      "Item Code": row[0],
      "Item Description": row[1],
      "UOM": row[2],
      "On-hand (Start)": parseFloat(row[4] || 0),
      "Quantity": parseFloat(row[5] || 0),
      "Damages": parseFloat(row[6] || 0),
      "On-hand (End)": parseFloat(row[7] || 0),
    }));

    // Validate checklist: ensure no negative end quantities, all required fields filled
    const issues = data.filter(
      item =>
        !item["Item Code"] ||
        item["On-hand (End)"] < 0 ||
        isNaN(item["On-hand (Start)"]) ||
        isNaN(item["Quantity"])
    );

    if (issues.length > 0) {
      return res.status(400).json({
        error: "Inventory checklist failed validation",
        issues,
      });
    }

    res.json({ message: "Inventory checklist passed", count: data.length });
  } catch (error) {
    console.error("Checklist validation error:", error);
    res.status(500).json({ error: "Failed to check inventory checklist" });
  }
});


const { google } = require("googleapis");
const fs = require("fs");

app.get("/stockroom-inventory", async (req, res) => {
  try {
    //Load credentials properly (recommended way)
    const credentials = JSON.parse(fs.readFileSync("credentials.json"));
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const SPREADSHEET_ID = "1C6wGegHlIRnubxcWnnQTskRj2UIHK7PuwI8IS42NG5M";

    //Fetch the full range (A:Z is fine if you have many columns)
    const range = "'CONSOLIDATED AUG'!D:F";

    // Fetch data from sheet
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });

    let rows = resp.data.values || [];
    if (rows.length < 2) return res.json([]);

    // Remove empty rows
    rows = rows.filter(row => row.some(cell => cell && cell.trim() !== ""));

    // First row should be headers, skip if they exist in sheet
    const data = rows.slice(1).map((row) => ({
      "ITEM DESCRIPTION": row[0] || "",
      "UNIT": row[2] || "",
    }));

    console.log(`Loaded ${data.length} rows from Stockroom inventory`);
    res.json(data);

  } catch (error) {
    console.error("Error fetching stockroom inventory data:", error);
    res.status(500).json({ error: "Failed to fetch stockroom inventory data" });
  }
});


// ==================== CONTRACT ROUTES ====================

// Get all contracts
app.get("/contracts/creative", async (req, res) => {
  try {
    const contracts = await Contract.find().sort({ createdAt: -1 });
    res.json({ contracts });
  } catch (error) {
    console.error("Fetch contracts error:", error);
    res.status(500).json({ message: "Failed to fetch contracts" });
  }
});

// Get a single contract by ID
app.get("/contracts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await Contract.findById(id);
    if (!contract) return res.status(404).json({ message: "Contract not found" });
    res.json({ contract });
  } catch (error) {
    console.error("Fetch single contract error:", error);
    res.status(500).json({ message: "Failed to fetch contract details" });
  }
});

// ==================== CREATIVE REQUEST ROUTES ====================

// Get all creative requests
app.get("/creativeRequests", async (req, res) => {
  try {
    const requests = await CreativeRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error("Fetch creative requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Create a new creative request (for "Submit Request")
app.post("/creativeRequests", async (req, res) => {
  try {
    const {
      requestName,
      contractNo,
      client,
      materials,
      dueDate,
      status,
      contractRef,
      contractName,
      startDate,
      endDate,
    } = req.body;

    if (!requestName || !contractNo || !materials || materials.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newRequest = new CreativeRequest({
      requestName,
      contractNo,
      client,
      materials,
      dueDate,
      status: status || "Draft",
      contractRef,
      contractName,
      startDate,
      endDate,
      createdAt: new Date(),
    });

    const saved = await newRequest.save();
    res.status(201).json({ message: "Creative request created", request: saved });
  } catch (error) {
    console.error("Create creative request error:", error);
    res.status(500).json({ message: "Failed to create creative request" });
  }
});

// ✅ Update existing creative request (for "Edit" button)
app.put("/creativeRequests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updated = await CreativeRequest.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    if (!updated) return res.status(404).json({ message: "Request not found" });

    res.json({ message: "Creative request updated", updatedRequest: updated });
  } catch (error) {
    console.error("Update creative request error:", error);
    res.status(500).json({ message: "Failed to update creative request" });
  }
});

// Approve request
app.put("/creativeRequests/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await CreativeRequest.findByIdAndUpdate(
      id,
      { status: "Sent to Purchasing" },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Request not found" });
    res.json({ message: "Creative request approved", request: updated });
  } catch (error) {
    console.error("Approve request error:", error);
    res.status(500).json({ message: "Failed to approve creative request" });
  }
});

// Reject request
app.put("/creativeRequests/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const updated = await CreativeRequest.findByIdAndUpdate(
      id,
      { status: "Rejected", rejectionReason: reason },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Request not found" });
    res.json({ message: "Creative request rejected", request: updated });
  } catch (error) {
    console.error("Reject request error:", error);
    res.status(500).json({ message: "Failed to reject creative request" });
  }
});

// Delete request
app.delete("/creativeRequests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CreativeRequest.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Request not found" });
    res.json({ message: "Creative request deleted successfully" });
  } catch (error) {
    console.error("Delete creative request error:", error);
    res.status(500).json({ message: "Failed to delete creative request" });
  }
});

// ==================== GOOGLE SHEETS ROUTE ====================
app.get("/api/sheets/creative", async (req, res) => {
  try {
    const data = await fetchCreativeSheetData();
    console.log("📊 /api/sheets/creative fetched rows:", data.length);
    res.json({ data });
  } catch (err) {
    console.error("❌ Sheets API error:", err.message);
    res.status(500).json({ message: "Failed to fetch Google Sheets data" });
  }
});


// ==================== PROFILE ROUTES ====================

// GET /profile/:username - Get user profile details
app.get("/profile/:username", async (req, res) => {
  try {
    const { username } = req.params
    const user = await User.findOne({ username }).select("-password")
    if (!user) return res.status(404).json({ message: "User not found" })
    res.json({ user })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// PUT /profile/:username - Update user profile details
app.put("/profile/:username", async (req, res) => {
  try {
    const { username } = req.params
    const { mobile, landline, address } = req.body
    const user = await User.findOne({ username })
    if (!user) return res.status(404).json({ message: "User not found" })
    user.mobile = mobile || ""
    user.landline = landline || ""
    user.address = address || ""
    await user.save()
    res.json({ message: "Profile updated successfully", user: { username: user.username, fullName: user.fullName, email: user.email, mobile: user.mobile, landline: user.landline, address: user.address } })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// PUT /profile/:username/password - Change user password
app.put("/profile/:username/password", async (req, res) => {
  try {
    const { username } = req.params
    const { currentPassword, newPassword } = req.body
    const user = await User.findOne({ username })
    if (!user) return res.status(404).json({ message: "User not found" })

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" })

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    await user.save()
    res.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// ==================== FINANCE ROUTES ====================

// --- Get Finance Overview (total income + breakdown) ---
app.get("/api/finance/overview/:filter", async (req, res) => {
  try {
    const { filter } = req.params;
    const now = new Date();
    let dateFilter = {};

    if (filter === "day") {
      const start = new Date(now.setHours(0, 0, 0, 0));
      dateFilter = { updatedAt: { $gte: start } };
    } else if (filter === "week") {
      const start = new Date();
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      dateFilter = { updatedAt: { $gte: start } };
    } else if (filter === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { updatedAt: { $gte: start } };
    } else if (filter === "year") {
      const start = new Date(now.getFullYear(), 0, 1);
      dateFilter = { updatedAt: { $gte: start } };
    }

    // Only count Paid finance records
    const paidRecords = await Finance.find({
      ...dateFilter,
      status: "Paid",
    }).populate("contractId", "page1.celebratorName page3.grandTotal");

    const total = paidRecords.reduce(
      (sum, r) => sum + (r.totalAmount || 0),
      0
    );

    const breakdown = paidRecords.map((r) => ({
      client: r.client,
      amount: r.totalAmount,
      date: r.date,
      contractId: r.contractId?._id,
    }));

    res.json({ total, breakdown });
  } catch (err) {
    console.error("Finance overview error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Get Active Contracts for Finance Client Page ---
app.get("/api/finance/clients", async (req, res) => {
  try {
    // Get only contracts approved by Accounting and not cancelled
    const activeContracts = await Contract.find({
      status: "Active",
    })
      .sort({ updatedAt: -1 })
      .select(
        "contractNumber page1.celebratorName page1.occasion page3.grandTotal status updatedAt"
      );

    res.json(activeContracts);
  } catch (err) {
    console.error("Finance clients error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Mark Contract as Paid ---
app.put("/api/finance/mark-paid/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findById(id);
    if (!contract) return res.status(404).json({ message: "Contract not found" });

    // Update contract to Paid
    contract.status = "Paid";
    await contract.save();

    // Create/Update finance record
    let finance = await Finance.findOne({ contractId: id });
    const totalAmount =
      Number(String(contract.page3?.grandTotal || "0").replace(/[^0-9.-]+/g, "")) || 0;

    if (finance) {
      finance.status = "Paid";
      finance.totalAmount = totalAmount;
      finance.date = new Date();
      await finance.save();
    } else {
      finance = await Finance.create({
        client: contract.page1?.celebratorName || "Unknown Client",
        contractId: contract._id,
        totalAmount,
        status: "Paid",
        items: [
          {
            name: contract.page1?.occasion || "Catering Service",
            qty: 1,
            price: totalAmount,
          },
        ],
        date: new Date(),
      });
    }

    res.json({ message: "Marked as paid successfully", contract, finance });
  } catch (err) {
    console.error("Finance mark paid error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ==================== ACCOUNTING ROUTES ====================
// PUT /contracts/:id/accounting-approve - Approve a contract (Accounting only)
// (Updated to create a Finance record when contract becomes Active)
app.put("/contracts/:id/accounting-approve", async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid contract id" })
    const contract = await Contract.findById(id)
    if (!contract) return res.status(404).json({ message: "Not found" })
    if (contract.status !== "For Accounting Review") return res.status(400).json({ message: "Only contracts with 'For Accounting Review' status can be approved by Accounting" })

    contract.status = "Active"
    await contract.save()

    // Create Finance record linked to this contract if not already existing
    try {
      const existing = await Finance.findOne({ contractId: contract._id })
      if (!existing) {
        const clientName = (contract.page1 && (contract.page1.celebratorName || contract.page1.representativeName)) || "Unknown Client"
        const grand = parseFloat(contract.page3?.grandTotal) || 0
        const paymentDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from approval
        await Finance.create({
          client: clientName,
          contractId: contract._id,
          totalAmount: grand,
          items: contract.page3?.items || [], // optional; if you have items stored, include
          status: "Unpaid",
          paymentDueDate,
        })
      }
    } catch (finErr) {
      console.error("Failed to create finance record after contract activation:", finErr)
      // don't fail the whole request — contract is approved regardless
    }

    res.json({ message: "Contract approved by Accounting and activated", contract })
  } catch (error) {
    console.error("Accounting approve contract error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// ==================== LOGISTICS ROUTES ====================

// --- Get all active contracts for Logistics (for Contracts tab) ---
app.get("/api/logistics/contracts", async (req, res) => {
  try {
    const contracts = await Contract.find({ status: "Active" });

    const formattedContracts = contracts.map((c) => ({
      _id: c._id,
      name:
        (c.page1 && (c.page1.contractName || c.page1.occasion)) ||
        "Untitled Contract",
      celebratorName: (c.page1 && c.page1.celebratorName) || "",
      contractNumber: c.contractNumber,
      page1: c.page1,
      page2: c.page2,
      page3: c.page3,
    }));

    res.json({ contracts: formattedContracts });
  } catch (err) {
    console.error("Error fetching logistics contracts:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// --- Generate calendar view of truck bookings (for Calendar tab) ---
app.get("/api/logistics/calendar", async (req, res) => {
  try {
    // Fetch all active contracts
    const contracts = await Contract.find({ status: "Active" });

    // Generate Google Calendar-style events based on event dates
    const events = contracts
      .filter((c) => c.page1?.eventDate)
      .map((c) => ({
        id: c._id,
        title:
          (c.page1?.occasion || c.page1?.contractName || "Catering Event") +
          " - " +
          (c.page1?.celebratorName || ""),
        start: c.page1?.eventDate,
        end: c.page1?.eventDate, // one-day event
        color: "#1a73e8", // Google blue
        description: `Venue: ${c.page1?.venue || "N/A"}\nAddress: ${
          c.page1?.address || "N/A"
        }\nTruck: ${c.page4?.truckAssigned || "Unassigned"}`,
      }));

    // use your own embedded Google Calendar URL
    const calendarEmbedURL =
      "https://calendar.google.com/calendar/embed?src=your_calendar_id%40group.calendar.google.com&ctz=Asia%2FManila";

    // Return both the embed and event data
    res.json({
      calendarEmbedURL,
      events,
    });
  } catch (err) {
    console.error("Error fetching logistics calendar:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// --- fetch single contract for modal view ---
app.get("/api/logistics/contracts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }
    res.json({ contract });
  } catch (err) {
    console.error("Error fetching contract details:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ====== Mock Data for Trucks & Drivers ======
let trucks = [
  { id: 1, name: "Truck 1 - Toyota HiAce", assignedDates: [] },
  { id: 2, name: "Truck 2 - Mitsubishi Canter", assignedDates: [] },
];

let drivers = [
  { id: 1, name: "Juan Dela Cruz", assignedDates: [] },
  { id: 2, name: "Maria Santos", assignedDates: [] },
];

// ====== Auto-Assign Available Truck & Driver ======
function assignTruckAndDriver(date) {
  const dateStr = new Date(date).toISOString().split("T")[0];

  const availableTruck = trucks.find(
    (t) => !t.assignedDates.includes(dateStr)
  );
  const availableDriver = drivers.find(
    (d) => !d.assignedDates.includes(dateStr)
  );

  if (availableTruck && availableDriver) {
    availableTruck.assignedDates.push(dateStr);
    availableDriver.assignedDates.push(dateStr);
    return { truck: availableTruck.name, driver: availableDriver.name };
  }

  return {
    truck: availableTruck ? availableTruck.name : "No Truck Available",
    driver: availableDriver ? availableDriver.name : "No Driver Available",
  };
}

// ====== Fetch Assigned Bookings ======
app.get("/api/logistics/bookings", async (req, res) => {
  try {
    const contracts = await Contract.find({ status: "Active" });

    const bookings = contracts
      .filter((c) => c.page1?.eventDate)
      .map((c) => {
        const assigned = assignTruckAndDriver(c.page1.eventDate);
        return {
          client: c.page1?.celebratorName || "Unknown",
          venue: c.page1?.venue || "N/A",
          date: c.page1?.eventDate,
          truck: assigned.truck,
          driver: assigned.driver,
        };
      });

    res.json({ bookings });
  } catch (err) {
    console.error("Error fetching truck/driver bookings:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Get Best Route to Venue (for Leaflet Map) ---
const axios = require("axios");
 // make sure axios is imported at the top if not yet

app.get("/api/logistics/route", async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: "Missing destination coordinates" });
  }

  const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImYxMGRiZjg5MGNlMjRmYzQ5MDdhYTA5ZDQzNzY1NTY2IiwiaCI6Im11cm11cjY0In0=";

  // Starting point (e.g., your HQ or warehouse in Manila)
  const start = [120.9842, 14.5995]; // [lng, lat]
  const end = [parseFloat(lng), parseFloat(lat)];

  try {
    const routeRes = await axios.get(
      `https://api.openrouteservice.org/v2/directions/driving-car`,
      {
        params: {
          api_key: ORS_API_KEY,
          start: `${start[0]},${start[1]}`,
          end: `${end[0]},${end[1]}`,
        },
      }
    );

    const routeData = routeRes.data;

    res.json({
      route: routeData.features[0].geometry.coordinates,
      summary: routeData.features[0].properties.summary,
    });
  } catch (err) {
    console.error("Error fetching best route:", err.message);
    res.status(500).json({ message: "Failed to calculate best route" });
  }
});

// ==================== LINEN ROUTES ====================

// const express = require("express");
// const mongoose = require("mongoose");

// ---------- LINEN INVENTORY SCHEMA ----------
const LinenInventorySchema = new mongoose.Schema({
  item: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  unit: { type: String, default: "pcs" },
});

const LinenInventory = mongoose.model("LinenInventory", LinenInventorySchema);

// ---------- LINEN CHECKLIST SCHEMA ----------
const LinenChecklistSchema = new mongoose.Schema({
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: "Contract" },
  checklistItems: [
    {
      name: String,
      checked: Boolean,
    },
  ],
  dateSubmitted: { type: Date, default: Date.now },
});

const LinenChecklist = mongoose.model("LinenChecklist", LinenChecklistSchema);

// ---------- REQUEST FORM SCHEMA ----------
const LinenRequestSchema = new mongoose.Schema({
  item: String,
  quantity: Number,
  reason: String,
  status: { type: String, default: "Pending" }, // Pending, Approved, Denied
  dateRequested: { type: Date, default: Date.now },
});

const LinenRequest = mongoose.model("LinenRequest", LinenRequestSchema);



// ========== LINEN ROUTES ==========

// --- Get all inventory items ---
app.get("/api/linen/inventory", async (req, res) => {
  try {
    const inventory = await LinenInventory.find();
    res.json({ inventory });
  } catch (err) {
    console.error("Error fetching linen inventory:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Add a new inventory item ---
app.post("/api/linen/inventory", async (req, res) => {
  try {
    const { item, stock, unit } = req.body;
    const newItem = new LinenInventory({ item, stock, unit });
    await newItem.save();
    res.json({ message: "Item added successfully", newItem });
  } catch (err) {
    console.error("Error adding inventory item:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Update stock count ---
app.put("/api/linen/inventory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const updated = await LinenInventory.findByIdAndUpdate(
      id,
      { stock },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Stock updated", updated });
  } catch (err) {
    console.error("Error updating stock:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Submit checklist for a contract ---
app.post("/api/linen/checklist", async (req, res) => {
  try {
    const { contractId, checklistItems } = req.body;
    const checklist = new LinenChecklist({ contractId, checklistItems });
    await checklist.save();
    res.json({ message: "Checklist submitted", checklist });
  } catch (err) {
    console.error("Error saving checklist:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Get checklist by contract ---
app.get("/api/linen/checklist/:contractId", async (req, res) => {
  try {
    const { contractId } = req.params;
    const checklist = await LinenChecklist.findOne({ contractId });
    res.json({ checklist });
  } catch (err) {
    console.error("Error fetching checklist:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Submit linen request to purchasing ---
app.post("/api/linen/request", async (req, res) => {
  try {
    const { item, quantity, reason } = req.body;
    const request = new LinenRequest({ item, quantity, reason });
    await request.save();
    res.json({ message: "Request submitted successfully", request });
  } catch (err) {
    console.error("Error submitting request:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Get all requests ---
app.get("/api/linen/requests", async (req, res) => {
  try {
    const requests = await LinenRequest.find().sort({ dateRequested: -1 });
    res.json({ requests });
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Start the server and listen on specified port
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

