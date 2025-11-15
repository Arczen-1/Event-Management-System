import React, { useState, useEffect } from "react";
import "./DepartmentDashboard.css";

function BanquetStaffDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [page, setPage] = useState(1);
  const [activeView, setActiveView] = useState("dashboard");

  // Additional state for banquet-specific features
  const [equipmentRequests, setEquipmentRequests] = useState([]);
  const [staffAssignments, setStaffAssignments] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedEventForAssignment, setSelectedEventForAssignment] = useState(null);
  const [newAssignment, setNewAssignment] = useState({
    staffId: "",
    role: "",
    notes: ""
  });

  // Load data on mount
  useEffect(() => {
    fetchContracts();
    fetchEquipmentRequests();
    fetchStaffAssignments();
    fetchStaffMembers();
  }, []);

  // Generate random staff members if none exist
  const generateRandomStaff = () => {
    const firstNames = ["John", "Jane", "Michael", "Sarah", "David", "Lisa", "Robert", "Maria", "James", "Anna", "William", "Emily", "Daniel", "Sophia", "Christopher"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson"];
    const roles = ["Waiter", "Bartender", "Server", "Chef", "Supervisor", "Coordinator", "Cleaner", "Setup Crew"];
    
    const randomStaff = Array.from({ length: 15 }, (_, i) => ({
      id: `staff_${i + 1}`,
      name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      age: Math.floor(Math.random() * 30) + 20, // Age between 20-50
      role: roles[Math.floor(Math.random() * roles.length)],
      status: "active"
    }));
    
    setStaffMembers(randomStaff);
    localStorage.setItem("banquetStaff", JSON.stringify(randomStaff));
  };

  // Filter contracts to get upcoming events
  useEffect(() => {
    if (contracts.length > 0) {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const upcoming = contracts.filter(contract => {
        const eventDate = new Date(contract.page1?.eventDate);
        return eventDate >= today && eventDate <= thirtyDaysFromNow;
      });
      setUpcomingEvents(upcoming);
    }
  }, [contracts]);

  const fetchContracts = async () => {
    try {
      const res = await fetch("http://localhost:5000/contracts");
      const data = await res.json();
      if (res.ok) {
        setContracts(
          (data.contracts || []).filter(c => c.status === "Active").map((c) => ({
            id: c._id,
            name: (c.page1 && (c.page1.contractName || c.page1.occasion)) || "Contract",
            celebratorName: (c.page1 && c.page1.celebratorName) || "",
            contractNumber: c.contractNumber,
            page1: c.page1,
            page2: c.page2,
            page3: c.page3,
          }))
        );
      }
    } catch (e) {
      console.error("Error fetching contracts:", e);
    }
  };

  const fetchEquipmentRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/banquet/equipment-requests");
      const data = await res.json();
      setEquipmentRequests(data.requests || []);
    } catch (err) {
      console.error("Error fetching equipment requests:", err);
      setEquipmentRequests([]);
    }
  };

  const fetchStaffAssignments = async () => {
    try {
      const res = await fetch("http://localhost:5000/banquet/staff-assignments");
      const data = await res.json();
      setStaffAssignments(data.assignments || []);
    } catch (err) {
      console.error("Error fetching staff assignments:", err);
      setStaffAssignments([]);
    }
  };

  const fetchStaffMembers = () => {
    try {
      const storedStaff = localStorage.getItem("banquetStaff");
      if (storedStaff) {
        setStaffMembers(JSON.parse(storedStaff));
      } else {
        generateRandomStaff();
      }
    } catch (err) {
      console.error("Error fetching staff members:", err);
      generateRandomStaff();
    }
  };

  const requestEquipment = async (eventId, equipmentList) => {
    try {
      const res = await fetch("http://localhost:5000/banquet/equipment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          equipment: equipmentList,
          status: "pending"
        }),
      });
      
      if (res.ok) {
        setMessage("Equipment request submitted successfully!");
        fetchEquipmentRequests();
      }
    } catch (err) {
      console.error("Error requesting equipment:", err);
      setMessage("Error submitting equipment request");
    }
  };

  const createStaffAssignment = async () => {
    if (!newAssignment.staffId || !newAssignment.role) {
      alert("Please select a staff member and role");
      return;
    }

    const selectedStaff = staffMembers.find(staff => staff.id === newAssignment.staffId);
    
    const assignment = {
      id: `assignment_${Date.now()}`,
      staffId: newAssignment.staffId,
      staffName: selectedStaff.name,
      eventId: selectedEventForAssignment.id,
      eventName: selectedEventForAssignment.name,
      role: newAssignment.role,
      notes: newAssignment.notes,
      date: new Date().toISOString(),
      status: "assigned"
    };

    try {
      const res = await fetch("http://localhost:5000/banquet/staff-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignment),
      });

      if (res.ok) {
        setMessage("Staff assignment created successfully!");
        setStaffAssignments(prev => [...prev, assignment]);
        setAssignmentModalOpen(false);
        setNewAssignment({ staffId: "", role: "", notes: "" });
        setSelectedEventForAssignment(null);
      }
    } catch (err) {
      console.error("Error creating staff assignment:", err);
      setMessage("Error creating staff assignment");
    }
  };

  const updateStaffAssignment = async (assignmentId, updates) => {
    try {
      const res = await fetch(`http://localhost:5000/banquet/staff-assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        setMessage("Staff assignment updated successfully!");
        setStaffAssignments(prev => 
          prev.map(assignment => 
            assignment.id === assignmentId 
              ? { ...assignment, ...updates }
              : assignment
          )
        );
      }
    } catch (err) {
      console.error("Error updating staff assignment:", err);
      setMessage("Error updating staff assignment");
    }
  };

  const deleteStaffAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;

    try {
      const res = await fetch(`http://localhost:5000/banquet/staff-assignments/${assignmentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage("Staff assignment deleted successfully!");
        setStaffAssignments(prev => 
          prev.filter(assignment => assignment.id !== assignmentId)
        );
      }
    } catch (err) {
      console.error("Error deleting staff assignment:", err);
      setMessage("Error deleting staff assignment");
    }
  };

  const openAssignmentModal = (event) => {
    setSelectedEventForAssignment(event);
    setAssignmentModalOpen(true);
  };

  // ====== RENDER FUNCTIONS ======
  const renderDashboardView = () => {
    const pendingRequests = equipmentRequests.filter(r => r.status === 'pending').length;
    const activeAssignments = staffAssignments.filter(a => a.status === 'assigned').length;
    const todayEvents = upcomingEvents.filter(event => {
      const eventDate = new Date(event.page1?.eventDate);
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    }).length;

    return (
      <div className="dashboard-view">
        {message && <div className="message">{message}</div>}

        {/* Stats Overview */}
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
              <h3>Total Staff</h3>
              <div className="stat-value">{staffMembers.length}</div>
              <div className="stat-label">Available</div>
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
                  upcomingEvents.slice(0, 5).map(event => (
                    <tr key={event.id}>
                      <td className="event-name">{event.page1?.occasion || 'Event'}</td>
                      <td>{event.page1?.celebratorName || 'N/A'}</td>
                      <td>{event.page1?.eventDate ? new Date(event.page1.eventDate).toLocaleDateString() : 'N/A'}</td>
                      <td className="guest-count">{event.page1?.totalGuests || 'N/A'}</td>
                      <td>{event.page1?.venue || 'N/A'}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-primary small"
                            onClick={() => openAssignmentModal(event)}
                          >
                            Assign Staff
                          </button>
                          <button 
                            className="btn-secondary small"
                            onClick={async () => {
                              try {
                                const res = await fetch(`http://localhost:5000/contracts/${event.id}`);
                                const data = await res.json();
                                if (res.ok) setSelectedContract(data.contract);
                              } catch (e) {
                                console.error("Error fetching contract details:", e);
                              }
                            }}
                          >
                            View Details
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
                <button className="text-link" onClick={() => setActiveView("events")}>
                  View All Events →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEventsView = () => {
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedContracts = contracts.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="contracts-table-container">
        <div className="table-header">
          <h3>All Active Contracts</h3>
          <div className="pager">
            <button className="pager-btn" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>←</button>
            <span className="page-indicator">Page {page} of {Math.ceil(contracts.length / itemsPerPage)}</span>
            <button className="pager-btn" onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(contracts.length / itemsPerPage)}>→</button>
          </div>
        </div>
        <div className="contracts-table">
          <table>
            <thead>
              <tr>
                <th>Contract Name</th>
                <th>Celebrator/Corporate Name</th>
                <th>Contract No.</th>
                <th>Event Date</th>
                <th>Guest Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedContracts.length === 0 ? (
                <tr className="no-contracts">
                  <td colSpan="6">No active contracts available</td>
                </tr>
              ) : (
                paginatedContracts.map(contract => (
                  <tr key={contract.id} className="clickable-row">
                    <td>{contract.name}</td>
                    <td>{contract.celebratorName}</td>
                    <td>{contract.contractNumber || "-"}</td>
                    <td>{contract.page1?.eventDate ? new Date(contract.page1.eventDate).toLocaleDateString() : "N/A"}</td>
                    <td>{contract.page1?.totalGuests || "N/A"}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-review"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                              const data = await res.json();
                              if (res.ok) setSelectedContract(data.contract);
                            } catch (e) {
                              console.error("Error fetching contract details:", e);
                            }
                          }}
                        >
                          View Details
                        </button>
                        <button 
                          className="btn-primary small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAssignmentModal(contract);
                          }}
                        >
                          Assign Staff
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
    );
  };

  const renderEquipmentView = () => (
    <div className="contracts-table-container">
      <div className="table-header">
        <h3>Equipment Requests</h3>
      </div>
      <div className="equipment-table">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Equipment Needed</th>
              <th>Request Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {equipmentRequests.length === 0 ? (
              <tr>
                <td colSpan="5">No equipment requests</td>
              </tr>
            ) : (
              equipmentRequests.map((request, index) => (
                <tr key={request._id || index}>
                  <td>{request.eventName || "Event"}</td>
                  <td>{Array.isArray(request.equipment) ? request.equipment.join(", ") : request.equipment}</td>
                  <td>{request.date ? new Date(request.date).toLocaleDateString() : "N/A"}</td>
                  <td>
                    <span className={`status ${request.status}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn-secondary small">
                      Update Status
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStaffView = () => (
    <div className="contracts-table-container">
      <div className="table-header">
        <h3>Staff Database ({staffMembers.length} staff members)</h3>
      </div>
      <div className="staff-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Primary Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {staffMembers.length === 0 ? (
              <tr>
                <td colSpan="4">No staff members available</td>
              </tr>
            ) : (
              staffMembers.map((staff) => (
                <tr key={staff.id}>
                  <td className="staff-name">{staff.name}</td>
                  <td>{staff.age}</td>
                  <td>{staff.role}</td>
                  <td>
                    <span className={`status ${staff.status}`}>
                      {staff.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAssignmentsView = () => (
    <div className="contracts-table-container">
      <div className="table-header">
        <h3>Staff Assignments ({staffAssignments.length} assignments)</h3>
      </div>
      <div className="assignments-table">
        <table>
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Event</th>
              <th>Role</th>
              <th>Assignment Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffAssignments.length === 0 ? (
              <tr>
                <td colSpan="6">No staff assignments</td>
              </tr>
            ) : (
              staffAssignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="staff-name">{assignment.staffName}</td>
                  <td>{assignment.eventName}</td>
                  <td>{assignment.role}</td>
                  <td>{assignment.date ? new Date(assignment.date).toLocaleDateString() : "N/A"}</td>
                  <td>
                    <span className={`status ${assignment.status}`}>
                      {assignment.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <select 
                        value={assignment.status}
                        onChange={(e) => updateStaffAssignment(assignment.id, { status: e.target.value })}
                        className="status-select"
                      >
                        <option value="assigned">Assigned</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button 
                        className="btn-danger small"
                        onClick={() => deleteStaffAssignment(assignment.id)}
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
  );

  const renderAssignmentModal = () => (
    assignmentModalOpen && (
      <div className="modal-overlay" onClick={() => setAssignmentModalOpen(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Assign Staff to {selectedEventForAssignment?.name}</h3>
            <button className="close-btn" onClick={() => setAssignmentModalOpen(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="assignment-form">
              <div className="form-group">
                <label>Select Staff Member</label>
                <select 
                  value={newAssignment.staffId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, staffId: e.target.value }))}
                  className="form-select"
                >
                  <option value="">Choose a staff member</option>
                  {staffMembers.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.age}) - {staff.role}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Role for this Event</label>
                <input
                  type="text"
                  value={newAssignment.role}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g., Head Waiter, Bartender, etc."
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Additional Notes (Optional)</label>
                <textarea
                  value={newAssignment.notes}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any special instructions..."
                  rows="3"
                  className="form-textarea"
                />
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-primary" onClick={createStaffAssignment}>
              Create Assignment
            </button>
            <button className="btn-secondary" onClick={() => setAssignmentModalOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  );

  const renderDetailsModal = () => (
    <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Banquet Staff Contract Details</h3>
          <button className="close-btn" onClick={() => setSelectedContract(null)}>×</button>
        </div>
        <div className="modal-body">
          {selectedContract && (
            <div className="contract-details">
              <div className="detail-section">
                <h4>Contract Information</h4>
                <div className="detail-row">
                  <strong>Contract Number:</strong> {selectedContract.contractNumber}
                </div>
                <div className="detail-row">
                  <strong>Celebrator/Corporate Name:</strong> {selectedContract.page1?.celebratorName || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Date of Event:</strong> {selectedContract.page1?.eventDate || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Arrival of Guests:</strong> {selectedContract.page1?.arrivalOfGuests || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Total No. of Guests:</strong> {selectedContract.page1?.totalGuests || "N/A"}
                </div>
              </div>

              <div className="detail-section">
                <h4>Event Timeline</h4>
                <div className="detail-row">
                  <strong>Ingress Time:</strong> {selectedContract.page1?.ingressTime || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Cocktail Time:</strong> {selectedContract.page1?.cocktailTime || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Serving Time:</strong> {selectedContract.page1?.arrivalOfGuests || "N/A"}
                </div>
              </div>

              <div className="detail-section">
                <h4>Guest Breakdown</h4>
                <div className="detail-row">
                  <strong>VIP Guests:</strong> {selectedContract.page1?.vipTableType || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Regular Guests:</strong> {selectedContract.page1?.regularTableType || "N/A"}
                </div>
              </div>

              {selectedContract.page3 && (
                <div className="detail-section">
                  <h4>Menu Details</h4>
                  {selectedContract.page3.cocktailHour && (
                    <div className="detail-row">
                      <strong>Cocktail Hour:</strong> {selectedContract.page3.cocktailHour}
                    </div>
                  )}
                  {selectedContract.page3.mainEntree && (
                    <div className="detail-row">
                      <strong>Main Entrée:</strong> {selectedContract.page3.mainEntree}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setSelectedContract(null)}>Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="department-dashboard">
      {/* Left Sidebar */}
      <div className="dashboard-sidebar">
        <div className="accreditation-header">
          <h1>BANQUET STAFF</h1>
          <h2>Dashboard</h2>
        </div>
        
        <div className="header-nav">
          <div className="nav-section">
            <div className="section-title">Navigation</div>
            <button 
              className={`nav-btn ${activeView === "dashboard" ? "active" : ""}`} 
              onClick={() => setActiveView("dashboard")}
            >
              Dashboard
            </button>
            <button 
              className={`nav-btn ${activeView === "events" ? "active" : ""}`} 
              onClick={() => setActiveView("events")}
            >
              All Events
            </button>
          </div>
          
          <div className="nav-section">
            <div className="section-title">Management</div>
            <button 
              className={`nav-btn ${activeView === "equipment" ? "active" : ""}`} 
              onClick={() => setActiveView("equipment")}
            >
              Equipment
            </button>
            <button 
              className={`nav-btn ${activeView === "staff" ? "active" : ""}`} 
              onClick={() => setActiveView("staff")}
            >
              Staff Database
            </button>
            <button 
              className={`nav-btn ${activeView === "assignments" ? "active" : ""}`} 
              onClick={() => setActiveView("assignments")}
            >
              Staff Assignments
            </button>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {activeView === "dashboard" && renderDashboardView()}
        {activeView === "events" && renderEventsView()}
        {activeView === "equipment" && renderEquipmentView()}
        {activeView === "staff" && renderStaffView()}
        {activeView === "assignments" && renderAssignmentsView()}
      </div>

      {selectedContract && renderDetailsModal()}
      {renderAssignmentModal()}
    </div>
  );
}

export default BanquetStaffDashboard;