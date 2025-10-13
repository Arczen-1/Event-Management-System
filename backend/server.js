// Import required dependencies
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const Admin = require("./models/Admin");
const User = require("./models/User");
const Contract = require("./models/Contract");
const Counter = require("./models/Counter");
const CreativeRequest = require("./models/CreativeRequest"); // Added CreativeRequest model

// Initialize Express application
const app = express();
const PORT = 5000;

// Middleware configuration
app.use(cors());
app.use(express.json());

// MongoDB database connection
mongoose.connect("mongodb://127.0.0.1:27017/testdb");

// Database connection event handlers
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("MongoDB Connected"));

// Seed default admin account (only runs if no admin exists)
(async () => {
  const existing = await Admin.findOne({ username: "admin" });
  if (!existing) {
    const hashed = await bcrypt.hash("password123", 10);
    await Admin.create({ username: "admin", password: hashed });
    console.log("Default admin created (username: admin, password: password123)");
  }
})();

// Seed default Creative Manager account (only runs if none exists)
(async () => {
  const existing = await User.findOne({ username: "creativemanager" });
  if (!existing) {
    const hashed = await bcrypt.hash("password123", 10);
    await User.create({
      username: "creativemanager",
      fullName: "Creative Manager",
      password: hashed,
      email: "creativemanager@example.com",
      role: "Creative Manager",
      status: "approved",
    });
    console.log("Default Creative Manager created (username: creativemanager, password: password123)");
  }
})();

// ==================== AUTHENTICATION ROUTES ====================

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid password" });
      return res.json({ message: "Login successful", user: { username: admin.username, role: "Admin" } });
    }

    const user = await User.findOne({ username, status: "approved" });
    if (!user) return res.status(400).json({ message: "Invalid username or account not approved" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    res.json({ message: "Login successful", user: { username: user.username, role: user.role } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { username, fullName, password, email } = req.body;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return res.status(400).json({ message: "Username or email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, fullName, password: hashedPassword, email, status: "pending" });
    await user.save();
    res.json({ message: "Registration successful. Waiting for admin approval." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ==================== ADMIN ROUTES ====================

app.get("/admin/pending-users", async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: "pending" }).select("-password");
    res.json(pendingUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/admin/approve-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: "Invalid user ID" });
    if (!role) return res.status(400).json({ message: "Role is required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.status === "approved") return res.status(400).json({ message: "User already approved" });

    user.role = role;
    user.status = "approved";
    await user.save();
    res.json({ message: "User approved successfully", user });
  } catch (error) {
    console.error("Approve user error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

app.put("/admin/reject-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: "Invalid user ID" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.status !== "pending") return res.status(400).json({ message: "Only pending users can be rejected" });

    await User.findByIdAndDelete(userId);
    res.json({ message: "User rejected and removed" });
  } catch (error) {
    console.error("Reject user error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// ==================== CREATIVE REQUEST ROUTES ====================

app.get("/creativeRequests", async (req, res) => {
  try {
    const requests = await CreativeRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error("Fetch creative requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/creativeRequests", async (req, res) => {
  try {
    let { requestName, designer, dueDate, status, contractRef, materials, notes, materialsNeeded } = req.body;
    if (!materials && materialsNeeded) materials = [{ name: materialsNeeded }];
    const creativeRequest = new CreativeRequest({
      requestName,
      designer,
      dueDate,
      status,
      contractRef,
      materials: materials || [],
      notes: notes || "",
    });
    await creativeRequest.save();
    res.json({ request: creativeRequest });
  } catch (error) {
    console.error("Create creative request error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

app.put("/creativeRequests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { requestName, designer, dueDate, status, materials, notes } = req.body;
    const creativeRequest = await CreativeRequest.findById(id);
    if (!creativeRequest) return res.status(404).json({ message: "Request not found" });

    creativeRequest.requestName = requestName;
    creativeRequest.designer = designer;
    creativeRequest.dueDate = dueDate;
    creativeRequest.status = status;
    creativeRequest.materials = materials;
    creativeRequest.notes = notes;
    await creativeRequest.save();

    res.json({ updatedRequest: creativeRequest });
  } catch (error) {
    console.error("Update creative request error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

app.delete("/creativeRequests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const creativeRequest = await CreativeRequest.findByIdAndDelete(id);
    if (!creativeRequest) return res.status(404).json({ message: "Request not found" });
    res.json({ message: "Creative request deleted" });
  } catch (error) {
    console.error("Delete creative request error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// ==================== CONTRACT ROUTES FOR CREATIVE DASHBOARD ====================

app.get("/contracts/creative", async (req, res) => {
  try {
    // Only return Sales contracts (so creatives see contracts passed from Sales)
    const contracts = await Contract.find({ department: "Sales" }).sort({ createdAt: -1 });
    res.json({ contracts });
  } catch (error) {
    console.error("Error fetching creative contracts:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ==================== SERVER START ====================

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
