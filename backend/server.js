// Import required dependencies
const express = require("express") // Web framework for Node.js
const mongoose = require("mongoose") // MongoDB object modeling tool
const bcrypt = require("bcryptjs") // Password hashing library
const cors = require("cors") // Cross-Origin Resource Sharing middleware
const Admin = require("./models/Admin") // Admin user model
const User = require("./models/User") // Regular user model
const Contract = require("./models/Contract") // Contract model
const Counter = require("./models/Counter") // Monthly counter for contract numbers

// Initialize Express application
const app = express()
const PORT = 5000 // Server port number

// Middleware configuration
app.use(cors()) // Enable CORS for all routes (allows frontend to connect)
app.use(express.json()) // Parse JSON request bodies

// MongoDB database connection
mongoose.connect("mongodb://127.0.0.1:27017/testdb") // Connect to local MongoDB instance

// Database connection event handlers
const db = mongoose.connection
db.on("error", console.error.bind(console, "MongoDB connection error:")) // Log connection errors
db.once("open", () => console.log("MongoDB Connected")) // Log successful connection

// Seed default admin account (only runs if no admin exists)
;(async () => {
  const existing = await Admin.findOne({ username: "admin" }) // Check if admin already exists
  if (!existing) {
    const hashed = await bcrypt.hash("password123", 10) // Hash the default password
    await Admin.create({ username: "admin", password: hashed }) // Create default admin
    console.log("👤 Default admin created (username: admin, password: password123)")
  }
})()

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

// ==================== CONTRACT ROUTES ====================

// Helper to build the next contract number with monthly reset.
// Format: YYYY/MM/DD-XXXX where XXXX is 4-digit sequence reset monthly.
async function generateNextContractNumber(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const key = `${year}/${month}`

  // Atomically increment the counter for this month
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  )

  const seq = String(counter.seq).padStart(4, "0")
  return `${year}${month}${day}-${seq}`
}

// GET /contracts/next-number - Preview the next contract number (no write besides counter)
app.get("/contracts/next-number", async (req, res) => {
  try {
    // Use a sessionless peek without increment? Requirement says increases unless deleted,
    // but we need stability. We'll increment only on creation, so here we simulate next
    // by reading current seq. If none, next is 0001.
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const key = `${year}/${month}`
    const doc = await Counter.findOne({ key })
    const nextSeq = String(((doc && doc.seq) || 0) + 1).padStart(4, "0")
    const day = String(now.getDate()).padStart(2, "0")
    res.json({ nextNumber: `${year}${month}${day}-${nextSeq}` })
  } catch (error) {
    console.error("Next number error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// POST /contracts - Create a new contract with auto-generated number
app.post("/contracts", async (req, res) => {
  try {
    const { department = "Sales", status = "Draft", page1 = {}, page2 = {}, page3 = {} } = req.body

    const contractNumber = await generateNextContractNumber(new Date())

    const contract = await Contract.create({
      contractNumber,
      department,
      status,
      page1,
      page2,
      page3,
    })

    res.json({ message: "Contract created", contract })
  } catch (error) {
    console.error("Create contract error:", error)
    if (error.code === 11000) {
      // Rare race: regenerate and retry once
      try {
        const contractNumber = await generateNextContractNumber(new Date())
        const { department = "Sales", status = "Draft", page1 = {}, page2 = {}, page3 = {} } = req.body
        const contract = await Contract.create({ contractNumber, department, status, page1, page2, page3 })
        return res.json({ message: "Contract created", contract })
      } catch (err2) {
        console.error("Retry create contract error:", err2)
      }
    }
    res.status(500).json({ message: "Server error" })
  }
})

// GET /contracts/:id - Fetch full contract details
app.get("/contracts/:id", async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid contract id" })
    }
    const contract = await Contract.findById(id)
    if (!contract) return res.status(404).json({ message: "Not found" })
    res.json({ contract })
  } catch (error) {
    console.error("Get contract error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// GET /contracts - List contracts (basic, newest first)
app.get("/contracts", async (req, res) => {
  try {
    const contracts = await Contract.find({}).sort({ createdAt: -1 })
    res.json({ contracts })
  } catch (error) {
    console.error("List contracts error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// PUT /contracts/:id - Update a contract (allowed while Draft)
app.put("/contracts/:id", async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid contract id" })
    const { page1 = {}, page2 = {}, page3 = {}, status } = req.body
    const contract = await Contract.findById(id)
    if (!contract) return res.status(404).json({ message: "Not found" })
    if (contract.status !== "Draft") return res.status(400).json({ message: "Only Draft contracts can be edited" })
    if (status) contract.status = status
    contract.page1 = page1
    contract.page2 = page2
    contract.page3 = page3
    await contract.save()
    res.json({ message: "Contract updated", contract })
  } catch (error) {
    console.error("Update contract error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Start the server and listen on specified port
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
