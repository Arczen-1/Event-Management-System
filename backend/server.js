const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const Admin = require("./models/Admin");
const User = require("./models/User");
const Contract = require("./models/Contract");
const Counter = require("./models/Counter");
const CreativeRequest = require("./models/CreativeRequest");
const { fetchCreativeSheetData } = require("./googleSheetsHelper");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/testdb");
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("MongoDB Connected"));

// ==================== SEED DEFAULT ACCOUNTS ====================
(async () => {
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

// ==================== AUTH ROUTE ====================
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (admin) {
      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) return res.status(400).json({ message: "Invalid password" });
      return res.json({
        message: "Login successful",
        user: { username, role: "Admin" },
      });
    }

    const user = await User.findOne({ username, status: "approved" });
    if (!user) return res.status(400).json({ message: "Invalid username or not approved" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    res.json({
      message: "Login successful",
      user: { username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
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

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
