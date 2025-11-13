
import { useState, useEffect } from "react"
import "./AdminDashboard.css"

function AdminDashboard({ onLogout }) {
  // ==================== STATE MANAGEMENT ====================
  const [pendingUsers, setPendingUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [selectedRole, setSelectedRole] = useState("")
  const [message, setMessage] = useState("")
  const [activeView, setActiveView] = useState("dashboard")
  const [userManagementTab, setUserManagementTab] = useState("pending")
  const [editingUser, setEditingUser] = useState(null)
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [dashboardStats, setDashboardStats] = useState({
    totalContracts: 0,
    totalUsers: 0,
    totalInventory: 0,
    activeEvents: 0,
    pendingApprovals: 0
  })
  const [contractsData, setContractsData] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [fullContracts, setFullContracts] = useState([])
  const [selectedContract, setSelectedContract] = useState(null)
  const [showRejectionReasonModal, setShowRejectionReasonModal] = useState(false)
  const [currentRejectionReason, setCurrentRejectionReason] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [invoices, setInvoices] = useState([])
  const [activeContracts, setActiveContracts] = useState([])
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [newInvoice, setNewInvoice] = useState({
    contractId: "",
    invoiceNumber: "",
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    items: [],
    totalAmount: 0,
    status: "pending"
  })

const [banquetData, setBanquetData] = useState(null)
const [upcomingEvents, setUpcomingEvents] = useState([])
const [staffAssignments, setStaffAssignments] = useState([])
const [equipmentRequests, setEquipmentRequests] = useState([])

// Add to your existing state variables
const [warehouseContracts, setWarehouseContracts] = useState([]);
const [warehouseInventory, setWarehouseInventory] = useState([]);
const [warehouseFabricationRequests, setWarehouseFabricationRequests] = useState([]);
const [warehouseStats, setWarehouseStats] = useState({
  activeContracts: 0,
  inventoryItems: 0,
  pendingRequests: 0,
  lowStockItems: 0
});


const [inventoryData, setInventoryData] = useState([]);
const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
const [inventoryModalMode, setInventoryModalMode] = useState("add");
const [inventoryModalData, setInventoryModalData] = useState({});
const [inventoryEditingIndex, setInventoryEditingIndex] = useState(null);
const [currentInventoryDepartment, setCurrentInventoryDepartment] = useState("");

// Add to your existing state variables
// Replace your departmentData state with this:
const [departmentData, setDepartmentData] = useState({
  creative: {
    contracts: [],
    inventory: [],
    fabricationRequests: [],
    stats: { activeContracts: 0, inventoryItems: 0, pendingRequests: 0, lowStockItems: 0 },
    loading: true
  },
  warehouse: {
    contracts: [],
    inventory: [],
    fabricationRequests: [],
    stats: { activeContracts: 0, inventoryItems: 0, pendingRequests: 0, lowStockItems: 0 },
    loading: true
  },
  linen: {
    contracts: [],
    inventory: [],
    fabricationRequests: [],
    stats: { activeContracts: 0, inventoryItems: 0, pendingRequests: 0, lowStockItems: 0 },
    loading: true
  },
  stockroom: {
    contracts: [],
    inventory: [],
    fabricationRequests: [],
    stats: { activeContracts: 0, inventoryItems: 0, pendingRequests: 0, lowStockItems: 0 },
    loading: true
  }
});

  const roles = [
    "Sales", "Sales Manager", "Accounting", "Warehouse", "Creative", 
    "Creative Manager", "Linen", "Logistics", "Kitchen", "Stockroom", 
    "Purchasing", "Banquet Staff", "Fabrication", "Admin",
  ]

  // ==================== LIFECYCLE HOOKS ====================

  // Update this useEffect
useEffect(() => {
  if (["creative", "warehouse", "linen", "stockroom"].includes(activeView)) {
    fetchDepartmentData(activeView);
  }
}, [activeView]);

  // ------------------- Fetch Data -------------------
  useEffect(() => {
    if (activeView === "inventory") fetchInventory();
  }, [activeView]);
  // Add this with your other useEffect hooks
useEffect(() => {
  if (activeView === "warehouse") {
    fetchWarehouseData();
  }
}, [activeView]);
  useEffect(() => {
    fetchPendingUsers()
    fetchAllUsers()
    fetchDashboardStats()
    fetchRecentActivity()
  }, [])


  // Fetch contracts data when contracts view becomes active
  useEffect(() => {
    if (activeView === "contracts") {
      fetchContractsData();
    }
  }, [activeView]);
  // Update the useEffect for banquet data
  useEffect(() => {
    if (activeView === "banquet") {
      fetchBanquetData();
    }
  }, [activeView]);
  // Fetch department data when specific department views become active
  useEffect(() => {
    if (activeView === "events") {
      fetchDepartmentData("events");
    } else if (activeView === "finance") {
      fetchDepartmentData("finance");
    } else if (["creative", "warehouse", "linen", "banquet"].includes(activeView)) {
      fetchDepartmentData(activeView);
    }
  }, [activeView]);

  useEffect(() => {
  if (activeView === "finance") {
    fetchInvoices();
    fetchActiveContracts();
  }
}, [activeView]);


// ==================== BANQUET FUNCTIONS ====================

// ==================== WAREHOUSE FUNCTIONS ====================
const fetchWarehouseData = async () => {
  try {
    // Fetch contracts for warehouse
    const contractsRes = await fetch("http://localhost:5000/contracts");
    const contractsData = await contractsRes.json();
    if (contractsRes.ok) {
      setWarehouseContracts(
        (contractsData.contracts || [])
          .filter(c => c.status === "Active")
          .map(c => ({
            id: c._id,
            name: (c.page1 && (c.page1.contractName || c.page1.occasion)) || "Contract",
            client: (c.page1 && c.page1.celebratorName) || "",
            contractNumber: c.contractNumber,
            raw: c,
          }))
      );
    }

    // Fetch inventory
    const inventoryRes = await fetch("http://localhost:5000/inventory");
    const inventoryData = await inventoryRes.json();
    setWarehouseInventory(inventoryData);

    // Fetch fabrication requests
    const fabricationRes = await fetch("http://localhost:5000/fabrication-requests");
    const fabricationData = await fabricationRes.json();
    setWarehouseFabricationRequests(fabricationData || []);

    // Update stats
    setWarehouseStats({
      activeContracts: warehouseContracts.length,
      inventoryItems: inventoryData.length,
      pendingRequests: (fabricationData || []).filter(req => req.status === "pending").length,
      lowStockItems: inventoryData.filter(item => item.quantity < 10).length
    });

  } catch (error) {
    console.error("Error fetching warehouse data:", error);
  }
};

const handleApproveFabricationRequest = async (requestId) => {
  try {
    const res = await fetch(`http://localhost:5000/fabrication-requests/${requestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });

    if (res.ok) {
      alert("Fabrication request approved!");
      fetchWarehouseData(); // Refresh data
    } else {
      alert("Error approving request");
    }
  } catch (err) {
    console.error("Error approving fabrication request:", err);
  }
};

const handleRejectFabricationRequest = async (requestId) => {
  try {
    const res = await fetch(`http://localhost:5000/fabrication-requests/${requestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });

    if (res.ok) {
      alert("Fabrication request rejected!");
      fetchWarehouseData();
    } else {
      alert("Error rejecting request");
    }
  } catch (err) {
    console.error("Error rejecting fabrication request:", err);
  }
};
// ==================== WAREHOUSE RENDER FUNCTION ====================
const renderWarehouseView = () => {
  const pendingRequests = warehouseFabricationRequests.filter(req => req.status === "pending");
  const lowStockItems = warehouseInventory.filter(item => item.quantity < 10);

  return (
    <div className="department-view">
      <div className="view-header">
        <h2>Warehouse Management - Admin View</h2>
        <button className="back-btn" onClick={() => setActiveView("dashboard")}>
          ← Back to Dashboard
        </button>
      </div>

      {message && <div className="message">{message}</div>}

      {/* Warehouse Overview Stats */}
      <div className="warehouse-stats-overview">
        <div className="stat-card">
          <h3>Active Contracts</h3>
          <div className="stat-value">{warehouseContracts.length}</div>
          <div className="stat-label">Requiring Warehouse Support</div>
        </div>
        
        <div className="stat-card">
          <h3>Inventory Items</h3>
          <div className="stat-value">{warehouseInventory.length}</div>
          <div className="stat-label">Total Items in Stock</div>
        </div>
        
        <div className="stat-card">
          <h3>Pending Requests</h3>
          <div className="stat-value">{pendingRequests.length}</div>
          <div className="stat-label">Awaiting Approval</div>
        </div>
        
        <div className="stat-card">
          <h3>Low Stock Items</h3>
          <div className="stat-value">{lowStockItems.length}</div>
          <div className="stat-label">Need Reordering</div>
        </div>
      </div>

      {/* Pending Fabrication Requests */}
      <div className="section-container">
        <div className="section-header">
          <h3>Pending Fabrication Requests ({pendingRequests.length})</h3>
        </div>
        <div className="fabrication-requests-table">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Requestor</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Remarks</th>
                <th>Date Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan="7">No pending fabrication requests</td>
                </tr>
              ) : (
                pendingRequests.map((req, idx) => (
                  <tr key={req._id || idx}>
                    <td>#{req._id ? req._id.slice(-6).toUpperCase() : idx}</td>
                    <td>{req.username}</td>
                    <td>{req.item}</td>
                    <td>{req.quantity}</td>
                    <td>{req.remarks || "—"}</td>
                    <td>{req.date || new Date().toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-success small"
                          onClick={() => handleApproveFabricationRequest(req._id)}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn-danger small"
                          onClick={() => handleRejectFabricationRequest(req._id)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Fabrication Requests History */}
      <div className="section-container">
        <div className="section-header">
          <h3>All Fabrication Requests ({warehouseFabricationRequests.length})</h3>
        </div>
        <div className="fabrication-history-table">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Requestor</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {warehouseFabricationRequests.length === 0 ? (
                <tr>
                  <td colSpan="6">No fabrication requests found</td>
                </tr>
              ) : (
                warehouseFabricationRequests.map((req, idx) => (
                  <tr key={req._id || idx}>
                    <td>#{req._id ? req._id.slice(-6).toUpperCase() : idx}</td>
                    <td>{req.username}</td>
                    <td>{req.item}</td>
                    <td>{req.quantity}</td>
                    <td>
                      <span className={`status ${req.status || 'pending'}`}>
                        {req.status || 'pending'}
                      </span>
                    </td>
                    <td>{req.date || new Date().toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alert */}
      <div className="section-container">
        <div className="section-header">
          <h3>Low Stock Alert</h3>
        </div>
        <div className="low-stock-table">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Current Stock</th>
                <th>Minimum Required</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.length === 0 ? (
                <tr>
                  <td colSpan="4">All items are sufficiently stocked</td>
                </tr>
              ) : (
                lowStockItems.map((item, idx) => (
                  <tr key={item._id || idx}>
                    <td>{item.itemName}</td>
                    <td className={item.quantity < 5 ? "critical-stock" : "low-stock"}>
                      {item.quantity}
                    </td>
                    <td>10</td>
                    <td>
                      <span className={`status ${item.quantity < 5 ? "critical" : "warning"}`}>
                        {item.quantity < 5 ? "Critical" : "Low"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
const fetchBanquetData = async () => {
  try {
    // Fetch upcoming events
    const eventsRes = await fetch("http://localhost:5000/contracts?status=Active")
    if (eventsRes.ok) {
      const eventsData = await eventsRes.json()
      const upcoming = (eventsData.contracts || []).filter(contract => {
        const eventDate = new Date(contract.page1?.eventDate)
        const today = new Date()
        const diffTime = eventDate - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays >= 0 && diffDays <= 30 // Events in next 30 days
      })
      setUpcomingEvents(upcoming)
    }

    // Fetch staff assignments
    const staffRes = await fetch("http://localhost:5000/banquet/staff-assignments")
    if (staffRes.ok) {
      const staffData = await staffRes.json()
      setStaffAssignments(staffData.assignments || [])
    } else {
      // If endpoint doesn't exist yet, set empty array
      setStaffAssignments([])
    }

    // Fetch equipment requests
    const equipmentRes = await fetch("http://localhost:5000/banquet/equipment-requests")
    if (equipmentRes.ok) {
      const equipmentData = await equipmentRes.json()
      setEquipmentRequests(equipmentData.requests || [])
    } else {
      // If endpoint doesn't exist yet, set empty array
      setEquipmentRequests([])
    }

  } catch (err) {
    console.error("Fetch banquet data error:", err)
    // Set empty arrays if there's an error
    setStaffAssignments([])
    setEquipmentRequests([])
  }
}

const markTaskComplete = async (assignmentId) => {
  try {
    const res = await fetch(`http://localhost:5000/banquet/assignments/${assignmentId}/complete`, {
      method: "PUT"
    })
    if (res.ok) {
      fetchBanquetData() // Refresh data
      setMessage("Task marked as complete")
      setTimeout(() => setMessage(""), 3000)
    }
  } catch (err) {
    console.error("Mark task complete error:", err)
  }
}

const requestEquipment = async (eventId, equipmentList) => {
  try {
    const res = await fetch("http://localhost:5000/banquet/equipment-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        equipment: equipmentList,
        requestedBy: "Banquet Staff",
        status: "pending"
      })
    })
    if (res.ok) {
      fetchBanquetData() // Refresh data
      setMessage("Equipment request submitted")
      setTimeout(() => setMessage(""), 3000)
    }
  } catch (err) {
    console.error("Request equipment error:", err)
  }
}

  // ==================== API FUNCTIONS ====================
  const fetchDashboardStats = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin/dashboard-stats");
      if (res.ok) {
        const data = await res.json();
        setDashboardStats({
          totalContracts: data.totalContracts || 0,
          totalUsers: data.totalUsers || 0,
          totalInventory: data.totalInventory || 0,
          activeEvents: data.activeEvents || 0,
          pendingApprovals: data.pendingApprovals || 0
        });
      }
    } catch (err) {
      console.error("Fetch dashboard stats error:", err);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin/recent-activity");
      if (res.ok) {
        const data = await res.json();
        setRecentActivity(data.activity || []);
      }
    } catch (err) {
      console.error("Fetch recent activity error:", err);
    }
  };

  const fetchContractsData = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin/contracts-overview");
      if (res.ok) {
        const data = await res.json();
        setContractsData(data.contracts || []);
      }
    } catch (err) {
      console.error("Fetch contracts data error:", err);
    }
  };

 // ==================== UNIFIED DEPARTMENT FUNCTIONS ====================
const fetchDepartmentData = async (department) => {
  try {
    // Set loading state
    setDepartmentData(prev => ({
      ...prev,
      [department]: {
        ...prev[department],
        loading: true
      }
    }));

    // Fetch contracts for department
    const contractsRes = await fetch("http://localhost:5000/contracts");
    const contractsData = await contractsRes.json();
    
    let departmentContracts = [];
    if (contractsRes.ok) {
      departmentContracts = (contractsData.contracts || [])
        .filter(c => c.status === "Active")
        .map(c => ({
          id: c._id,
          name: (c.page1 && (c.page1.contractName || c.page1.occasion)) || "Contract",
          client: (c.page1 && c.page1.celebratorName) || "",
          contractNumber: c.contractNumber,
          raw: c,
        }));
    }

    // Fetch inventory for specific department (fallback to general inventory if endpoint doesn't exist)
    let inventoryData = [];
    try {
      const inventoryRes = await fetch(`http://localhost:5000/inventory?department=${department}`);
      if (inventoryRes.ok) {
        inventoryData = await inventoryRes.json();
      }
    } catch (inventoryError) {
      console.warn(`No specific inventory endpoint for ${department}, using general inventory`);
      const generalInventoryRes = await fetch("http://localhost:5000/inventory");
      if (generalInventoryRes.ok) {
        inventoryData = await generalInventoryRes.json();
      }
    }

    // Fetch fabrication requests for department (fallback to general if endpoint doesn't exist)
    let fabricationData = [];
    try {
      const fabricationRes = await fetch(`http://localhost:5000/fabrication-requests?department=${department}`);
      if (fabricationRes.ok) {
        fabricationData = await fabricationRes.json();
      }
    } catch (fabricationError) {
      console.warn(`No specific fabrication endpoint for ${department}, using general requests`);
      const generalFabricationRes = await fetch("http://localhost:5000/fabrication-requests");
      if (generalFabricationRes.ok) {
        fabricationData = await generalFabricationRes.json();
      }
    }

    // Update department data
    setDepartmentData(prev => ({
      ...prev,
      [department]: {
        contracts: departmentContracts,
        inventory: inventoryData || [],
        fabricationRequests: fabricationData || [],
        stats: {
          activeContracts: departmentContracts.length,
          inventoryItems: (inventoryData || []).length,
          pendingRequests: (fabricationData || []).filter(req => req.status === "pending").length,
          lowStockItems: (inventoryData || []).filter(item => item.quantity < 10).length
        },
        loading: false
      }
    }));

  } catch (error) {
    console.error(`Error fetching ${department} data:`, error);
    setDepartmentData(prev => ({
      ...prev,
      [department]: {
        ...prev[department],
        loading: false
      }
    }));
  }
};


  const fetchPendingUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin/pending-users")
      if (res.ok) {
        const data = await res.json()
        setPendingUsers(data)
      }
    } catch (err) {
      console.error("Fetch pending users error:", err)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin/users")
      if (res.ok) {
        const data = await res.json()
        setAllUsers(data)
      }
    } catch (err) {
      console.error("Fetch all users error:", err)
    }
  }

  const approveUser = async (userId, role) => {
    if (!userId) {
      setMessage("Error: User ID is missing")
      return
    }

    if (!role) {
      setMessage("Error: Please select a department/role")
      return
    }

    try {
      const res = await fetch(`http://localhost:5000/admin/approve-user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`Success: ${data.message}`)
        fetchPendingUsers()
        fetchAllUsers()
        setEditingUser(null)
        setSelectedRole("")
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(`Error: ${data.message}`)
      }
    } catch (err) {
      console.error("Approve user error:", err)
      setMessage("Error: Unable to connect to server.")
    }
  }

  const rejectUser = async (userId) => {
    if (!userId) {
      setMessage("Error: User ID is missing")
      return
    }

    if (!window.confirm("Are you sure you want to reject this user? This will permanently delete their account.")) {
      return
    }

    try {
      const res = await fetch(`http://localhost:5000/admin/reject-user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`Success: ${data.message}`)
        fetchPendingUsers()
        fetchAllUsers()
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(`Error: ${data.message}`)
      }
    } catch (err) {
      console.error("Reject user error:", err)
      setMessage("Error: Unable to connect to server.")
    }
  }

  const assignRole = async (userId, role) => {
    if (!userId) {
      setMessage("Error: User ID is missing")
      return
    }

    if (!role) {
      setMessage("Error: Please select a department/role")
      return
    }

    try {
      const res = await fetch(`http://localhost:5000/admin/assign-role/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`Success: ${data.message}`)
        fetchPendingUsers()
        fetchAllUsers()
        setEditingUser(null)
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(`Error: ${data.message}`)
      }
    } catch (err) {
      console.error("Assign role error:", err)
      setMessage("Error: Unable to connect to server.")
    }
  }

  const deleteUser = async (userId) => {
    if (!userId) {
      setMessage("Error: User ID is missing")
      return
    }

    if (!window.confirm("Are you sure you want to delete this user?")) {
      return
    }

    try {
      const res = await fetch(`http://localhost:5000/admin/delete-user/${userId}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`Success: ${data.message}`)
        fetchPendingUsers()
        fetchAllUsers()
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(`Error: ${data.message}`)
      }
    } catch (err) {
      console.error("Delete user error:", err)
      setMessage("Error: Unable to connect to server.")
    }
  }

    // ==================== CONTRACT MANAGEMENT FUNCTIONS ====================
  const approveContract = async (contractId) => {
    try {
      const res = await fetch(`http://localhost:5000/contracts/${contractId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.ok) {
        setContractsData(prevContracts =>
          prevContracts.map(c =>
            c.id === contractId
              ? { ...c, status: "Active" }
              : c
          )
        );
        setMessage("Contract approved successfully");
        setTimeout(() => setMessage(""), 3000);
      } else {
        alert(data.message || "Failed to approve contract");
      }
    } catch (error) {
      alert("Failed to approve contract. Please try again.");
    }
  };

  const rejectContract = async (contractId, reason) => {
    if (!reason) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/contracts/${contractId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: reason })
      });
      const data = await res.json();
      if (res.ok) {
        setContractsData(prevContracts =>
          prevContracts.map(c =>
            c.id === contractId
              ? { ...c, status: "Rejected", rejectionReason: reason }
              : c
          )
        );
        setMessage("Contract rejected successfully");
        setTimeout(() => setMessage(""), 3000);
      } else {
        alert(data.message || "Failed to reject contract");
      }
    } catch (error) {
      alert("Failed to reject contract. Please try again.");
    }
  };

  const deleteContract = async (contractId) => {
    if (!window.confirm("Are you sure you want to delete this contract?")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/contracts/${contractId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setContractsData(prevContracts => prevContracts.filter(c => c.id !== contractId));
        setMessage("Contract deleted successfully");
        setTimeout(() => setMessage(""), 3000);
      } else {
        alert(data.message || "Failed to delete contract");
      }
    } catch (error) {
      alert("Failed to delete contract. Please try again.");
    }
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderUserRow = (user, isPending = false) => (
    <tr key={user._id} className="user-row">
      <td>{user.fullName}</td>
      <td>{user.username}</td>
      <td>{user.email}</td>
      <td>
        <span className={`status ${user.status}`}>{user.status}</span>
      </td>
      <td>{user.role || "Not assigned"}</td>
      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
      <td>
        <div className="user-actions">
          {isPending ? (
            <>
              <button className="approve-btn" onClick={() => setEditingUser({ ...user, action: "approve" })}>
                Approve
              </button>
              <button className="reject-btn" onClick={() => rejectUser(user._id)}>
                Reject
              </button>
            </>
          ) : (
            <>
              <button className="edit-btn" onClick={() => setEditingUser({ ...user, action: "edit" })}>
                Edit
              </button>
              <button className="delete-btn" onClick={() => deleteUser(user._id)}>
                Delete
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )

  const renderEditModal = () => (
    <div className="modal-overlay">
      <div className="modal">
        <h3>
          {editingUser.action === "approve" ? "Approve User:" : "Edit User:"} {editingUser.fullName}
        </h3>
        <div className="user-details">
          <p><strong>Username:</strong> {editingUser.username}</p>
          <p><strong>Email:</strong> {editingUser.email}</p>
          <p><strong>Status:</strong> {editingUser.status}</p>
        </div>

        <div className="role-selection">
          <label>Assign Department:</label>
          <select
            value={selectedRole || editingUser.role || ""}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="role-select"
          >
            <option value="">Select Department</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div className="modal-actions">
          {editingUser.action === "approve" ? (
            <button
              onClick={() => {
                const roleToAssign = selectedRole || editingUser.role
                if (!roleToAssign) {
                  setMessage("Error: Please select a department before approving")
                  return
                }
                approveUser(editingUser._id, roleToAssign)
              }}
              className="approve-btn-modal"
              disabled={!selectedRole && !editingUser.role}
            >
              Approve User
            </button>
          ) : (
            <button
              onClick={() => {
                const roleToAssign = selectedRole || editingUser.role
                if (!roleToAssign) {
                  setMessage("Error: Please select a department")
                  return
                }
                assignRole(editingUser._id, roleToAssign)
              }}
              className="save-btn"
              disabled={!selectedRole && !editingUser.role}
            >
              Save Changes
            </button>
          )}
          <button
            onClick={() => {
              setEditingUser(null)
              setSelectedRole("")
            }}
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )

  const renderUserManagement = () => (
    <div className="user-management">
      <div className="management-tabs">
        <button
          className={`tab ${userManagementTab === "pending" ? "active" : ""}`}
          onClick={() => setUserManagementTab("pending")}
        >
          Pending Approvals ({pendingUsers.length})
        </button>
        <button
          className={`tab ${userManagementTab === "all" ? "active" : ""}`}
          onClick={() => setUserManagementTab("all")}
        >
          All Users ({allUsers.filter((user) => user.status === "approved").length})
        </button>
      </div>

      {message && <div className="message">{message}</div>}

      <div className="users-table-container">
        <div className="table-header">
          <h3>{userManagementTab === "pending" ? "Pending User Approvals" : "All Users"}</h3>
          {userManagementTab === "all" && (
            <div className="filter-section">
              <label>Filter by Department:</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Departments</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Status</th>
                <th>Department</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {userManagementTab === "pending" ? (
                pendingUsers.length === 0 ? (
                  <tr className="no-users">
                    <td colSpan="7">No pending users</td>
                  </tr>
                ) : (
                  pendingUsers.map((user) => renderUserRow(user, true))
                )
              ) : (
                (() => {
                  const filteredUsers =
                    departmentFilter === "all"
                      ? allUsers.filter((user) => user.status === "approved")
                      : allUsers.filter((user) => user.status === "approved" && user.role === departmentFilter)

                  return filteredUsers.length === 0 ? (
                    <tr className="no-users">
                      <td colSpan="7">No users found</td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => renderUserRow(user, false))
                  )
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // ==================== DASHBOARD COMPONENTS ====================
  const renderDashboardCards = () => (
    <div className="dashboard-cards">
      <div className="dashboard-card" onClick={() => setActiveView("contracts")}>
        <div className="card-icon">📋</div>
        <div className="card-content">
          <h3>Contracts</h3>
          <div className="card-value">{dashboardStats.totalContracts}</div>
          <div className="card-label">Total Contracts</div>
        </div>
      </div>

      <div className="dashboard-card" onClick={() => setActiveView("userManagement")}>
        <div className="card-icon">👥</div>
        <div className="card-content">
          <h3>Users</h3>
          <div className="card-value">{dashboardStats.totalUsers}</div>
          <div className="card-label">Registered Users</div>
        </div>
      </div>

      <div className="dashboard-card" onClick={() => setActiveView("creative")}>
        <div className="card-icon">🎨</div>
        <div className="card-content">
          <h3>Creative</h3>
          <div className="card-value">{dashboardStats.totalInventory}</div>
          <div className="card-label">Inventory Items</div>
        </div>
      </div>

      <div className="dashboard-card" onClick={() => setActiveView("warehouse")}>
        <div className="card-icon">🏭</div>
        <div className="card-content">
          <h3>Warehouse</h3>
          <div className="card-value">{dashboardStats.totalInventory}</div>
          <div className="card-label">Inventory Items</div>
        </div>
      </div>

      <div className="dashboard-card" onClick={() => setActiveView("events")}>
        <div className="card-icon">📅</div>
        <div className="card-content">
          <h3>Events</h3>
          <div className="card-value">{dashboardStats.activeEvents}</div>
          <div className="card-label">Active Events</div>
        </div>
      </div>

      <div className="dashboard-card" onClick={() => setActiveView("finance")}>
        <div className="card-icon">💰</div>
        <div className="card-content">
          <h3>Finance</h3>
          <div className="card-value">-</div>
          <div className="card-label">Financial Overview</div>
        </div>
      </div>

      <div className="dashboard-card" onClick={() => setActiveView("linen")}>
        <div className="card-icon">🛏️</div>
        <div className="card-content">
          <h3>Linen</h3>
          <div className="card-value">{dashboardStats.totalInventory}</div>
          <div className="card-label">Inventory Items</div>
        </div>
      </div>

        
      <div className="dashboard-card" onClick={() => setActiveView("banquet")}>
        <div className="card-icon">👨‍🍳</div>
        <div className="card-content">
          <h3>Banquet</h3>
          <div className="card-value">-</div>
          <div className="card-label">Staff Management</div>
        </div>
      </div>

      <div className="dashboard-card highlight" onClick={() => setActiveView("userManagement")}>
        <div className="card-icon">⏳</div>
        <div className="card-content">
          <h3>Pending</h3>
          <div className="card-value">{dashboardStats.pendingApprovals}</div>
          <div className="card-label">Approvals Needed</div>
        </div>
      </div>
    </div>
  )

 
  
  const renderMainDashboard = () => (
    <div className="main-dashboard">
      <div className="dashboard-header">
        <h2>Admin Overview</h2>
        <p>Complete system overview and quick access to all departments</p>
      </div>
      {renderDashboardCards()}
      
      {/* Recent Activity Section */}
      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {recentActivity.length === 0 ? (
            <div className="activity-item">
              <div className="activity-content">
                <span className="activity-text">No recent activity</span>
              </div>
            </div>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-content">
                  <span className="activity-text">{activity.text}</span>
                  <span className="activity-time">
                    {new Date(activity.time).toLocaleDateString()} at {new Date(activity.time).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )

   const renderContractsView = () => {
    return (
      <div className="department-view">
        <div className="view-header">
          <h2>Contracts Management</h2>
          <button className="back-btn" onClick={() => setActiveView("dashboard")}>
            ← Back to Dashboard
          </button>
        </div>

        {message && <div className="message">{message}</div>}

        <div className="contracts-table-container">
          <div className="table-header">
            <h3>All Contracts ({contractsData.length})</h3>
          </div>

          <div className="status-tabs">
            {["All", "Draft", "For Approval", "For Accounting Review", "Active", "Completed", "Rejected"].map(status => (
              <button
                key={status}
                className={`status-tab ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
          
          <div className="contracts-table">
            <table>
              <thead>
                <tr>
                  <th>Contract Name</th>
                  <th>Client</th>
                  <th>Contract No.</th>
                  <th>Value</th>
                  <th>Event Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contractsData.length === 0 ? (
                  <tr className="no-contracts">
                    <td colSpan="7">No contracts found</td>
                  </tr>
                ) : (
                  contractsData
                    .filter(contract => statusFilter === "All" || contract.status === statusFilter)
                    .map(contract => (
                      <tr key={contract.id}>
                        <td className="clickable-cell" onClick={async () => {
                          try {
                            const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                            const data = await res.json();
                            if (res.ok) setSelectedContract(data.contract);
                          } catch (e) {}
                        }}>{contract.name}</td>
                        <td className="clickable-cell" onClick={async () => {
                          try {
                            const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                            const data = await res.json();
                            if (res.ok) setSelectedContract(data.contract);
                          } catch (e) {}
                        }}>{contract.client}</td>
                        <td className="clickable-cell" onClick={async () => {
                          try {
                            const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                            const data = await res.json();
                            if (res.ok) setSelectedContract(data.contract);
                          } catch (e) {}
                        }}>{contract.contractNumber || "-"}</td>
                        <td className="clickable-cell" onClick={async () => {
                          try {
                            const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                            const data = await res.json();
                            if (res.ok) setSelectedContract(data.contract);
                          } catch (e) {}
                        }}>₱{contract.value}</td>
                        <td className="clickable-cell" onClick={async () => {
                          try {
                            const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                            const data = await res.json();
                            if (res.ok) setSelectedContract(data.contract);
                          } catch (e) {}
                        }}>{contract.startDate}</td>
                        <td className="clickable-cell" onClick={async () => {
                          try {
                            const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                            const data = await res.json();
                            if (res.ok) setSelectedContract(data.contract);
                          } catch (e) {}
                        }}>
                          <span
                            className={`status ${contract.status.toLowerCase().replace(' ', '-')}`}
                            style={{
                              cursor: (contract.status === "Rejected" && contract.rejectionReason) ? 'pointer' : 'default'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (contract.status === "Rejected" && contract.rejectionReason) {
                                setCurrentRejectionReason(contract.rejectionReason);
                                setShowRejectionReasonModal(true);
                              }
                            }}
                            title={(contract.status === "Rejected" && contract.rejectionReason) ? contract.rejectionReason : ""}
                          >
                            {contract.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {/* View Details */}
                            <button
                              className="btn-primary small"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                                  const data = await res.json();
                                  if (res.ok) setSelectedContract(data.contract);
                                } catch (e) {}
                              }}
                            >
                              View
                            </button>

                            {/* Admin Actions Based on Status */}
                            {contract.status === "For Approval" && (
                              <>
                                <button
                                  className="btn-success small"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm("Are you sure you want to approve this contract?")) {
                                      await approveContract(contract.id);
                                    }
                                  }}
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn-warning small"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const reason = prompt("Please provide rejection reason:");
                                    if (reason) {
                                      await rejectContract(contract.id, reason);
                                    }
                                  }}
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {contract.status === "For Accounting Review" && (
                              <button
                                className="btn-success small"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (window.confirm("Are you sure you want to mark this contract as active?")) {
                                    await approveContract(contract.id);
                                  }
                                }}
                              >
                                Activate
                              </button>
                            )}

                            {/* Delete Contract (Admin can delete any contract) */}
                            <button
                              className="btn-danger small"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await deleteContract(contract.id);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };


  const renderEventsView = () => {
    return (
      <div className="department-view">
        <div className="view-header">
          <h2>Events Calendar</h2>
          <button className="back-btn" onClick={() => setActiveView("dashboard")}>
            ← Back to Dashboard
          </button>
        </div>
        <div className="calendar-view">
          {departmentData ? (
            <div className="events-list">
              <h3>Upcoming Events ({departmentData.data?.length || 0})</h3>
              {departmentData.data && departmentData.data.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Client</th>
                      <th>Date</th>
                      <th>Contract No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentData.data.map((event, index) => (
                      <tr key={index}>
                        <td>{event.page1?.occasion || "Event"}</td>
                        <td>{event.page1?.celebratorName || "N/A"}</td>
                        <td>{event.page1?.eventDate || "N/A"}</td>
                        <td>{event.contractNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No upcoming events</p>
              )}
            </div>
          ) : (
            <div className="calendar-placeholder">
              <h3>Event Calendar View</h3>
              <p>Loading events data...</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Add these finance functions to your main component
  // Add these finance functions to your main component
const fetchInvoices = async () => {
  try {
    const res = await fetch("http://localhost:5000/finance/invoices");
    if (res.ok) {
      const data = await res.json();
      setInvoices(data.invoices || []);
    }
  } catch (err) {
    console.error("Fetch invoices error:", err);
  }
};

const fetchActiveContracts = async () => {
  try {
    const res = await fetch("http://localhost:5000/contracts");
    if (res.ok) {
      const data = await res.json();
      // Filter for Active contracts on the frontend
      const activeContracts = data.contracts.filter(contract => 
        contract.status === "Active" || contract.status === "For Accounting Review"
      );
      setActiveContracts(activeContracts || []);
    }
  } catch (err) {
    console.error("Fetch active contracts error:", err);
  }
};

const generateInvoice = async (contract) => {
  try {
    const res = await fetch("http://localhost:5000/finance/invoices/generate-number");
    if (res.ok) {
      const data = await res.json();
      
      // Create a proper invoice object with all required fields
      const invoiceData = {
        contractId: contract._id,
        invoiceNumber: data.invoiceNumber,
        contractNumber: contract.contractNumber,
        client: contract.page1?.celebratorName || "Unknown Client",
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [
          {
            description: `Event Contract - ${contract.page1?.occasion || 'Contract'}`,
            quantity: 1,
            unitPrice: contract.page3?.grandTotal || 0,
            amount: contract.page3?.grandTotal || 0
          }
        ],
        totalAmount: contract.page3?.grandTotal || 0,
        status: "pending"
      };
      
      console.log("Generated invoice data:", invoiceData);
      setNewInvoice(invoiceData);
      setSelectedContract(contract);
      setShowInvoiceModal(true);
    }
  } catch (err) {
    console.error("Generate invoice error:", err);
    alert("Failed to generate invoice number");
  }
};

const createInvoice = async () => {
  try {
    const res = await fetch("http://localhost:5000/finance/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newInvoice)
    });

    if (res.ok) {
      setShowInvoiceModal(false);
      fetchInvoices();
      fetchActiveContracts(); // Refresh active contracts list
      setMessage("Invoice created successfully");
      setTimeout(() => setMessage(""), 3000);
    }
  } catch (err) {
    console.error("Create invoice error:", err);
  }
};

const markAsPaid = async (invoiceId) => {
  try {
    const res = await fetch(`http://localhost:5000/finance/invoices/${invoiceId}/mark-paid`, {
      method: "PUT"
    });

    if (res.ok) {
      fetchInvoices();
      setMessage("Invoice marked as paid");
      setTimeout(() => setMessage(""), 3000);
    }
  } catch (err) {
    console.error("Mark as paid error:", err);
  }
};

  const renderFinanceView = () => {
  const calculateFinancialStats = () => {
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    
    const pendingRevenue = invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    return {
      totalRevenue,
      pendingRevenue,
      paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
      unpaidInvoices: invoices.filter(inv => inv.status === 'pending').length,
      overdueInvoices: invoices.filter(inv => 
        inv.status === 'pending' && new Date(inv.dueDate) < new Date()
      ).length
    };
  };

  const stats = calculateFinancialStats();

  return (
    <div className="department-view">
      <div className="view-header">
        <h2>Financial Overview</h2>
        <button className="back-btn" onClick={() => setActiveView("dashboard")}>
          ← Back to Dashboard
        </button>
      </div>

      {message && <div className="message">{message}</div>}

      {/* Financial Summary Cards */}
      <div className="finance-cards">
        <div className="finance-card revenue">
          <h4>Total Revenue</h4>
          <div className="finance-value">₱{stats.totalRevenue.toLocaleString()}</div>
          <div className="finance-label">Collected Amount</div>
        </div>
        
        <div className="finance-card pending">
          <h4>Pending Revenue</h4>
          <div className="finance-value">₱{stats.pendingRevenue.toLocaleString()}</div>
          <div className="finance-label">Outstanding Invoices</div>
        </div>
        
        <div className="finance-card paid">
          <h4>Paid Invoices</h4>
          <div className="finance-value">{stats.paidInvoices}</div>
          <div className="finance-label">Completed Payments</div>
        </div>
        
        <div className="finance-card unpaid">
          <h4>Unpaid Invoices</h4>
          <div className="finance-value">{stats.unpaidInvoices}</div>
          <div className="finance-label">Pending Payments</div>
        </div>

        <div className="finance-card overdue">
          <h4>Overdue Invoices</h4>
          <div className="finance-value">{stats.overdueInvoices}</div>
          <div className="finance-label">Past Due Date</div>
        </div>
      </div>

           {/* Active Contracts Section - Table View */}
      <div className="section-container">
        <div className="section-header">
          <h3>Active Contracts Ready for Invoicing ({activeContracts.length})</h3>
        </div>

        <div className="contracts-table-container">
          <div className="contracts-table">
            <table>
              <thead>
                <tr>
                  <th>Contract Name</th>
                  <th>Client</th>
                  <th>Contract No.</th>
                  <th>Value</th>
                  <th>Event Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeContracts.length === 0 ? (
                  <tr className="no-contracts">
                    <td colSpan="7">No active contracts available for invoicing</td>
                  </tr>
                ) : (
                  activeContracts.map(contract => (
                    <tr key={contract._id}>
                      <td className="clickable-cell" onClick={async () => {
                        try {
                          const res = await fetch(`http://localhost:5000/contracts/${contract._id}`);
                          const data = await res.json();
                          if (res.ok) setSelectedContract(data.contract);
                        } catch (e) {}
                      }}>
                        {contract.page1?.occasion || contract.page1?.contractName || 'Contract'}
                      </td>
                      <td className="clickable-cell" onClick={async () => {
                        try {
                          const res = await fetch(`http://localhost:5000/contracts/${contract._id}`);
                          const data = await res.json();
                          if (res.ok) setSelectedContract(data.contract);
                        } catch (e) {}
                      }}>
                        {contract.page1?.celebratorName || contract.page1?.client || 'N/A'}
                      </td>
                      <td className="clickable-cell" onClick={async () => {
                        try {
                          const res = await fetch(`http://localhost:5000/contracts/${contract._id}`);
                          const data = await res.json();
                          if (res.ok) setSelectedContract(data.contract);
                        } catch (e) {}
                      }}>
                        {contract.contractNumber || "-"}
                      </td>
                      <td className="clickable-cell" onClick={async () => {
                        try {
                          const res = await fetch(`http://localhost:5000/contracts/${contract._id}`);
                          const data = await res.json();
                          if (res.ok) setSelectedContract(data.contract);
                        } catch (e) {}
                      }}>
                        ₱{(contract.page3?.grandTotal || 0).toLocaleString()}
                      </td>
                      <td className="clickable-cell" onClick={async () => {
                        try {
                          const res = await fetch(`http://localhost:5000/contracts/${contract._id}`);
                          const data = await res.json();
                          if (res.ok) setSelectedContract(data.contract);
                        } catch (e) {}
                      }}>
                        {contract.page1?.eventDate || 'N/A'}
                      </td>
                      <td className="clickable-cell" onClick={async () => {
                        try {
                          const res = await fetch(`http://localhost:5000/contracts/${contract._id}`);
                          const data = await res.json();
                          if (res.ok) setSelectedContract(data.contract);
                        } catch (e) {}
                      }}>
                        <span className={`status ${contract.status.toLowerCase().replace(' ', '-')}`}>
                          {contract.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-primary small"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const res = await fetch(`http://localhost:5000/contracts/${contract._id}`);
                                const data = await res.json();
                                if (res.ok) setSelectedContract(data.contract);
                              } catch (e) {}
                            }}
                          >
                            View
                          </button>
                          <button
                            className="btn-success small"
                            onClick={(e) => {
                              e.stopPropagation();
                              generateInvoice(contract);
                            }}
                          >
                            Generate Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Invoices List */}
      <div className="section-container">
        <div className="section-header">
          <h3>All Invoices ({invoices.length})</h3>
        </div>
        <div className="invoices-table">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Contract #</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="8">No invoices found</td>
                </tr>
              ) : (
                invoices.map(invoice => (
                  <tr key={invoice._id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.contractNumber}</td>
                    <td>{invoice.client}</td>
                    <td>₱{(invoice.totalAmount || 0).toLocaleString()}</td>
                    <td>{new Date(invoice.issueDate).toLocaleDateString()}</td>
                    <td className={new Date(invoice.dueDate) < new Date() && invoice.status === 'pending' ? 'overdue' : ''}>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`status ${invoice.status}`}>
                        {invoice.status}
                        {new Date(invoice.dueDate) < new Date() && invoice.status === 'pending' && ' (Overdue)'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-primary small">View</button>
                        {invoice.status === 'pending' && (
                          <button 
                            className="btn-success small"
                            onClick={() => markAsPaid(invoice._id)}
                          >
                            Mark Paid
                          </button>
                        )}
                        <button className="btn-secondary small">Download</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Generation Modal */}
      {showInvoiceModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Generate Invoice</h3>
            <div className="invoice-preview">
              <div className="invoice-header">
                <h4>Invoice #{newInvoice.invoiceNumber}</h4>
                <p><strong>Client:</strong> {selectedContract?.page1?.celebratorName}</p>
                <p><strong>Contract:</strong> {selectedContract?.page1?.occasion}</p>
              </div>
              
              <div className="invoice-details">
                <div className="form-group">
                  <label>Issue Date</label>
                  <input
                    type="date"
                    value={newInvoice.issueDate}
                    onChange={(e) => setNewInvoice({...newInvoice, issueDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="invoice-items">
                <h5>Items</h5>
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newInvoice.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.description}</td>
                        <td>{item.quantity}</td>
                        <td>₱{(item.unitPrice || 0).toLocaleString()}</td>
                        <td>₱{(item.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="invoice-total">
                <strong>Total: ₱{(newInvoice.totalAmount || 0).toLocaleString()}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={createInvoice}>
                Create Invoice
              </button>
              <button className="btn-secondary" onClick={() => setShowInvoiceModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const renderBanquetView = () => {
  const pendingRequests = equipmentRequests.filter(r => r.status === 'pending').length;
  const activeAssignments = staffAssignments.filter(a => a.status === 'assigned').length;
  const todayEvents = upcomingEvents.filter(event => {
    const eventDate = new Date(event.page1?.eventDate);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="department-view">
      <div className="view-header">
        <h2>Banquet Event Overview</h2>
        <button className="back-btn" onClick={() => setActiveView("dashboard")}>
          ← Back to Dashboard
        </button>
      </div>

      {message && <div className="message">{message}</div>}

      {/* Stats Overview - Similar to original design */}
      <div className="banquet-overview">
        <div className="banquet-stats">
          <div className="stat-card">
            <h3>Today's Events</h3>
            <div className="stat-value">{todayEvents}</div>
            <div className="stat-label">Active Now</div>
          </div>
          
          <div className="stat-card">
            <h3>Upcoming Events</h3>
            <div className="stat-value">{upcomingEvents.length}</div>
            <div className="stat-label">Next 30 Days</div>
          </div>
          
          <div className="stat-card">
            <h3>Staff Assignments</h3>
            <div className="stat-value">{activeAssignments}</div>
            <div className="stat-label">Current Tasks</div>
          </div>
          
          <div className="stat-card">
            <h3>Equipment Requests</h3>
            <div className="stat-value">{pendingRequests}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
      </div>

      {/* Action Items & Alerts Section */}
      <div className="section-container alert-section">
        <div className="section-header">
          <h3>Action Items & Alerts</h3>
        </div>
        <div className="alert-card">
          <div className="alert-value">{pendingRequests + activeAssignments}</div>
          <div className="alert-content">
            <div className="alert-title">Require Immediate Attention</div>
            <div className="alert-details">
              {pendingRequests > 0 && `${pendingRequests} equipment requests pending • `}
              {activeAssignments > 0 && `${activeAssignments} staff assignments active`}
              {(pendingRequests === 0 && activeAssignments === 0) && "All caught up!"}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div className="section-container">
        <div className="section-header">
          <h3>Upcoming Events ({upcomingEvents.length})</h3>
        </div>
        <div className="events-table">
          <table>
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Client</th>
                <th>Event Date</th>
                <th>Guest Count</th>
                <th>Venue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {upcomingEvents.length === 0 ? (
                <tr>
                  <td colSpan="6">No upcoming events</td>
                </tr>
              ) : (
                upcomingEvents.slice(0, 5).map(event => ( // Show only 5 most recent
                  <tr key={event._id}>
                    <td className="event-name">{event.page1?.occasion || 'Event'}</td>
                    <td>{event.page1?.celebratorName || 'N/A'}</td>
                    <td>{event.page1?.eventDate ? new Date(event.page1.eventDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="guest-count">{event.page1?.guestCount || 'N/A'}</td>
                    <td>{event.page1?.venue || 'N/A'}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-primary small"
                          onClick={() => {
                            const equipment = prompt("Enter equipment needed:")
                            if (equipment) {
                              requestEquipment(event._id, equipment.split(','))
                            }
                          }}
                        >
                          Request Equipment
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {upcomingEvents.length > 5 && (
            <div className="view-all-link">
              <button className="text-link">View All Events →</button>
            </div>
          )}
        </div>
      </div>

      
    </div>
  )
}
// ==================== UNIFIED DEPARTMENT RENDER FUNCTION ====================

const renderDepartmentView = () => {
  // Check if we're in an inventory view
  if (activeView.startsWith("inventory-")) {
    const department = activeView.replace("inventory-", "");
    return renderUnifiedDepartmentView(department);
  }

  // Otherwise show normal department view
  switch (activeView) {
    case "contracts":
      return renderContractsView();
    case "creative":
      return renderUnifiedDepartmentView("creative");
    case "warehouse":
      return renderUnifiedDepartmentView("warehouse");
    case "linen":
      return renderUnifiedDepartmentView("linen");
    case "stockroom":
      return renderUnifiedDepartmentView("stockroom");
    case "banquet":
      return renderBanquetView();
    case "events":
      return renderEventsView();
    case "finance":
      return renderFinanceView();
    case "userManagement":
      return renderUserManagement();
    default:
      return renderMainDashboard();
  }
};

// Update your fetchInventory function to accept department
const fetchInventory = async (department = "") => {
  try {
    let url = "http://localhost:5000/inventory-movement";
    if (department) {
      url = `http://localhost:5000/inventory?department=${department}`;
    }
    
    const res = await fetch(url);
    const data = await res.json();
    setInventoryData(data);
  } catch (err) {
    console.error("Error fetching inventory data:", err);
    setInventoryData([]);
  }
};

// Update the inventory CRUD functions

  const renderInventoryModal = () => (
  inventoryModalOpen && (
    <div className="modal-overlay" onClick={closeInventoryModal}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>
          {inventoryModalMode === "add" ? "Add Inventory Item" : "Edit Inventory Item"} - {currentInventoryDepartment}
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); saveInventoryItem(); }}>
          {["Item Code", "Item Description", "UOM", "On-hand (Start)", "Quantity", "Damages", "On-hand (End)"].map(field => (
            <div key={field} className="modal-input-group">
              <label>{field}</label>
              <input
                value={inventoryModalData[field] || ""}
                onChange={(e) => setInventoryModalData(prev => ({ ...prev, [field]: e.target.value }))}
              />
            </div>
          ))}
          <div className="modal-actions">
            <button type="submit" className="btn-save">Save</button>
            <button type="button" className="btn-cancel" onClick={closeInventoryModal}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
);

const renderInventoryTable = (department = "") => {
  return (
    <div className="contracts-table-container">
      <div className="table-actions">
        <button className="btn-add" onClick={() => openInventoryModal("add", {}, null, department)}>
          Add Item
        </button>
      </div>
      <h3>Inventory Monitoring - {department}</h3>
      {inventoryData.length === 0 ? (
        <p>No inventory data</p>
      ) : (
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Description</th>
              <th>UOM</th>
              <th>On-hand Start</th>
              <th>Quantity</th>
              <th>Damages</th>
              <th>On-hand End</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventoryData.map((item, idx) => (
              <tr key={item._id || idx}>
                <td>{item["Item Code"]}</td>
                <td>{item["Item Description"]}</td>
                <td>{item.UOM}</td>
                <td>{item["On-hand (Start)"]}</td>
                <td>{item.Quantity}</td>
                <td>{item.Damages}</td>
                <td>{item["On-hand (End)"]}</td>
                <td>
                  <button 
                    className="btn-edit" 
                    onClick={() => openInventoryModal("edit", item, idx, department)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => deleteInventoryItem(item._id, department)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

  const openInventoryModal = (mode, data = {}, index = null) => {
    setInventoryModalMode(mode);
    setInventoryModalData(data);
    setInventoryEditingIndex(index);
    setInventoryModalOpen(true);
  };

  const closeInventoryModal = () => {
    setInventoryModalOpen(false);
    setInventoryModalData({});
    setInventoryEditingIndex(null);
  };

  const saveInventoryItem = () => {
    if (inventoryModalMode === "add") {
      setInventoryData(prev => [...prev, inventoryModalData]);
    } else if (inventoryModalMode === "edit") {
      setInventoryData(prev =>
        prev.map((item, idx) => idx === inventoryEditingIndex ? inventoryModalData : item)
      );
    }
    closeInventoryModal();
  };

  const deleteInventoryItem = (idx) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setInventoryData(prev => prev.filter((_, index) => index !== idx));
    }
  };
const renderUnifiedDepartmentView = (department) => {
  // Safe access to department data with fallbacks
  const deptData = departmentData[department] || {
    contracts: [],
    inventory: [],
    fabricationRequests: [],
    stats: { activeContracts: 0, inventoryItems: 0, pendingRequests: 0, lowStockItems: 0 },
    loading: false
  };

  const departmentNames = {
    creative: "Creative",
    warehouse: "Warehouse", 
    linen: "Linen",
    stockroom: "Stockroom"
  };

  // Safe array access with fallbacks
  const pendingRequests = (deptData.fabricationRequests || []).filter(req => req.status === "pending");
  const lowStockItems = (deptData.inventory || []).filter(item => item.quantity < 10);
  const stats = deptData.stats || { activeContracts: 0, inventoryItems: 0, pendingRequests: 0, lowStockItems: 0 };

  // Show loading state
  if (deptData.loading) {
    return (
      <div className="department-view">
        <div className="view-header">
          <h2>{departmentNames[department]} Department - Admin View</h2>
          <button className="back-btn" onClick={() => setActiveView("dashboard")}>
            ← Back to Dashboard
          </button>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading {departmentNames[department]} data...</p>
        </div>
      </div>
    );
  }

  // Check if we're in inventory view for this department
  const isInventoryView = activeView === `inventory-${department}`;

  return (
    <div className="department-view">
      <div className="view-header">
        <h2>{departmentNames[department]} Department - Admin View</h2>
        <div className="header-actions">
          {isInventoryView ? (
            <button 
              className="back-btn" 
              onClick={() => setActiveView(department)}
            >
              ← Back to {departmentNames[department]}
            </button>
          ) : (
            <>
              <button className="back-btn" onClick={() => setActiveView("dashboard")}>
                ← Back to Dashboard
              </button>
              <button 
                className="nav-btn primary" 
                onClick={() => {
                  setActiveView(`inventory-${department}`);
                  fetchInventory(department);
                }}
              >
                Manage Inventory
              </button>
            </>
          )}
        </div>
      </div>

      {message && <div className="message">{message}</div>}

      {/* Show inventory table if in inventory view */}
      {isInventoryView ? (
        renderInventoryTable(department)
      ) : (
        <>
          {/* Department Overview Stats */}
          <div className="department-stats-overview">
            <div className="stat-card">
              <h3>Active Contracts</h3>
              <div className="stat-value">{stats.activeContracts}</div>
              <div className="stat-label">Requiring {departmentNames[department]} Support</div>
            </div>
            
            <div className="stat-card">
              <h3>Inventory Items</h3>
              <div className="stat-value">{stats.inventoryItems}</div>
              <div className="stat-label">Total Items in Stock</div>
            </div>
            
            <div className="stat-card">
              <h3>Pending Requests</h3>
              <div className="stat-value">{stats.pendingRequests}</div>
              <div className="stat-label">Awaiting Approval</div>
            </div>
            
            <div className="stat-card">
              <h3>Low Stock Items</h3>
              <div className="stat-value">{stats.lowStockItems}</div>
              <div className="stat-label">Need Reordering</div>
            </div>
          </div>

          {/* Pending Fabrication Requests */}
          <div className="section-container">
            <div className="section-header">
              <h3>Pending {departmentNames[department]} Requests ({pendingRequests.length})</h3>
            </div>
            <div className="fabrication-requests-table">
              <table>
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Requestor</th>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Remarks</th>
                    <th>Date Requested</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.length === 0 ? (
                    <tr>
                      <td colSpan="7">No pending {departmentNames[department].toLowerCase()} requests</td>
                    </tr>
                  ) : (
                    pendingRequests.map((req, idx) => (
                      <tr key={req._id || idx}>
                        <td>#{req._id ? req._id.slice(-6).toUpperCase() : idx}</td>
                        <td>{req.username || 'Unknown'}</td>
                        <td>{req.item || 'N/A'}</td>
                        <td>{req.quantity || 'N/A'}</td>
                        <td>{req.remarks || "—"}</td>
                        <td>{req.date || new Date().toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-success small"
                              onClick={() => handleApproveFabricationRequest(req._id, department)}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn-danger small"
                              onClick={() => handleRejectFabricationRequest(req._id, department)}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Fabrication Requests History */}
          <div className="section-container">
            <div className="section-header">
              <h3>All {departmentNames[department]} Requests ({(deptData.fabricationRequests || []).length})</h3>
            </div>
            <div className="fabrication-history-table">
              <table>
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Requestor</th>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(deptData.fabricationRequests || []).length === 0 ? (
                    <tr>
                      <td colSpan="6">No {departmentNames[department].toLowerCase()} requests found</td>
                    </tr>
                  ) : (
                    (deptData.fabricationRequests || []).map((req, idx) => (
                      <tr key={req._id || idx}>
                        <td>#{req._id ? req._id.slice(-6).toUpperCase() : idx}</td>
                        <td>{req.username || 'Unknown'}</td>
                        <td>{req.item || 'N/A'}</td>
                        <td>{req.quantity || 'N/A'}</td>
                        <td>
                          <span className={`status ${req.status || 'pending'}`}>
                            {req.status || 'pending'}
                          </span>
                        </td>
                        <td>{req.date || new Date().toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="section-container">
            <div className="section-header">
              <h3>Low Stock Alert - {departmentNames[department]}</h3>
            </div>
            <div className="low-stock-table">
              <table>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Current Stock</th>
                    <th>Minimum Required</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan="4">All {departmentNames[department].toLowerCase()} items are sufficiently stocked</td>
                    </tr>
                  ) : (
                    lowStockItems.map((item, idx) => (
                      <tr key={item._id || idx}>
                        <td>{item.itemName || `Item ${idx + 1}`}</td>
                        <td className={(item.quantity || 0) < 5 ? "critical-stock" : "low-stock"}>
                          {item.quantity || 0}
                        </td>
                        <td>10</td>
                        <td>
                          <span className={`status ${(item.quantity || 0) < 5 ? "critical" : "warning"}`}>
                            {(item.quantity || 0) < 5 ? "Critical" : "Low"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Contracts */}
          <div className="section-container">
            <div className="section-header">
              <h3>Active Contracts for {departmentNames[department]} ({(deptData.contracts || []).length})</h3>
            </div>
            <div className="contracts-table">
              <table>
                <thead>
                  <tr>
                    <th>Contract Name</th>
                    <th>Client</th>
                    <th>Contract No.</th>
                    <th>Event Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(deptData.contracts || []).length === 0 ? (
                    <tr>
                      <td colSpan="5">No active contracts requiring {departmentNames[department].toLowerCase()} support</td>
                    </tr>
                  ) : (
                    (deptData.contracts || []).slice(0, 5).map(contract => (
                      <tr key={contract.id}>
                        <td>{contract.name}</td>
                        <td>{contract.client}</td>
                        <td>{contract.contractNumber}</td>
                        <td>{contract.raw?.page1?.eventDate || 'N/A'}</td>
                        <td>
                          <button 
                            className="btn-primary small"
                            onClick={() => setSelectedContract(contract.raw)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {(deptData.contracts || []).length > 5 && (
                <div className="view-all-link">
                  <button className="text-link">View All Contracts →</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {renderInventoryModal()}
    </div>
  );
};
  const renderDepartmentDetail = (department, description) => {
    const renderDataTable = () => {
      if (!departmentData) {
        return <p>Loading {department.toLowerCase()} data...</p>;
      }

      if (departmentData.error) {
        return <p className="error">Error: {departmentData.error}</p>;
      }

      const data = departmentData.data || [];

      if (data.length === 0) {
        return <p>No data available for {department}</p>;
      }

      // Render different tables based on department
      switch (department.toLowerCase()) {
        case "creative":
          return (
            <table>
              <thead>
                <tr>
                  <th>Request Name</th>
                  <th>Contract No.</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index}>
                    <td>{item.requestName}</td>
                    <td>{item.contractNo}</td>
                    <td>{item.client}</td>
                    <td>
                      <span className={`status ${item.status?.toLowerCase().replace(' ', '-')}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{item.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );

        case "warehouse":
          return (
            <table>
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Items Count</th>
                  <th>Headers</th>
                </tr>
              </thead>
              <tbody>
                {data.map((section, index) => (
                  <tr key={index}>
                    <td>Section {index + 1}</td>
                    <td>{section.rows?.length || 0}</td>
                    <td>{section.header?.join(', ') || 'No headers'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );

        case "linen":
          return (
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Stock</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index}>
                    <td>{item.item}</td>
                    <td>{item.stock}</td>
                    <td>{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );

        default:
          return (
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index}>
                    <td>Item {index + 1}</td>
                    <td>{JSON.stringify(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
      }
    };

    return (
      <div className="department-view">
        <div className="view-header">
          <h2>{department} Department</h2>
          <button className="back-btn" onClick={() => setActiveView("dashboard")}>
            ← Back to Dashboard
          </button>
        </div>
        <div className="department-content">
          <p>{departmentData?.description || description}</p>
          <div className="inventory-table-container">
            <h3>{department} Overview</h3>
            {renderDataTable()}
          </div>
        </div>
      </div>
    );
  };

  // ==================== MAIN COMPONENT RENDER ====================
  return (
    <div className="department-dashboard">
      {/* Left Sidebar */}
      <div className="dashboard-sidebar">
        <div className="accreditation-header">
          <h1>ADMIN</h1>
          <h2>Dashboard</h2>
        </div>
        
        <div className="header-nav">
          <div className="nav-section">
            <div className="section-title">NAVIGATION</div>
            <button className={`nav-btn ${activeView === "dashboard" ? "active" : ""}`} 
                    onClick={() => setActiveView("dashboard")}>
              Overview
            </button>
            <button className={`nav-btn ${activeView === "userManagement" ? "active" : ""}`} 
                    onClick={() => setActiveView("userManagement")}>
              User Management
            </button>
            <button className={`nav-btn ${activeView.startsWith("contract") ? "active" : ""}`} 
                    onClick={() => setActiveView("contracts")}>
              Contracts
            </button>
          </div>
          
          <div className="nav-section">
            <div className="section-title">DEPARTMENTS</div>
            <button className={`nav-btn ${activeView === "creative" ? "active" : ""}`} 
                    onClick={() => setActiveView("creative")}>
              Creative
            </button>
            <button className={`nav-btn ${activeView === "warehouse" ? "active" : ""}`} 
                    onClick={() => setActiveView("warehouse")}>
              Warehouse
            </button>
            <button className={`nav-btn ${activeView === "linen" ? "active" : ""}`} 
                    onClick={() => setActiveView("linen")}>
              Linen
            </button>
            <button className={`nav-btn ${activeView === "banquet" ? "active" : ""}`} 
                  onClick={() => setActiveView("banquet")}>
            Banquet Staff
          </button>
            <button className={`nav-btn ${activeView === "events" ? "active" : ""}`} 
                    onClick={() => setActiveView("events")}>
              Events
            </button>
            <button className={`nav-btn ${activeView === "finance" ? "active" : ""}`} 
                    onClick={() => setActiveView("finance")}>
              Finance
            </button>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      {/* Main content area */}
      <div className="dashboard-content">
        {activeView === "dashboard" ? renderMainDashboard() : renderDepartmentView()}
      </div>

      {/* Modal overlay for user editing/approval */}
      {editingUser && renderEditModal()}
    </div>
  )
}

export default AdminDashboard;