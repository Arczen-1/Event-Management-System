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
const { MongoClient, ObjectId } = require('mongodb');
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
// ==================== ADMIN DASHBOARD STATS ENDPOINTS ====================

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
    
    // Get inventory count from Google Sheets
    let totalInventory = 0;
    try {
      const inventoryData = await fetchMonitoringData();
      totalInventory = inventoryData.reduce((total, section) => total + section.rows.length, 0);
    } catch (inventoryErr) {
      console.error("Error fetching inventory data:", inventoryErr);
      // Continue without inventory data
    }

    // Get recent activity (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentContracts = await Contract.countDocuments({ 
      createdAt: { $gte: oneWeekAgo } 
    });
    
    const recentUsers = await User.countDocuments({ 
      createdAt: { $gte: oneWeekAgo },
      status: "approved"
    });

    res.json({
      totalContracts,
      totalUsers,
      totalInventory,
      activeEvents: activeContracts,
      pendingApprovals,
      recentActivity: {
        newContracts: recentContracts,
        newUsers: recentUsers
      }
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    res.status(500).json({ message: "Server error fetching dashboard stats" });
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
    'celebratorName', 'representativeName', 'representativeRelationship', 'representativeEmail', 'representativeAddress', 'representativeMobile',
    'coordinatorName', 'coordinatorMobile', 'coordinatorEmail', 'coordinatorAddress', 'eventDate', 'occasion', 'serviceStyle', 'venue', 'hall', 'address',
    'arrivalOfGuests', 'ingressTime', 'cocktailTime', 'servingTime', 'totalVIP', 'totalRegular', 'totalGuests', 'themeSetup', 'colorMotif',
    'vipTableType', 'vipTableSeats', 'vipTableQuantity', 'regularTableType', 'regularTableSeats', 'regularTableQuantity',
    'vipUnderliner', 'vipNapkin', 'guestUnderliner', 'guestNapkin'
  ];
  requiredP1Fields.forEach(field => {
    if (!p1[field] || !p1[field].trim()) {
      errors.push(`Page 1 - ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
    }
  });

  // Email validations for required emails
  const validateEmail = (email) => {
    if (email.toUpperCase() === "N/A") return true;
    return email.includes("@gmail.com") || email.includes("@yahoo.com");
  };
  if (p1.representativeEmail && !validateEmail(p1.representativeEmail)) {
    errors.push("Page 1 - Representative email must end with @gmail.com or @yahoo.com");
  }
  if (p1.coordinatorEmail && !validateEmail(p1.coordinatorEmail)) {
    errors.push("Page 1 - Coordinator email must end with @gmail.com or @yahoo.com");
  }

  // Phone validations for required phones
  if (p1.representativeMobile && p1.representativeMobile.toUpperCase() !== "N/A" && !/^\d{11}$/.test(p1.representativeMobile)) {
    errors.push("Page 1 - Representative mobile must be 11 digits or N/A");
  }
  if (p1.coordinatorMobile && p1.coordinatorMobile.toUpperCase() !== "N/A" && !/^\d{11}$/.test(p1.coordinatorMobile)) {
    errors.push("Page 1 - Coordinator mobile must be 11 digits or N/A");
  }

  // Required fields in page2 (chairs)
  const requiredP2Fields = ['chairsMonoblock', 'chairsTiffany', 'chairsCrystal', 'chairsRustic', 'chairsKiddie', 'premiumChairs', 'totalChairs'];
  requiredP2Fields.forEach(field => {
    if (!p2[field] || !p2[field].trim()) {
      errors.push(`Page 2 - ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
    }
  });

  // Check chairs sum
  const sum = (parseInt(p2.chairsMonoblock) || 0) + (parseInt(p2.chairsTiffany) || 0) + (parseInt(p2.chairsCrystal) || 0) +
              (parseInt(p2.chairsRustic) || 0) + (parseInt(p2.chairsKiddie) || 0) + (parseInt(p2.premiumChairs) || 0);
  const total = parseInt(p2.totalChairs) || 0;
  if (sum !== total) {
    errors.push(`Page 2 - The total number of chairs entered (${sum}) must equal the Total Chairs (${total}).`);
  }

  // Check at least one knowUs
  const knowUsFields = ['knowUsWebsite', 'knowUsFacebook', 'knowUsInstagram', 'knowUsFlyers', 'knowUsBillboard', 'knowUsWordOfMouth',
                        'knowUsVenueReferral', 'knowUsRepeatClient', 'knowUsBridalFair', 'knowUsFoodTasting', 'knowUsCelebrityReferral', 'knowUsOthers'];
  const hasKnowUs = knowUsFields.some(field => p2[field]);
  if (!hasKnowUs) {
    errors.push("Page 2 - At least one 'How did you know our company' option must be selected");
  }

  // Required fields in page3
  const requiredP3Fields = ['pricePerPlate'];
  requiredP3Fields.forEach(field => {
    if (!p3[field] || !p3[field].trim()) {
      errors.push(`Page 3 - ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
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
  return { Model: require("./models/fabricationRequest"), proj: {} };
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

