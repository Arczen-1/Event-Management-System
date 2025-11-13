"use client"
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
  const [departmentData, setDepartmentData] = useState(null)
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

  const roles = [
    "Sales", "Sales Manager", "Accounting", "Warehouse", "Creative", 
    "Creative Manager", "Linen", "Logistics", "Kitchen", "Stockroom", 
    "Purchasing", "Banquet Staff", "Fabrication", "Admin",
  ]

  // ==================== LIFECYCLE HOOKS ====================
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

  // Fetch department data when specific department views become active
  useEffect(() => {
    if (activeView === "events") {
      fetchDepartmentData("events");
    } else if (activeView === "finance") {
      fetchDepartmentData("finance");
    } else if (["creative", "warehouse", "linen"].includes(activeView)) {
      fetchDepartmentData(activeView);
    }
  }, [activeView]);

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

  const fetchDepartmentData = async (department) => {
    try {
      const res = await fetch(`http://localhost:5000/admin/department-data/${department}`);
      if (res.ok) {
        const data = await res.json();
        setDepartmentData(data);
        return data;
      }
    } catch (err) {
      console.error(`Error fetching ${department} data:`, err);
    }
    return null;
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

  const renderDepartmentView = () => {
    switch (activeView) {
      case "contracts":
        return renderContractsView();
      case "creative":
        return renderDepartmentDetail("Creative", "Creative department requests and materials");
      case "warehouse":
        return renderDepartmentDetail("Warehouse", "Warehouse inventory and stock management");
      case "events":
        return renderEventsView();
      case "finance":
        return renderFinanceView();
      case "linen":
        return renderDepartmentDetail("Linen", "Linen inventory and management");
      case "userManagement":
        return renderUserManagement();
      default:
        return renderMainDashboard();
    }
  };

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
    const res = await fetch("http://localhost:5000/contracts?status=Active");
    if (res.ok) {
      const data = await res.json();
      setActiveContracts(data.contracts || []);
    }
  } catch (err) {
    console.error("Fetch active contracts error:", err);
  }
};

const generateInvoice = async (contract) => {
  try {
    const res = await fetch("http://localhost:5000/finance/invoices/generate-number");
    const data = await res.json();
    
    setNewInvoice({
      contractId: contract._id,
      invoiceNumber: data.invoiceNumber,
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
      status: "pending",
      client: contract.page1?.celebratorName,
      contractNumber: contract.contractNumber
    });
    setSelectedContract(contract);
    setShowInvoiceModal(true);
  } catch (err) {
    console.error("Generate invoice error:", err);
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
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    const pendingRevenue = invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

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

      {/* Active Contracts Section */}
      <div className="section-container">
        <div className="section-header">
          <h3>Active Contracts Ready for Invoicing</h3>
        </div>
        <div className="contracts-grid">
          {activeContracts && activeContracts.length > 0 ? (
            activeContracts.map(contract => (
              <div key={contract._id} className="contract-card">
                <div className="contract-info">
                  <h4>{contract.page1?.occasion || 'Contract'}</h4>
                  <p><strong>Client:</strong> {contract.page1?.celebratorName}</p>
                  <p><strong>Contract #:</strong> {contract.contractNumber}</p>
                  <p><strong>Amount:</strong> ₱{(contract.page3?.grandTotal || 0).toLocaleString()}</p>
                  <p><strong>Event Date:</strong> {contract.page1?.eventDate}</p>
                </div>
                <button 
                  className="btn-primary"
                  onClick={() => generateInvoice(contract)}
                >
                  Generate Invoice
                </button>
              </div>
            ))
          ) : (
            <p>No active contracts available for invoicing</p>
          )}
        </div>
      </div>

      {/* Invoices List */}
      <div className="section-container">
        <div className="section-header">
          <h3>All Invoices</h3>
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
                    <td>₱{invoice.totalAmount.toLocaleString()}</td>
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
                        <td>₱{item.unitPrice.toLocaleString()}</td>
                        <td>₱{item.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="invoice-total">
                <strong>Total: ₱{newInvoice.totalAmount.toLocaleString()}</strong>
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