const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const Admin = require("./models/Admin");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/testdb");

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("MongoDB Connected"));

// Seed admin (only runs if no admin exists)
(async () => {
  const existing = await Admin.findOne({ username: "admin" });
  if (!existing) {
    const hashed = await bcrypt.hash("password123", 10);
    await Admin.create({ username: "admin", password: hashed });
    console.log("👤 Default admin created (username: admin, password: password123)");
  }
})();

// Routes
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(400).json({ message: "Invalid username" });

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid password" });

  res.json({ message: "Login successful" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));