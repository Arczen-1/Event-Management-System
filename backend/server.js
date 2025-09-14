const express = require("express")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const cors = require("cors")
const Admin = require("./models/Admin")
const User = require("./models/User")

const app = express()
const PORT = 5000

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/testdb")

const db = mongoose.connection
db.on("error", console.error.bind(console, "MongoDB connection error:"))
db.once("open", () => console.log("MongoDB Connected"))

// Seed admin (only runs if no admin exists)
;(async () => {
  const existing = await Admin.findOne({ username: "admin" })
  if (!existing) {
    const hashed = await bcrypt.hash("password123", 10)
    await Admin.create({ username: "admin", password: hashed })
    console.log("👤 Default admin created (username: admin, password: password123)")
  }
})()

// Routes
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body

    // Check admin first
    const admin = await Admin.findOne({ username })
    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password)
      if (!isMatch) return res.status(400).json({ message: "Invalid password" })
      return res.json({ message: "Login successful", user: { username: admin.username, role: admin.role } })
    }

    // Check users
    const user = await User.findOne({ username, status: "approved" })
    if (!user) return res.status(400).json({ message: "Invalid username or account not approved" })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ message: "Invalid password" })

    res.json({ message: "Login successful", user: { username: user.username, role: user.role } })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Registration endpoint
app.post("/register", async (req, res) => {
  try {
    const { username, fullName, password, email } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] })
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const user = new User({
      username,
      fullName,
      password: hashedPassword,
      email,
      status: "pending",
    })

    await user.save()
    res.json({ message: "Registration successful. Waiting for admin approval." })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get pending users (admin only)
app.get("/admin/pending-users", async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: "pending" }).select("-password")
    res.json(pendingUsers)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Approve user with role (admin only)
app.put("/admin/approve-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = req.body

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" })
    }

    // Validate role is provided
    if (!role) {
      return res.status(400).json({ message: "Role is required" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if user is already approved
    if (user.status === "approved") {
      return res.status(400).json({ message: "User is already approved" })
    }

    user.role = role
    user.status = "approved"
    await user.save()

    res.json({
      message: "User approved successfully",
      user: { id: user._id, username: user.username, role: user.role },
    })
  } catch (error) {
    console.error("Approve user error:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
})

// Reject user (admin only) - Delete the user account
app.put("/admin/reject-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if user is pending
    if (user.status !== "pending") {
      return res.status(400).json({ message: "Only pending users can be rejected" })
    }

    // Delete the user account completely
    await User.findByIdAndDelete(userId)

    res.json({ message: "User account rejected and removed successfully" })
  } catch (error) {
    console.error("Reject user error:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
})

// Assign role to user (admin only)
app.put("/admin/assign-role/:userId", async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = req.body

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" })
    }

    // Validate role is provided
    if (!role) {
      return res.status(400).json({ message: "Role is required" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.role = role
    await user.save()

    res.json({
      message: "Role assigned successfully",
      user: { id: user._id, username: user.username, role: user.role },
    })
  } catch (error) {
    console.error("Assign role error:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
})

// Get all users (admin only)
app.get("/admin/users", async (req, res) => {
  try {
    const users = await User.find().select("-password")
    res.json(users)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete user (admin only)
app.delete("/admin/delete-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    await User.findByIdAndDelete(userId)
    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
