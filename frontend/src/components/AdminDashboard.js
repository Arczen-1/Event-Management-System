"use client"

import { useState, useEffect } from "react"
import "./AdminDashboard.css"

function AdminDashboard({ onLogout }) {
  const [pendingUsers, setPendingUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [selectedRole, setSelectedRole] = useState("")
  const [message, setMessage] = useState("")
  const [activeView, setActiveView] = useState("dashboard") // dashboard, userManagement
  const [userManagementTab, setUserManagementTab] = useState("pending")
  const [editingUser, setEditingUser] = useState(null)
  const [departmentFilter, setDepartmentFilter] = useState("all")

  const roles = [
    "Sales",
    "Accounting",
    "Warehouse",
    "Creative",
    "Linen",
    "Logistics",
    "Kitchen",
    "Stockroom",
    "Purchasing",
    "Banquet Staff",
    "Admin",
  ]

  useEffect(() => {
    fetchPendingUsers()
    fetchAllUsers()
  }, [])

  const fetchPendingUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin/pending-users")
      if (res.ok) {
        const data = await res.json()
        setPendingUsers(data)
      } else {
        console.error("Failed to fetch pending users:", res.status)
        setMessage("Error: Failed to load pending users")
      }
    } catch (err) {
      console.error("Fetch pending users error:", err)
      setMessage("Error: Unable to connect to server")
    }
  }

  const fetchAllUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin/users")
      if (res.ok) {
        const data = await res.json()
        setAllUsers(data)
      } else {
        console.error("Failed to fetch all users:", res.status)
        setMessage("Error: Failed to load users")
      }
    } catch (err) {
      console.error("Fetch all users error:", err)
      setMessage("Error: Unable to connect to server")
    }
  }

  const approveUser = async (userId, role) => {
    // Validate inputs
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

        // Clear message after 3 seconds
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(`Error: ${data.message}`)
      }
    } catch (err) {
      console.error("Approve user error:", err)
      setMessage("Error: Unable to connect to server. Please check if the server is running.")
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

        // Clear message after 3 seconds
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(`Error: ${data.message}`)
      }
    } catch (err) {
      console.error("Reject user error:", err)
      setMessage("Error: Unable to connect to server. Please check if the server is running.")
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

        // Clear message after 3 seconds
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(`Error: ${data.message}`)
      }
    } catch (err) {
      console.error("Assign role error:", err)
      setMessage("Error: Unable to connect to server. Please check if the server is running.")
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

        // Clear message after 3 seconds
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(`Error: ${data.message}`)
      }
    } catch (err) {
      console.error("Delete user error:", err)
      setMessage("Error: Unable to connect to server. Please check if the server is running.")
    }
  }

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
          <p>
            <strong>Username:</strong> {editingUser.username}
          </p>
          <p>
            <strong>Email:</strong> {editingUser.email}
          </p>
          <p>
            <strong>Status:</strong> {editingUser.status}
          </p>
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

  const renderMainDashboard = () => (
    <div className="main-dashboard">
      <h2>Contract Status Dashboard</h2>

      <div className="contracts-table-container">
        <div className="table-header">
          <h3>All Contracts</h3>
        </div>

        <div className="contracts-table">
          <table>
            <thead>
              <tr>
                <th>Contract Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="no-contracts">
                <td colSpan="2">No contracts available</td>
              </tr>
            </tbody>
          </table>
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

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="main-navigation">
          <button
            className={`nav-btn ${activeView === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveView("dashboard")}
          >
            Contract Dashboard
          </button>
          <button
            className={`nav-btn ${activeView === "userManagement" ? "active" : ""}`}
            onClick={() => setActiveView("userManagement")}
          >
            User Management
          </button>
        </div>

        {activeView === "dashboard" ? renderMainDashboard() : renderUserManagement()}
      </div>

      {editingUser && renderEditModal()}
    </div>
  )
}

export default AdminDashboard
