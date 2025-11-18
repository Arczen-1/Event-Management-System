import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import cors from "cors";
import Admin from "./models/Admin.js";
import User from "./models/User.js";
import Contract from "./models/Contract.js";
import Counter from "./models/Counter.js";
import CreativeRequest from "./models/CreativeRequest.js";
import { fetchCreativeSheetData } from "./gsheetshelper3.js";

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
// Banquet Staff Routes
app.get('/banquet/staff-assignments', async (req, res) => {
  try {
    // This would fetch from a staff_assignments collection
    const assignments = await db.collection('staff_assignments').find({}).toArray();
    res.json({ success: true, assignments });
  } catch (error) {
    console.error('Get staff assignments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch staff assignments' });
  }
});

app.get('/banquet/equipment-requests', async (req, res) => {
  try {
    // This would fetch from an equipment_requests collection
    const requests = await db.collection('equipment_requests').find({}).toArray();
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get equipment requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch equipment requests' });
  }
});

app.put('/banquet/assignments/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('staff_assignments').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'completed', completedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    
    res.json({ success: true, message: 'Assignment marked as complete' });
  } catch (error) {
    console.error('Mark assignment complete error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark assignment as complete' });
  }
});

app.post('/banquet/equipment-requests', async (req, res) => {
  try {
    const { eventId, equipment, requestedBy } = req.body;
    
    const requestData = {
      eventId: new ObjectId(eventId),
      equipment,
      requestedBy,
      status: 'pending',
      requestDate: new Date()
    };
    
    const result = await db.collection('equipment_requests').insertOne(requestData);
    
    res.status(201).json({
      success: true,
      message: 'Equipment request submitted',
      request: { _id: result.insertedId, ...requestData }
    });
  } catch (error) {
    console.error('Create equipment request error:', error);
    res.status(500).json({ success: false, message: 'Failed to create equipment request' });
  }
});

// ==================== FINANCE/INVOICE ROUTES ====================
// If you already have this:
// Change it to:
import { MongoClient, ObjectId } from 'mongodb';
// In server.js - make sure this route exists
app.post('/finance/invoices', async (req, res) => {
  try {
    const {
      contractId,
      invoiceNumber,
      contractNumber,
      client,
      issueDate,
      dueDate,
      items,
      totalAmount,
      status
    } = req.body;

    console.log("Received invoice data:", req.body);

    // Validate required fields
    if (!contractId || !invoiceNumber || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: contractId, invoiceNumber, or totalAmount'
      });
    }

    // Check if invoice number already exists
    const existingInvoice = await db.collection('invoices')
      .findOne({ invoiceNumber });
    
    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number already exists'
      });
    }

    const invoiceData = {
      contractId: new ObjectId(contractId), // Convert to ObjectId
      invoiceNumber,
      contractNumber,
      client,
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      items: items || [],
      totalAmount: parseFloat(totalAmount),
      status: status || 'pending',
      createdAt: new Date(),
      paidDate: null
    };

    console.log("Inserting invoice:", invoiceData);

    const result = await db.collection('invoices').insertOne(invoiceData);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice: {
        _id: result.insertedId,
        ...invoiceData
      }
    });

  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice'
    });
  }
});
// Add finance department data route
app.get('/admin/department-data/finance', async (req, res) => {
  try {
    // Get financial statistics
    const invoices = await db.collection('invoices').find({}).toArray();
    
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    
    const pendingRevenue = invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const unpaidInvoices = invoices.filter(inv => inv.status === 'pending').length;
    
    const overdueInvoices = invoices.filter(inv => 
      inv.status === 'pending' && new Date(inv.dueDate) < new Date()
    ).length;

    // Get active contracts count
    const activeContracts = await db.collection('contracts')
      .find({ 
        $or: [
          { status: "Active" },
          { status: "For Accounting Review" }
        ]
      })
      .toArray();

    const financeData = {
      totalRevenue,
      pendingRevenue,
      paidCount: paidInvoices,
      unpaidCount: unpaidInvoices,
      overdueCount: overdueInvoices,
      activeContractsCount: activeContracts.length,
      description: "Financial management and invoice tracking system"
    };

    res.json({
      success: true,
      data: financeData,
      description: "Financial management and invoice tracking system"
    });

  } catch (error) {
    console.error('Finance department data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch finance department data'
    });
  }
});
// Get all invoices
app.get('/finance/invoices', async (req, res) => {
  try {
    const invoices = await db.collection('invoices').find({}).toArray();
    
    // Format the response
    const formattedInvoices = invoices.map(invoice => ({
      _id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      contractId: invoice.contractId,
      contractNumber: invoice.contractNumber,
      client: invoice.client,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      items: invoice.items || [],
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      createdAt: invoice.createdAt,
      paidDate: invoice.paidDate
    }));

    res.json({ 
      success: true, 
      invoices: formattedInvoices 
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch invoices' 
    });
  }
});

// Generate next invoice number
app.get('/finance/invoices/generate-number', async (req, res) => {
  try {
    // Find the highest invoice number
    const lastInvoice = await db.collection('invoices')
      .find({})
      .sort({ invoiceNumber: -1 })
      .limit(1)
      .toArray();

    let nextNumber = 'INV-00001';
    
    if (lastInvoice.length > 0 && lastInvoice[0].invoiceNumber) {
      const lastNumber = lastInvoice[0].invoiceNumber;
      const numberPart = parseInt(lastNumber.split('-')[1]);
      nextNumber = `INV-${String(numberPart + 1).padStart(5, '0')}`;
    }

    res.json({ 
      success: true, 
      invoiceNumber: nextNumber 
    });
  } catch (error) {
    console.error('Generate invoice number error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate invoice number' 
    });
  }
});

// Create new invoice
app.post('/finance/invoices', async (req, res) => {
  try {
    const {
      contractId,
      invoiceNumber,
      contractNumber,
      client,
      issueDate,
      dueDate,
      items,
      totalAmount,
      status
    } = req.body;

    // Validate required fields
    if (!contractId || !invoiceNumber || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if invoice number already exists
    const existingInvoice = await db.collection('invoices')
      .findOne({ invoiceNumber });
    
    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number already exists'
      });
    }

    const invoiceData = {
      contractId,
      invoiceNumber,
      contractNumber,
      client,
      issueDate,
      dueDate,
      items: items || [],
      totalAmount: parseFloat(totalAmount),
      status: status || 'pending',
      createdAt: new Date(),
      paidDate: null
    };

    const result = await db.collection('invoices').insertOne(invoiceData);

    // Update contract to mark as invoiced
    await db.collection('contracts').updateOne(
      { _id: new ObjectId(contractId) },
      { 
        $set: { 
          hasInvoice: true,
          lastInvoiceDate: new Date()
        } 
      }
    );

    // Add to recent activity
    await db.collection('recent_activity').insertOne({
      type: 'invoice_created',
      description: `Invoice ${invoiceNumber} created for ${client}`,
      timestamp: new Date(),
      user: 'System' // or get from auth if available
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice: {
        _id: result.insertedId,
        ...invoiceData
      }
    });

  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice'
    });
  }
});

// Mark invoice as paid
app.put('/finance/invoices/:id/mark-paid', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.collection('invoices').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'paid',
          paidDate: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Get the updated invoice to log activity
    const updatedInvoice = await db.collection('invoices')
      .findOne({ _id: new ObjectId(id) });

    // Add to recent activity
    await db.collection('recent_activity').insertOne({
      type: 'invoice_paid',
      description: `Invoice ${updatedInvoice.invoiceNumber} marked as paid`,
      timestamp: new Date(),
      user: 'System'
    });

    res.json({
      success: true,
      message: 'Invoice marked as paid successfully'
    });

  } catch (error) {
    console.error('Mark invoice as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark invoice as paid'
    });
  }
});

// Get invoice by ID
app.get('/finance/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await db.collection('invoices')
      .findOne({ _id: new ObjectId(id) });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice'
    });
  }
});

// Update invoice
app.put('/finance/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = await db.collection('invoices').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice updated successfully'
    });

  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice'
    });
  }
});

// Delete invoice
app.delete('/finance/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.collection('invoices').deleteOne(
      { _id: new ObjectId(id) }
    );

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });

  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invoice'
    });
  }
});

// Get financial statistics
app.get('/finance/statistics', async (req, res) => {
  try {
    const invoices = await db.collection('invoices').find({}).toArray();
    
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    const pendingRevenue = invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const unpaidInvoices = invoices.filter(inv => inv.status === 'pending').length;
    
    const overdueInvoices = invoices.filter(inv => 
      inv.status === 'pending' && new Date(inv.dueDate) < new Date()
    ).length;

    // Monthly revenue data for charts
    const monthlyRevenue = {};
    invoices
      .filter(inv => inv.status === 'paid' && inv.paidDate)
      .forEach(inv => {
        const monthYear = new Date(inv.paidDate).toLocaleString('default', { 
          month: 'short', 
          year: 'numeric' 
        });
        monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + inv.totalAmount;
      });

    res.json({
      success: true,
      statistics: {
        totalRevenue,
        pendingRevenue,
        paidInvoices,
        unpaidInvoices,
        overdueInvoices,
        monthlyRevenue
      }
    });

  } catch (error) {
    console.error('Get financial statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial statistics'
    });
  }
});

// Get invoices for a specific contract
app.get('/finance/contracts/:contractId/invoices', async (req, res) => {
  try {
    const { contractId } = req.params;
    
    const invoices = await db.collection('invoices')
      .find({ contractId: new ObjectId(contractId) })
      .toArray();

    res.json({
      success: true,
      invoices
    });
  } catch (error) {
    console.error('Get contract invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contract invoices'
    });
  }
});

// Get overdue invoices
app.get('/finance/invoices/overdue', async (req, res) => {
  try {
    const overdueInvoices = await db.collection('invoices')
      .find({ 
        status: 'pending',
        dueDate: { $lt: new Date() }
      })
      .toArray();

    res.json({
      success: true,
      invoices: overdueInvoices
    });
  } catch (error) {
    console.error('Get overdue invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue invoices'
    });
  }
});

// ==================== GOOGLE SHEETS HELPER ====================

import { fetchMonitoringData, getSheetsClient, SPREADSHEET_ID } from "./googleSheetsHelper.js";


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


// ==================== FABRICATION REQUEST ROUTES ====================

import FabricationRequest from "./models/fabricationRequest.js";

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


import { google } from "googleapis";
import fs from "fs";

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
// ==================== INVENTORY CRUD ROUTES ====================

// Inventory Schema - For MongoDB fallback
const InventorySchema = new mongoose.Schema({
  "Item Id": { type: String, required: true },
  "Item Name": { type: String, required: true },
  "Category": { type: String, required: true },
  "Unit": { type: String, required: true },
  "Quantity": { type: Number, required: true, default: 0 },
  "Minimum Stock": { type: Number, default: 5 },
  "Department": { type: String, required: true },
  "Status": { type: String, default: "Active" },
  "Last Updated": { type: Date, default: Date.now }
}, { 
  collection: 'inventory',
  strict: false 
});

const Inventory = mongoose.model('Inventory', InventorySchema);

// GET /inventory - Get inventory from Google Sheets, fallback to MongoDB
app.get("/inventory", async (req, res) => {
  try {
    const { department } = req.query;
    
    // First try to get from Google Sheets
    try {
      const sheets = await getSheetsClient();
      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "All Inventory!A:Z", // Adjust range based on your sheet structure
      });

      let rows = resp.data.values || [];
      
      // Remove empty rows
      rows = rows.filter(row => row.some(cell => cell && cell.trim() !== ""));
      
      if (rows.length >= 2) { // Has headers and at least one data row
        const headers = rows[0]; // First row is headers
        const data = rows.slice(1); // Data starts from second row
        
        // Map to your desired structure
        const items = data.map(row => {
          const item = {
            "Item Id": row[0] || "",
            "Item Name": row[1] || "",
            "Category": row[2] || "",
            "Unit": row[3] || "",
            "Quantity": parseInt(row[4]) || 0,
            "Department": row[5] || "warehouse",
            "Minimum Stock": 5, // Default value
            "Status": "Active"
          };
          return item;
        });

        // Filter by department if specified
        let filteredItems = items;
        if (department && department !== "") {
          filteredItems = items.filter(item => 
            item.Department.toLowerCase() === department.toLowerCase()
          );
        }

        return res.json(filteredItems);
      }
    } catch (sheetsError) {
      console.log("Google Sheets inventory not available, falling back to MongoDB");
    }

    // Fallback to MongoDB
    let query = {};
    if (department && department !== "") {
      query.Department = department;
    }

    const mongoInventory = await Inventory.find(query).sort({ "Item Name": 1 });
    res.json(mongoInventory);

  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ message: "Server error fetching inventory" });
  }
});

// POST /inventory - Create new inventory item (saves to MongoDB)
app.post("/inventory", async (req, res) => {
  try {
    const itemId = req.body["Item Id"];
    const itemName = req.body["Item Name"];
    const category = req.body["Category"];
    const unit = req.body["Unit"];
    const quantity = req.body["Quantity"];
    const department = req.body["Department"];

    if (!itemId || !itemName || !category || !unit || !quantity || !department) {
      return res.status(400).json({ 
        message: "Missing required fields: Item Id, Item Name, Category, Unit, Quantity, Department" 
      });
    }

    // Check if item ID already exists
    const existingItem = await Inventory.findOne({ "Item Id": itemId });
    if (existingItem) {
      return res.status(400).json({ 
        message: "Item ID already exists" 
      });
    }

    const inventoryItem = new Inventory({
      "Item Id": itemId,
      "Item Name": itemName,
      "Category": category,
      "Unit": unit,
      "Quantity": parseInt(quantity) || 0,
      "Minimum Stock": 5,
      "Department": department,
      "Status": "Active",
      "Last Updated": new Date()
    });

    await inventoryItem.save();
    
    res.status(201).json({ 
      message: "Inventory item created successfully", 
      item: inventoryItem 
    });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    res.status(500).json({ message: "Server error creating inventory item: " + error.message });
  }
});

// PUT /inventory/:id - Update inventory item in MongoDB
app.put("/inventory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid inventory item ID" });
    }

    const updateData = {
      ...req.body,
      "Last Updated": new Date()
    };

    // Convert quantity to number if it exists
    if (updateData.Quantity) {
      updateData.Quantity = parseInt(updateData.Quantity);
    }

    // Ensure Minimum Stock is always 5
    updateData["Minimum Stock"] = 5;

    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.json({ 
      message: "Inventory item updated successfully", 
      item: updatedItem 
    });
  } catch (error) {
    console.error("Error updating inventory item:", error);
    res.status(500).json({ message: "Server error updating inventory item" });
  }
});

// DELETE /inventory/:id - Delete inventory item from MongoDB
app.delete("/inventory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid inventory item ID" });
    }

    const deletedItem = await Inventory.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.json({ message: "Inventory item deleted successfully" });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    res.status(500).json({ message: "Server error deleting inventory item" });
  }
});

// GET /inventory/stats - Get inventory statistics
app.get("/inventory/stats", async (req, res) => {
  try {
    const { department } = req.query;
    
    // Try to get from Google Sheets first
    try {
      const items = await getInventoryFromSheets(department);
      
      const totalItems = items.length;
      const lowStockItems = items.filter(item => item.Quantity <= 5).length;
      const outOfStockItems = items.filter(item => item.Quantity <= 0).length;

      return res.json({
        totalItems,
        lowStockItems,
        outOfStockItems
      });
    } catch (sheetsError) {
      console.log("Using MongoDB for stats");
    }

    // Fallback to MongoDB
    let query = {};
    if (department && department !== "") {
      query.Department = department;
    }

    const totalItems = await Inventory.countDocuments(query);
    const lowStockItems = await Inventory.countDocuments({
      ...query,
      Quantity: { $lte: 5 }
    });
    const outOfStockItems = await Inventory.countDocuments({
      ...query,
      Quantity: { $lte: 0 }
    });

    res.json({
      totalItems,
      lowStockItems,
      outOfStockItems
    });
  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    res.status(500).json({ message: "Server error fetching inventory stats" });
  }
});

// Helper function to get inventory from Google Sheets
async function getInventoryFromSheets(department = "") {
  try {
    const sheets = await getSheetsClient();
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "'All Inventory'!A:F",
    });

    let rows = resp.data.values || [];
    rows = rows.filter(row => row.some(cell => cell && cell.trim() !== ""));
    
    if (rows.length < 2) return [];

    const data = rows.slice(1);
    const items = data.map(row => ({
      "Item Id": row[0] || "",
      "Item Name": row[1] || "",
      "Category": row[2] || "",
      "Unit": row[3] || "",
      "Quantity": parseInt(row[4]) || 0,
      "Department": row[5],
      "Minimum Stock": 5,
      "Status": "Active"
    }));

    if (department && department !== "") {
      return items.filter(item => 
        item.Department.toLowerCase() === department.toLowerCase()
      );
    }

    return items;
  } catch (error) {
    throw error;
  }
}

  
// ==================== ADMIN DASHBOARD STATS ENDPOINTS ====================

// GET /admin/dashboard-stats - Get comprehensive stats for admin dashboard
// GET /admin/dashboard-stats - Get comprehensive stats for admin dashboard
app.get("/admin/dashboard-stats", async (req, res) => {
  try {
    // Get all contracts count
    const totalContracts = await Contract.countDocuments();
    
    // Get active contracts count
    const activeContracts = await Contract.countDocuments({ status: "Active" });
    
    // Get all users count
    const totalUsers = await User.countDocuments({ status: "approved" });
    
    // Get pending approvals count
    const pendingApprovals = await User.countDocuments({ status: "pending" });

    // Get department-specific inventory counts
    let departmentInventory = {
      creative: 0,
      warehouse: 0,
      linen: 0,
      stockroom: 0
    };

    try {
      // Try to get from Google Sheets first
      const sheets = await getSheetsClient();
      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "All inventory!A:Z",
      });

      let rows = resp.data.values || [];
      rows = rows.filter(row => row.some(cell => cell && cell.trim() !== ""));
      
      if (rows.length >= 2) {
        const data = rows.slice(1);
        
        // Count items by department
        data.forEach(row => {
          const department = (row[5]).toLowerCase();
          if (departmentInventory.hasOwnProperty(department)) {
            departmentInventory[department]++;
          }
        });
      }
    } catch (sheetsError) {
      console.log("Using MongoDB for department inventory counts");
      // Fallback to MongoDB
      const departmentCounts = await Inventory.aggregate([
        {
          $group: {
            _id: "$Department",
            count: { $sum: 1 }
          }
        }
      ]);

      departmentCounts.forEach(dept => {
        const department = dept._id.toLowerCase();
        if (departmentInventory.hasOwnProperty(department)) {
          departmentInventory[department] = dept.count;
        }
      });
    }

    // Get total inventory count (sum of all departments)
    const totalInventory = Object.values(departmentInventory).reduce((sum, count) => sum + count, 0);

    res.json({
      totalContracts,
      totalUsers,
      totalInventory,
      departmentInventory, // Add department-specific counts
      activeEvents: activeContracts,
      pendingApprovals,
      recentActivity: {
        newContracts: 0, // You can update this if needed
        newUsers: 0      // You can update this if needed
      }
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    res.status(500).json({ message: "Server error fetching dashboard stats" });
  }
});
// POST /post-event-checklist


import Checklist from './models/Checklist.js';
// GET /checklists/contract/:contractId/status
app.get('/checklists/contract/:contractId/status', async (req, res) => {
  try {
    const { contractId } = req.params;
    
    // Get all checklists for this contract
    const checklists = await Checklist.find({ contractId });
    
    const departments = ['creative', 'linen', 'warehouse'];
    const submittedDepartments = checklists.map(cl => cl.department);
    
    const allDepartmentsCompleted = departments.every(dept => 
      submittedDepartments.includes(dept)
    );
    
    res.json({
      contractId,
      submittedDepartments,
      allDepartmentsCompleted,
      missingDepartments: departments.filter(dept => !submittedDepartments.includes(dept))
    });
    
  } catch (error) {
    console.error('Error checking department status:', error);
    res.status(500).json({ message: 'Server error while checking department status' });
  }
});

// PUT /contracts/:id/complete (to be called when all departments are done)
app.put('/contracts/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await mongoose.connection.collection('contracts').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { 
        $set: { 
          status: 'Completed',
          completedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    res.json({ 
      message: 'Contract marked as completed',
      status: 'Completed'
    });

  } catch (error) {
    console.error('Error completing contract:', error);
    res.status(500).json({ message: 'Server error while completing contract' });
  }
});
// POST /post-event-checklist
// POST /post-event-checklist

app.get('/api/logistics/calendar', (req, res) => {
  // Return calendar data - you can integrate with Google Calendar API
  res.json({
    calendarEmbedURL: "https://calendar.google.com/calendar/embed?src=your_calendar_id&ctz=Asia%2FManila",
    events: []
  });
});

app.get('/api/logistics/bookings', (req, res) => {
  // Return logistics bookings
  res.json({
    bookings: []
  });
});

app.get('/api/logistics/drivers', (req, res) => {
  // Return available drivers
  res.json({
    drivers: [
      { id: 1, name: "John Smith", license: "DL12345", status: "available" },
      { id: 2, name: "Mike Johnson", license: "DL67890", status: "available" },
      { id: 3, name: "David Wilson", license: "DL11223", status: "available" }
    ]
  });
});

app.get('/api/logistics/trucks', (req, res) => {
  // Return available trucks
  res.json({
    trucks: [
      { id: 1, name: "Truck A", plate: "ABC123", capacity: "Large", status: "available" },
      { id: 2, name: "Truck B", plate: "DEF456", capacity: "Medium", status: "available" },
      { id: 3, name: "Van C", plate: "GHI789", capacity: "Small", status: "available" }
    ]
  });
});

app.post('/api/logistics/assignments', (req, res) => {
  // Save driver and truck assignments
  const { eventId, contractNumber, driver, truck, notes, assignedBy } = req.body;
  
  // Save to database (you'll need to implement this)
  console.log('Saving assignment:', { eventId, contractNumber, driver, truck, notes, assignedBy });
  
  res.json({ 
    success: true, 
    message: "Assignment saved successfully",
    assignment: req.body
  });
});

// Get all venue locations from contracts
app.get('/api/logistics/venues', (req, res) => {
  // This would query your contracts collection and return unique venues
  res.json({
    venues: [
      "Manila Hotel, Manila",
      "Sofitel Philippine Plaza, Pasay City",
      "The Peninsula Manila, Makati",
      "Makati Shangri-La, Makati",
      "Okada Manila, Parañaque"
    ]
  });
});
app.post('/post-event-checklist', async (req, res) => {
  try {
    const { contractId, department } = req.body;

    // Check if checklist already exists for this contract and department
    const existingChecklist = await Checklist.findOne({ 
      contractId, 
      department 
    });

    if (existingChecklist) {
      return res.status(400).json({ 
        message: `A ${department} checklist already exists for this contract. Use the edit functionality instead.` 
      });
    }

    // ... rest of your existing POST logic
  } catch (error) {
    console.error('Error submitting checklist:', error);
    res.status(500).json({ message: 'Server error while submitting checklist' });
  }
});

// GET /post-event-checklists
app.get('/post-event-checklists', async (req, res) => {
  try {
    const checklists = await Checklist.find({})
      .sort({ createdAt: -1 });

    res.json(checklists);

  } catch (error) {
    console.error('Error fetching checklists:', error);
    res.status(500).json({ message: 'Server error while fetching checklists' });
  }
});

// PUT /contracts/:id/status
app.put('/contracts/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const db = req.app.locals.db;
    
    const result = await db.collection('contracts').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    res.json({ 
      message: 'Contract status updated successfully',
      status 
    });

  } catch (error) {
    console.error('Error updating contract status:', error);
    res.status(500).json({ message: 'Server error while updating contract status' });
  }
});


app.put('/fabrication-requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    if (!approvedBy) {
      return res.status(400).json({ message: 'Approved by field is required' });
    }

    const db = getDB();
    const fabricationRequestsCollection = db.collection('fabrication_requests');

    const request = await fabricationRequestsCollection.findOne({ _id: new ObjectId(id) });

    if (!request) {
      return res.status(404).json({ message: 'Fabrication request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be approved' });
    }

    const result = await fabricationRequestsCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'approved',
          approvedBy,
          approvedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );

    res.json({ 
      message: 'Fabrication request approved successfully',
      status: 'approved'
    });

  } catch (error) {
    console.error('Error approving fabrication request:', error);
    res.status(500).json({ message: 'Server error while approving request' });
  }
});

app.put('/fabrication-requests/:id/received', async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedBy } = req.body;

    if (!receivedBy) {
      return res.status(400).json({ message: 'Received by field is required' });
    }

    const db = getDB();
    const fabricationRequestsCollection = db.collection('fabrication_requests');
    const inventoryCollection = db.collection('inventory');

    const request = await fabricationRequestsCollection.findOne({ _id: new ObjectId(id) });

    if (!request) {
      return res.status(404).json({ message: 'Fabrication request not found' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved requests can be marked as received' });
    }

    // Update inventory quantity
    const inventoryUpdate = await inventoryCollection.updateOne(
      { 
        $or: [
          { _id: new ObjectId(request.itemId) },
          { "Item Id": request.itemId }
        ]
      },
      { 
        $inc: { Quantity: parseInt(request.quantity) },
        $set: { updatedAt: new Date() }
      }
    );

    if (inventoryUpdate.matchedCount === 0) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Update request status
    const result = await fabricationRequestsCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'completed',
          receivedBy,
          receivedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );

    res.json({ 
      message: 'Items received and inventory updated successfully',
      status: 'completed'
    });

  } catch (error) {
    console.error('Error marking request as received:', error);
    res.status(500).json({ message: 'Server error while updating request' });
  }
});

app.get('/fabrication-requests', async (req, res) => {
  try {
    const db = getDB();
    const fabricationRequestsCollection = db.collection('fabrication_requests');

    const requests = await fabricationRequestsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json(requests);

  } catch (error) {
    console.error('Error fetching fabrication requests:', error);
    res.status(500).json({ message: 'Server error while fetching requests' });
  }
});
app.post('/fabrication-requests', async (req, res) => {
  try {
    const { username, item, itemId, quantity, remarks, requestType, currentStock, department } = req.body;

    // Validate required fields
    if (!username || !item || !quantity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const db = getDB();
    const fabricationRequestsCollection = db.collection('fabrication_requests');

    const requestData = {
      username,
      item,
      itemId: itemId || null,
      quantity: parseInt(quantity),
      remarks: remarks || '',
      requestType: requestType || 'restock',
      currentStock: parseInt(currentStock) || 0,
      department: department || 'creative',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await fabricationRequestsCollection.insertOne(requestData);

    res.status(201).json({
      message: 'Fabrication request created successfully',
      requestId: result.insertedId
    });

  } catch (error) {
    console.error('Error creating fabrication request:', error);
    res.status(500).json({ message: 'Server error while creating request' });
  }
});

// GET /admin/contracts-overview - Get contracts for admin contracts view
app.get("/admin/contracts-overview", async (req, res) => {
  try {
    const contracts = await Contract.find()
      .sort({ createdAt: -1 })
      .select("contractNumber page1 page3 status createdAt")
      .limit(50); // Limit to recent 50 contracts

    const formattedContracts = contracts.map(contract => ({
      id: contract._id,
      name: (contract.page1 && (contract.page1.contractName || contract.page1.occasion)) || "Contract",
      client: (contract.page1 && contract.page1.celebratorName) || "",
      value: (contract.page3 && contract.page3.grandTotal) || "",
      startDate: (contract.page1 && contract.page1.eventDate) || "",
      status: contract.status,
      contractNumber: contract.contractNumber,
    }));

    res.json({ contracts: formattedContracts });
  } catch (error) {
    console.error("Admin contracts overview error:", error);
    res.status(500).json({ message: "Server error fetching contracts overview" });
  }
});

// GET /admin/department-data/:department - Get data for specific department view
app.get("/admin/department-data/:department", async (req, res) => {
  try {
    const { department } = req.params;
    
    switch (department.toLowerCase()) {
      case "creative":
        // Get creative requests data
        const creativeRequests = await CreativeRequest.find()
          .sort({ createdAt: -1 })
          .limit(20);
        res.json({ 
          department: "Creative",
          data: creativeRequests,
          description: "Creative department requests and materials"
        });
        break;

      case "warehouse":
        // Get warehouse inventory data
        try {
          const inventoryData = await fetchMonitoringData();
          res.json({
            department: "Warehouse",
            data: inventoryData,
            description: "Warehouse inventory and stock management"
          });
        } catch (inventoryErr) {
          res.json({
            department: "Warehouse",
            data: [],
            description: "Warehouse inventory and stock management",
            error: "Unable to fetch inventory data"
          });
        }
        break;

      case "linen":
        // Get linen inventory data
        const linenInventory = await LinenInventory.find();
        res.json({
          department: "Linen",
          data: linenInventory,
          description: "Linen inventory and management"
        });
        break;

      case "finance":
        // Get finance overview
        const unpaidFinance = await Finance.countDocuments({ status: "Unpaid" });
        const paidFinance = await Finance.countDocuments({ status: "Paid" });
        const totalRevenue = await Finance.aggregate([
          { $match: { status: "Paid" } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        
        res.json({
          department: "Finance",
          data: {
            unpaidCount: unpaidFinance,
            paidCount: paidFinance,
            totalRevenue: totalRevenue[0]?.total || 0
          },
          description: "Financial overview and revenue tracking"
        });
        break;

      case "events":
        // Get upcoming events (active contracts)
        const upcomingEvents = await Contract.find({ status: "Active" })
          .sort({ "page1.eventDate": 1 })
          .select("contractNumber page1 page3")
          .limit(20);
        
        res.json({
          department: "Events",
          data: upcomingEvents,
          description: "Upcoming events and active contracts"
        });
        break;

      default:
        res.status(400).json({ message: "Invalid department specified" });
    }
  } catch (error) {
    console.error(`Admin department data error for ${req.params.department}:`, error);
    res.status(500).json({ message: "Server error fetching department data" });
  }
});

// GET /admin/recent-activity - Get recent system activity
app.get("/admin/recent-activity", async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get recent contracts
    const recentContracts = await Contract.find({
      createdAt: { $gte: oneWeekAgo }
    })
    .sort({ createdAt: -1 })
    .select("contractNumber page1 status createdAt")
    .limit(10);

    // Get recent user registrations
    const recentUsers = await User.find({
      createdAt: { $gte: oneWeekAgo },
      status: "approved"
    })
    .sort({ createdAt: -1 })
    .select("username fullName role createdAt")
    .limit(10);

    // Get recent creative requests
    const recentCreativeRequests = await CreativeRequest.find({
      createdAt: { $gte: oneWeekAgo }
    })
    .sort({ createdAt: -1 })
    .select("requestName contractNo status createdAt")
    .limit(10);

    const activity = [
      ...recentContracts.map(contract => ({
        type: "contract",
        icon: "📋",
        text: `New contract created: ${contract.page1?.occasion || "Contract"}`,
        time: contract.createdAt
      })),
      ...recentUsers.map(user => ({
        type: "user",
        icon: "👥",
        text: `New user registered: ${user.fullName} (${user.role})`,
        time: user.createdAt
      })),
      ...recentCreativeRequests.map(request => ({
        type: "creative",
        icon: "🎨",
        text: `Creative request submitted: ${request.requestName}`,
        time: request.createdAt
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time))
     .slice(0, 10); // Get top 10 most recent

    res.json({ activity });
  } catch (error) {
    console.error("Admin recent activity error:", error);
    res.status(500).json({ message: "Server error fetching recent activity" });
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

function validateContractFullyFilled(contract) {
  const errors = [];

  // Example validation for page1
  if (!contract.page1 || !contract.page1.occasion) errors.push("Contract Name is missing");
  if (!contract.page1 || !contract.page1.celebratorName) errors.push("Client/Celebrator Name is missing");
  if (!contract.page1 || !contract.page1.eventDate) errors.push("Event Date is missing");

  // Example validation for page3 (financials)
  if (!contract.page3 || !contract.page3.grandTotal) errors.push("Grand Total is missing");

  return errors;
}

// POST /contracts - Create a new contract with auto-generated number
app.post("/contracts", async (req, res) => {
  try {
    const { department = "Sales", status = "Draft", page1 = {}, page2 = {}, pageBuffet = {}, page3 = {} } = req.body

    // If status is "For Approval", validate required fields
    if (status === "For Approval") {
      const tempContract = { page1, page2, pageBuffet, page3 };
      const validationErrors = validateContractForApproval(tempContract);
      if (validationErrors.length > 0) {
        return res.status(400).json({ message: "Contract must be fully filled before sending for approval:\n\n" + validationErrors.join("\n") });
      }
    }

    const contractNumber = await generateNextContractNumber(new Date())

    const contract = await Contract.create({
      contractNumber,
      department,
      status,
      page1,
      page2,
      pageBuffet,
      page3,
    })

    res.json({ message: "Contract created", contract })
  } catch (error) {
    console.error("Create contract error:", error)
    if (error.code === 11000) {
      // Rare race: regenerate and retry once
      try {
        const contractNumber = await generateNextContractNumber(new Date())
        const { department = "Sales", status = "Draft", page1 = {}, page2 = {}, pageBuffet = {}, page3 = {} } = req.body
        // Re-validate if needed
        if (status === "For Approval") {
          const tempContract = { page1, page2, pageBuffet, page3 };
          const validationErrors = validateContractForApproval(tempContract);
          if (validationErrors.length > 0) {
            return res.status(400).json({ message: "Contract must be fully filled before sending for approval:\n\n" + validationErrors.join("\n") });
          }
        }
        const contract = await Contract.create({ contractNumber, department, status, page1, page2, pageBuffet, page3 })
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

// PUT /contracts/:id - Update a contract (allowed while Draft or Rejected)
app.put("/contracts/:id", async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid contract id" })
    const { page1 = {}, page2 = {}, pageBuffet = {}, page3 = {}, status, rejectionReason } = req.body
    const contract = await Contract.findById(id)
    if (!contract) return res.status(404).json({ message: "Not found" })
    if (!["Draft", "Rejected"].includes(contract.status)) return res.status(400).json({ message: "Only Draft or Rejected contracts can be edited" })

    // Update the fields
    contract.page1 = page1
    contract.page2 = page2
    contract.pageBuffet = pageBuffet
    contract.page3 = page3
    if (rejectionReason !== undefined) contract.rejectionReason = rejectionReason

    // If status is being set to "For Approval", validate required fields
    if (status === "For Approval") {
      const validationErrors = validateContractForApproval(contract);
      if (validationErrors.length > 0) {
        return res.status(400).json({ message: "Contract must be fully filled before sending for approval:\n\n" + validationErrors.join("\n") });
      }
      contract.status = status
    } else if (status) {
      contract.status = status
    }

    await contract.save()
    res.json({ message: "Contract updated", contract })
  } catch (error) {
    console.error("Update contract error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// PUT /contracts/:id/approve - Approve a contract (Sales Manager only)
app.put("/contracts/:id/approve", async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid contract id" })
    const contract = await Contract.findById(id)
    if (!contract) return res.status(404).json({ message: "Not found" })
    if (contract.status !== "For Approval") return res.status(400).json({ message: "Only contracts with 'For Approval' status can be approved" })
    
    contract.status = "For Accounting Review"
    await contract.save()
    res.json({ message: "Contract approved and sent to Accounting", contract })
  } catch (error) {
    console.error("Approve contract error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.put("/contracts/:id/reject", async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    console.log("Received reject request for ID:", id); // Debug log
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid ObjectId format for ID:", id); // Debug log
      return res.status(400).json({ message: "Invalid contract id" })
    }
    const contract = await Contract.findById(id)
    if (!contract) return res.status(404).json({ message: "Not found" })
    console.log(`Reject request for contract ${id} with current status: '${contract.status}'`)  // Added quotes for debug
    if (contract.status.trim().toLowerCase() !== "for approval") return res.status(400).json({ message: "Only contracts with 'For Approval' status can be rejected" })

    contract.status = "Rejected"
    contract.rejectionReason = reason || ""
    await contract.save()
    res.json({ message: "Contract rejected and status set to Rejected", contract })
  } catch (error) {
    console.error("Reject contract error:", error)
    res.status(500).json({ message: "Server error: " + error.message })  // More detailed error message
  }
})

// PUT /contracts/:id/accounting-approve - Approve a contract (Accounting only)
app.put("/contracts/:id/accounting-approve", async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid contract id" })
    const contract = await Contract.findById(id)
    if (!contract) return res.status(404).json({ message: "Not found" })
    if (contract.status !== "For Accounting Review") return res.status(400).json({ message: "Only contracts with 'For Accounting Review' status can be approved by Accounting" })
    
    contract.status = "Active"
    await contract.save()
    res.json({ message: "Contract approved by Accounting and activated", contract })
  } catch (error) {
    console.error("Accounting approve contract error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// PUT /contracts/:id/accounting-reject - Reject a contract (Accounting only)
app.put("/contracts/:id/accounting-reject", async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid contract id" })
    const contract = await Contract.findById(id)
    if (!contract) return res.status(404).json({ message: "Not found" })
    if (contract.status !== "For Accounting Review") return res.status(400).json({ message: "Only contracts with 'For Accounting Review' status can be rejected by Accounting" })

    contract.status = "For Approval"
    contract.rejectionReason = reason || ""
    await contract.save()
    res.json({ message: "Contract rejected by Accounting and returned to Sales Manager", contract })
  } catch (error) {
    console.error("Accounting reject contract error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Helper function to validate contract for approval (only required fields with asterisks)
const validateContractForApproval = (contract) => {
  const errors = [];
  const p1 = contract.page1 || {};
  const p2 = contract.page2 || {};
  const p3 = contract.page3 || {};

  // Required fields in page1
  const requiredP1Fields = [
    'celebratorName', 'representativeName', 'representativeRelationship', 
    'representativeEmail', 'representativeAddress', 'representativeMobile',
    'coordinatorName', 'coordinatorMobile', 'coordinatorEmail', 'coordinatorAddress', 
    'eventDate', 'occasion', 'serviceStyle', 'venue', 'hall', 'address',
    'arrivalOfGuests', 'ingressTime', 'cocktailTime', 'servingTime', 
    'totalVIP', 'totalRegular', 'totalGuests', 'themeSetup', 'colorMotif',
    'vipTableType', 'vipChairs', 'vipTableQuantity', // ADDED vipChairs
    'regularTableType', 'regularChairs', 'regularTableQuantity', // ADDED regularChairs
    'vipUnderliner', 'vipNapkin', 'guestUnderliner', 'guestNapkin'
  ];
  
  requiredP1Fields.forEach(field => {
    if (!p1[field] || !p1[field].toString().trim()) {
      const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      errors.push(`Page 1 - ${fieldName} is required`);
    }
  });

  // Validate color motif has at least one color
  if (!p1.colorMotif || p1.colorMotif.split(',').filter(color => color.trim() !== '').length === 0) {
    errors.push("Page 1 - Color Motif must have at least one color selected");
  }

  // Email validations for required emails
  const validateEmail = (email) => {
    if (!email || email.toUpperCase() === "N/A") return true;
    return email.includes("@gmail.com") || email.includes("@yahoo.com") || email.includes("@");
  };
  
  if (p1.representativeEmail && !validateEmail(p1.representativeEmail)) {
    errors.push("Page 1 - Representative email must be a valid email address");
  }
  if (p1.coordinatorEmail && !validateEmail(p1.coordinatorEmail)) {
    errors.push("Page 1 - Coordinator email must be a valid email address");
  }

  // Phone validations for required phones
  if (p1.representativeMobile && p1.representativeMobile.toUpperCase() !== "N/A" && !/^\d+$/.test(p1.representativeMobile.replace(/\D/g, ''))) {
    errors.push("Page 1 - Representative mobile must contain only digits or be N/A");
  }
  if (p1.coordinatorMobile && p1.coordinatorMobile.toUpperCase() !== "N/A" && !/^\d+$/.test(p1.coordinatorMobile.replace(/\D/g, ''))) {
    errors.push("Page 1 - Coordinator mobile must contain only digits or be N/A");
  }

  // Validate guest counts consistency
  const vipGuests = parseInt(p1.totalVIP) || 0;
  const regularGuests = parseInt(p1.totalRegular) || 0;
  const totalGuests = parseInt(p1.totalGuests) || 0;
  
  if (vipGuests + regularGuests !== totalGuests) {
    errors.push(`Page 1 - VIP guests (${vipGuests}) + Regular guests (${regularGuests}) must equal Total guests (${totalGuests})`);
  }

  // Validate table configuration makes sense
  const vipTableQty = parseInt(p1.vipTableQuantity) || 0;
  const regularTableQty = parseInt(p1.regularTableQuantity) || 0;
  
  if (vipTableQty === 0 && vipGuests > 0) {
    errors.push("Page 1 - VIP tables required for VIP guests");
  }
  if (regularTableQty === 0 && regularGuests > 0) {
    errors.push("Page 1 - Regular tables required for Regular guests");
  }

  // Required fields in page2 (chairs) - updated to match your current structure
  const requiredP2Fields = ['chairsMonoblock', 'chairsTiffany', 'chairsCrystal', 'chairsRustic', 'chairsKiddie', 'totalChairs'];
  // REMOVED: 'premiumChairs' since it's not in your current form
  
  requiredP2Fields.forEach(field => {
    if (!p2[field] || !p2[field].toString().trim()) {
      const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      errors.push(`Page 2 - ${fieldName} is required`);
    }
  });

  // Check chairs sum - updated calculation
  const sum = (parseInt(p2.chairsMonoblock) || 0) + 
              (parseInt(p2.chairsTiffany) || 0) + 
              (parseInt(p2.chairsCrystal) || 0) +
              (parseInt(p2.chairsRustic) || 0) + 
              (parseInt(p2.chairsKiddie) || 0);
  const totalChairs = parseInt(p2.totalChairs) || 0;
  
  if (sum !== totalChairs) {
    errors.push(`Page 2 - Chair counts sum (${sum}) must equal Total Chairs (${totalChairs})`);
  }

  // Validate creative fields (backdrop, flower, decor)
  const creativeFields = ['backdrop', 'flower', 'decor'];
  creativeFields.forEach(field => {
    const value = p2[field];
    if (!value || 
        (Array.isArray(value) && value.length === 0) || 
        (typeof value === 'string' && !value.trim())) {
      const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
      errors.push(`Page 2 - ${fieldName} is required`);
    }
  });

  // Validate special requirement fields
  const specialRequirementFields = ['entrance', 'staging', 'equipment', 'miscellaneous'];
  specialRequirementFields.forEach(field => {
    const value = p2[field];
    if (!value || 
        (Array.isArray(value) && value.length === 0) || 
        (typeof value === 'string' && !value.trim())) {
      const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
      errors.push(`Page 2 - ${fieldName} is required`);
    }
  });

  // Check buffet package if service style is Buffet
  if (p1.serviceStyle === "Buffet") {
    const pageBuffet = contract.pageBuffet || {};
    if (!pageBuffet.selectedPackage || !pageBuffet.selectedPackage.trim()) {
      errors.push("Buffet - Selected Package is required");
    }
  }

  // Required fields in page3
  const requiredP3Fields = ['pricePerPlate', 'mobilizationCharge'];
  if (p1.serviceStyle === "Buffet") {
    requiredP3Fields.push('cocktailHour', 'soup', 'mainEntree', 'rice', 'dessert', 'drinks');
  }
  
  requiredP3Fields.forEach(field => {
    if (!p3[field] || !p3[field].toString().trim()) {
      const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      errors.push(`Page 3 - ${fieldName} is required`);
    }
  });

  return errors;
};

// PUT /contracts/:id/send-for-approval - Send a contract for approval
app.put("/contracts/:id/send-for-approval", async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid contract id" })
    }
    const contract = await Contract.findById(id)
    if (!contract) {
      return res.status(404).json({ message: "Not found" })
    }
    if (contract.status !== "Draft") {
      return res.status(400).json({ message: "Only Draft contracts can be sent for approval" })
    }

    // Validate that the contract is fully filled
    const validationErrors = validateContractFullyFilled(contract);
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: "Contract must be fully filled before sending for approval:\n\n" + validationErrors.join("\n") });
    }

    contract.status = "For Approval"
    await contract.save()
    res.json({ message: "Contract sent for approval", contract })
  } catch (error) {
    console.error("Send for approval error:", error)
    res.status(500).json({ message: "Server error" })
  }
})
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

// Alias: some clients fetch /creative-requests (hyphen) instead of /creativeRequests (camel)
app.get("/creative-requests", async (req, res) => {
  try {
    const requests = await CreativeRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error("Fetch creative-requests alias error:", error);
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

// ==================== PURCHASING ROUTES (Budget Decisions) ====================

// Helper: pick model by source field from the UI ("creative" | "fabrication")
function getModelAndProjectionBySource(source) {
  if (String(source).toLowerCase() === "creative") {
    return { Model: CreativeRequest, proj: {} };
  }
  // default to FabricationRequest
  return { Model: (import("./models/fabricationRequest.js")).default, proj: {} };
}

/**
 * Approve budget
 * Body: { id, source: "creative" | "fabrication", amount: number, notes?: string }
 * Effects:
 *  - status = "Sent to Accounting"   (UI maps Approved -> "Sent to Accounting")
 *  - budget.status = "Approved"
 *  - budget.amount = amount
 *  - budget.notes = notes || ""
 *  - rejectionReason cleared
 */
app.patch("/purchasing/budget/approve", async (req, res) => {
  try {
    const { id, source, amount, notes } = req.body;

    if (!id || !source || isNaN(Number(amount))) {
      return res.status(400).json({ message: "id, source, and valid amount are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id format" });
    }

    const { Model } = getModelAndProjectionBySource(source);

    // IMPORTANT:
    // Do NOT change the top-level status here.
    // Keep it as "Sent to Purchasing" so your UI's Incoming list still shows it.
    // Only update the budget fields + clear any previous rejection reason.
    const updated = await Model.findByIdAndUpdate(
      id,
      {
        $set: {
          "budget.status": "Approved",
          "budget.amount": Number(amount),
          "budget.notes": notes || "",
          rejectionReason: "",
        },
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Request not found" });
    res.json({ message: "Budget approved", request: updated });
  } catch (error) {
    console.error("Purchasing approve error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// Import the services at the top
// Replace these lines:
// const LocalSignatureService = require('./services/LocalSignatureService');
// const SignatureValidationService = require('./services/SignatureValidationService');

// With ES module imports:
import LocalSignatureService from './services/LocalSignatureService.js';
import SignatureValidationService from './services/SignatureValidationService.js';

// Configure file upload
import multer from 'multer';
import rateLimit from 'express-rate-limit';

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Add rate limiting
const signatureLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: { success: false, message: 'Too many upload attempts' }
});


// ===== LOCAL SIGNATURE ROUTES =====

// Generate contract PDF
app.post('/api/contracts/generate-for-signature', async (req, res) => {
  try {
    const { contractData } = req.body;

    const result = await LocalSignatureService.createSignatureRequest(contractData);

    res.json(result);
  } catch (error) {
    console.error('Contract generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate contract',
      error: error.message
    });
  }
});

// Upload and validate signed contract
app.post('/api/contracts/upload-signed', upload.single('signedContract'), async (req, res) => {
  try {
    console.log('🔍 Upload route hit');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    if (!req.file) {
      console.log('No file received');
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded. Please select a signature image.' 
      });
    }

    const { contractId, clientName } = req.body;
    console.log('Upload details:', { contractId, clientName });
    
    // Basic file validation
    if (req.file.size === 0) {
      return res.status(400).json({
        success: false,
        message: 'Uploaded file is empty'
      });
    }

    console.log('File uploaded successfully:', {
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });

    // Return success response
    res.json({
      success: true,
      message: 'Signature uploaded successfully!',
      fileInfo: {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      },
      nextSteps: [
        'Signed contract received successfully',
        'Our team will process your contract',
        'You will receive confirmation within 24 hours'
      ]
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload signed contract: ' + error.message
    });
  }
});

// Download contract PDF
app.get('/api/contracts/download/:contractId', async (req, res) => {
  try {
    const { contractData } = req.query;
    
    if (!contractData) {
      return res.status(400).json({ message: 'Contract data required' });
    }

    const pdfBuffer = await LocalSignatureService.generateContractPDF(JSON.parse(contractData));
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contract-${req.params.contractId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Failed to download contract' });
  }
});


/**
 * Reject budget
 * Body: { id, source: "creative" | "fabrication", notes?: string }
 * Effects:
 *  - status = "Rejected"
 *  - budget.status = "Rejected"
 *  - budget.notes = notes || ""
 *  - rejectionReason = notes || ""
 */
app.patch("/purchasing/budget/reject", async (req, res) => {
  try {
    const { id, source, notes } = req.body;

    if (!id || !source) {
      return res.status(400).json({ message: "id and source are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id format" });
    }

    const { Model } = getModelAndProjectionBySource(source);

    // Do NOT change the top-level status.
    // Keep it as "Sent to Purchasing" so it stays in the Incoming list.
    const updated = await Model.findByIdAndUpdate(
      id,
      {
        $set: {
          "budget.status": "Rejected",
          "budget.notes": notes || "",
          rejectionReason: notes || "",
        },
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Request not found" });
    res.json({ message: "Budget rejected", request: updated });
  } catch (error) {
    console.error("Purchasing reject error:", error);
    res.status(500).json({ message: "Server error" });
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
import axios from "axios";
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

// Add these routes to your server.js file

// In-memory storage for banquet data (you might want to use a database in production)
let banquetEquipmentRequests = [];
let banquetStaffAssignments = [];

// ===== BANQUET STAFF ROUTES =====

// Get all equipment requests
app.get('/banquet/equipment-requests', (req, res) => {
  try {
    res.json({ 
      success: true, 
      requests: banquetEquipmentRequests 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching equipment requests' 
    });
  }
});

// Create new equipment request
app.post('/banquet/equipment-requests', (req, res) => {
  try {
    const { eventId, equipment, status } = req.body;
    
    const newRequest = {
      _id: Date.now().toString(),
      eventId,
      eventName: 'Event', // You might want to fetch the actual event name
      equipment,
      status: status || 'pending',
      date: new Date().toISOString(),
      createdAt: new Date()
    };
    
    banquetEquipmentRequests.push(newRequest);
    
    res.json({ 
      success: true, 
      message: 'Equipment request created successfully',
      request: newRequest
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error creating equipment request' 
    });
  }
});

// Get all staff assignments
app.get('/banquet/staff-assignments', (req, res) => {
  try {
    res.json({ 
      success: true, 
      assignments: banquetStaffAssignments 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching staff assignments' 
    });
  }
});

// Create new staff assignment
app.post('/banquet/staff-assignments', (req, res) => {
  try {
    const { staffId, staffName, eventId, eventName, role, notes, status } = req.body;
    
    const newAssignment = {
      id: req.body.id || Date.now().toString(),
      staffId,
      staffName,
      eventId,
      eventName,
      role,
      notes: notes || '',
      status: status || 'assigned',
      date: new Date().toISOString(),
      createdAt: new Date()
    };
    
    banquetStaffAssignments.push(newAssignment);
    
    res.json({ 
      success: true, 
      message: 'Staff assignment created successfully',
      assignment: newAssignment
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error creating staff assignment' 
    });
  }
});

// Update staff assignment
app.patch('/banquet/staff-assignments/:id', (req, res) => {
  try {
    const assignmentId = req.params.id;
    const updates = req.body;
    
    const assignmentIndex = banquetStaffAssignments.findIndex(a => a.id === assignmentId);
    
    if (assignmentIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff assignment not found' 
      });
    }
    
    banquetStaffAssignments[assignmentIndex] = {
      ...banquetStaffAssignments[assignmentIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    res.json({ 
      success: true, 
      message: 'Staff assignment updated successfully',
      assignment: banquetStaffAssignments[assignmentIndex]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating staff assignment' 
    });
  }
});

// Delete staff assignment
app.delete('/banquet/staff-assignments/:id', (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    const assignmentIndex = banquetStaffAssignments.findIndex(a => a.id === assignmentId);
    
    if (assignmentIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff assignment not found' 
      });
    }
    
    banquetStaffAssignments.splice(assignmentIndex, 1);
    
    res.json({ 
      success: true, 
      message: 'Staff assignment deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting staff assignment' 
    });
  }
});

// Update equipment request status
app.patch('/banquet/equipment-requests/:id', (req, res) => {
  try {
    const requestId = req.params.id;
    const { status } = req.body;
    
    const requestIndex = banquetEquipmentRequests.findIndex(r => r._id === requestId);
    
    if (requestIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Equipment request not found' 
      });
    }
    
    banquetEquipmentRequests[requestIndex].status = status;
    banquetEquipmentRequests[requestIndex].updatedAt = new Date();
    
    res.json({ 
      success: true, 
      message: 'Equipment request updated successfully',
      request: banquetEquipmentRequests[requestIndex]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating equipment request' 
    });
  }
});

// Get banquet dashboard stats
app.get('/banquet/dashboard-stats', (req, res) => {
  try {
    const pendingRequests = banquetEquipmentRequests.filter(r => r.status === 'pending').length;
    const activeAssignments = banquetStaffAssignments.filter(a => a.status === 'assigned').length;
    
    res.json({
      success: true,
      stats: {
        pendingEquipmentRequests: pendingRequests,
        activeStaffAssignments: activeAssignments,
        totalEquipmentRequests: banquetEquipmentRequests.length,
        totalStaffAssignments: banquetStaffAssignments.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching dashboard stats' 
    });
  }
});

// Add some sample data for testing
app.post('/banquet/seed-sample-data', (req, res) => {
  try {
    // Sample equipment requests
    banquetEquipmentRequests = [
      {
        _id: '1',
        eventId: 'sample1',
        eventName: 'Wedding Reception',
        equipment: ['Chairs', 'Tables', 'Tablecloths'],
        status: 'pending',
        date: new Date().toISOString(),
        createdAt: new Date()
      },
      {
        _id: '2',
        eventId: 'sample2',
        eventName: 'Corporate Event',
        equipment: ['Projector', 'Screen', 'Microphones'],
        status: 'approved',
        date: new Date(Date.now() - 86400000).toISOString(), // yesterday
        createdAt: new Date(Date.now() - 86400000)
      }
    ];
    
    // Sample staff assignments
    banquetStaffAssignments = [
      {
        id: '1',
        staffId: 'staff_1',
        staffName: 'John Smith',
        eventId: 'sample1',
        eventName: 'Wedding Reception',
        role: 'Head Waiter',
        notes: 'Handle VIP section',
        status: 'assigned',
        date: new Date().toISOString(),
        createdAt: new Date()
      },
      {
        id: '2',
        staffId: 'staff_2',
        staffName: 'Maria Garcia',
        eventId: 'sample2',
        eventName: 'Corporate Event',
        role: 'Bartender',
        notes: 'Main bar station',
        status: 'completed',
        date: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 86400000)
      }
    ];
    
    res.json({ 
      success: true, 
      message: 'Sample data seeded successfully',
      equipmentRequests: banquetEquipmentRequests.length,
      staffAssignments: banquetStaffAssignments.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error seeding sample data' 
    });
  }
});

// Clear all banquet data (for testing)
app.delete('/banquet/clear-data', (req, res) => {
  try {
    banquetEquipmentRequests = [];
    banquetStaffAssignments = [];
    
    res.json({ 
      success: true, 
      message: 'All banquet data cleared successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error clearing data' 
    });
  }
});

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

