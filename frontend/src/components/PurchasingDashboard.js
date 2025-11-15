import React, { useState, useEffect, useCallback } from "react";
import "./DepartmentDashboard.css";

// ---- Helpers (no hooks deps) ----
const isSentToPurchasing = (s) =>
  String(s || "").toLowerCase().trim() === "sent to purchasing";

const normalizeCreativeRow = (c) => {
  const materials = Array.isArray(c.materials) ? c.materials : [];
  const first = materials[0];

  const item = first
    ? `${first.name} (${first.quantity ?? "—"})`
    : c.item
    ? `${c.item} (${c.quantity ?? "—"})`
    : c.requestName || "—";

  const budgetState =
    c.budget?.status || c.budgetStatus || c.approvalStatus || "Pending";

  return {
    _id: c._id || c.id,
    requestName: c.requestName || c.name || c.title || "—",
    contractNo:
      c.contractNo ||
      c.contractNumber ||
      c.contract?.contractNumber ||
      c.contract?.contractNo ||
      "—",
    item,
    remarks: c.remarks || "—",
    date: c.dueDate || c.date || c.createdAt || null,
    status: "Pending",
    department: "Creative", // Added department field
    budget: {
      status: budgetState,
      amount:
        c.budget?.amount ??
        c.budgetAmount ??
        (first?.estimatedCost ?? c.estimatedCost ?? null),
      notes: c.budget?.notes || c.budgetNotes || "",
      requestRef:
        c.budget?.requestRef ||
        c.requestRef ||
        c.reference ||
        (c._id || c.id || null),
      source: "creative",
    },
  };
};

const normalizeFabricationRow = (r) => {
  const userName = r.user?.name || r.requestor?.name || "—";
  const budgetState =
    r.budget?.status || r.budgetStatus || r.approvalStatus || "Pending";
  return {
    _id: r._id || r.id,
    requestor: userName,
    item: r.item,
    quantity: r.quantity,
    remarks: r.remarks || "—",
    date: r.date || r.createdAt || null,
    status: r.status || "Pending",
    department: "Warehouse", // Added department field
    budget: {
      status: budgetState,
      amount: r.budget?.amount ?? r.budgetAmount ?? r.estimatedCost ?? null,
      notes: r.budget?.notes || r.budgetNotes || "",
      requestRef: r.budget?.requestRef || r.reference || r._id || r.id || null,
      source: "fabrication",
    },
  };
};

// ====== Budget Form Modal ======
function BudgetFormModal({
  open,
  mode,
  initialAmount,
  onCancel,
  onSubmit,
  readOnlyAmount = false,
  title = "",
}) {
  const [amount, setAmount] = useState(
    initialAmount != null ? String(initialAmount) : ""
  );
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setAmount(initialAmount != null ? String(initialAmount) : "");
  }, [initialAmount, open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title || (mode === "approve" ? "Approve Budget" : "Reject Budget")}</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <div className="create-contract-form" style={{ marginTop: 0 }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit({
                  amount: amount?.trim(),
                  notes: notes?.trim(),
                });
              }}
            >
              {mode === "approve" && (
                <div className="form-row" style={{ justifyContent: "center" }}>
                  <div className="form-group" style={{ textAlign: "center", width: "100%" }}>
                    <label>Approved Amount (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      readOnly={readOnlyAmount}
                      required
                      style={{
                        maxWidth: 380,
                        width: "100%",
                        margin: "0 auto",
                        textAlign: "center",
                        display: "block",
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="form-group" style={{ textAlign: "center" }}>
                <label>
                  {mode === "approve" ? "Notes (optional)" : "Rejection Notes (optional)"}
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    mode === "approve"
                      ? "Terms, supplier, PO ref, etc."
                      : "Why rejected, next steps, etc."
                  }
                  style={{
                    maxWidth: 700,
                    width: "100%",
                    margin: "0 auto",
                    display: "block",
                  }}
                />
              </div>

              <div className="form-actions" style={{ justifyContent: "center" }}>
                <button type="submit" className="btn-primary">
                  {mode === "approve" ? "Approve" : "Reject"}
                </button>
                <button type="button" className="btn-secondary" onClick={onCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====== Main Purchasing Dashboard ======
function PurchasingDashboard({ onLogout }) {
  const [fabricationRequests, setFabricationRequests] = useState([]);
  const [creativeRequests, setCreativeRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]); // Combined requests
  const [loadingActionId, setLoadingActionId] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [departmentFilter, setDepartmentFilter] = useState("all"); // Filter state

  // modal state
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetModalMode, setBudgetModalMode] = useState("approve");
  const [activeRow, setActiveRow] = useState(null);
  const [activeSource, setActiveSource] = useState(null);

  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalPurchaseOrders: 0,
    recentActivities: []
  });

  // ----- Fetch: FABRICATION -----
  const fetchFabricationRequests = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/fabrication-requests");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data || [];
      const normalized = list.map(normalizeFabricationRow);
      setFabricationRequests(normalized);
      return normalized;
    } catch (err) {
      console.error("Error fetching fabrication requests:", err);
      setFabricationRequests([]);
      return [];
    }
  }, []);

  // ----- Fetch: CREATIVE -----
  const fetchCreativeRequests = useCallback(async () => {
    try {
      let res = await fetch("http://localhost:5000/creative-requests");
      if (!res.ok) {
        res = await fetch("http://localhost:5000/creativeRequests");
      }
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : data?.creativeRequests || data?.requests || [];
      const filtered = list
        .filter((req) => isSentToPurchasing(req.status))
        .map(normalizeCreativeRow);
      setCreativeRequests(filtered);
      return filtered;
    } catch (err) {
      console.error("Error fetching creative requests:", err);
      setCreativeRequests([]);
      return [];
    }
  }, []);

  // ----- Combine and sort all requests -----
  useEffect(() => {
    const combined = [...fabricationRequests, ...creativeRequests]
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    setAllRequests(combined);
  }, [fabricationRequests, creativeRequests]);

  // ----- Filter requests by department -----
  const filteredRequests = departmentFilter === "all" 
    ? allRequests 
    : allRequests.filter(req => req.department === departmentFilter);

  // ----- Fetch Purchase Orders -----
  const fetchPurchaseOrders = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/purchase-orders");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Error fetching purchase orders:", err);
      return [];
    }
  }, []);

  // ----- Calculate Dashboard Stats -----
  const calculateDashboardStats = useCallback((fabRequests, creativeReqs, purchaseOrders) => {
    const allRequests = [...fabRequests, ...creativeReqs];
    
    const totalPending = allRequests.filter(req => 
      req.budget?.status?.toLowerCase() === 'pending'
    ).length;
    
    const totalApproved = allRequests.filter(req => 
      req.budget?.status?.toLowerCase() === 'approved'
    ).length;
    
    const totalRejected = allRequests.filter(req => 
      req.budget?.status?.toLowerCase() === 'rejected'
    ).length;

    // Generate recent activities
    const recentActivities = allRequests
      .slice(0, 5)
      .map(req => ({
        id: req._id,
        type: req.department === 'Creative' ? 'Creative Request' : 'Fabrication Request',
        title: req.department === 'Creative' ? req.requestName : `${req.requestor} - ${req.item}`,
        status: req.budget?.status || 'Pending',
        date: req.date || new Date().toISOString(),
        amount: req.budget?.amount,
        department: req.department
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      totalPending,
      totalApproved,
      totalRejected,
      totalPurchaseOrders: purchaseOrders.length,
      recentActivities
    };
  }, []);

  // ----- Lifecycle -----
  useEffect(() => {
    const loadData = async () => {
      const [fabRequests, creativeReqs, purchaseOrders] = await Promise.all([
        fetchFabricationRequests(),
        fetchCreativeRequests(),
        fetchPurchaseOrders()
      ]);
      
      const stats = calculateDashboardStats(fabRequests, creativeReqs, purchaseOrders);
      setDashboardStats(stats);
    };

    loadData();
  }, [fetchFabricationRequests, fetchCreativeRequests, fetchPurchaseOrders, calculateDashboardStats]);

  // ----- Budget Actions -----
  const applyOptimisticBudget = (collection, setCollection, id, nextBudget) => {
    setCollection((prev) =>
      prev.map((row) =>
        row._id === id ? { ...row, budget: { ...row.budget, ...nextBudget } } : row
      )
    );
  };

  const approveBudget = async ({ id, source, amount, notes }) => {
    const endpoint = "http://localhost:5000/purchasing/budget/approve";
    const payload = { id, source, amount: Number(amount), notes };

    try {
      setLoadingActionId(id);
      const nextBudget = { status: "Approved", amount: Number(amount), notes };
      if (source === "creative") {
        applyOptimisticBudget(creativeRequests, setCreativeRequests, id, nextBudget);
      } else {
        applyOptimisticBudget(fabricationRequests, setFabricationRequests, id, nextBudget);
      }

      await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Refresh dashboard stats
      const [fabRequests, creativeReqs, purchaseOrders] = await Promise.all([
        fetchFabricationRequests(),
        fetchCreativeRequests(),
        fetchPurchaseOrders()
      ]);
      const stats = calculateDashboardStats(fabRequests, creativeReqs, purchaseOrders);
      setDashboardStats(stats);

    } catch (e) {
      console.error("Approve budget failed:", e);
      fetchCreativeRequests();
      fetchFabricationRequests();
      alert("Failed to approve budget. Refreshed lists from server.");
    } finally {
      setLoadingActionId(null);
    }
  };

  const rejectBudget = async ({ id, source, notes }) => {
    const endpoint = "http://localhost:5000/purchasing/budget/reject";
    const payload = { id, source, notes };

    try {
      setLoadingActionId(id);
      const nextBudget = { status: "Rejected", notes };
      if (source === "creative") {
        applyOptimisticBudget(creativeRequests, setCreativeRequests, id, nextBudget);
      } else {
        applyOptimisticBudget(fabricationRequests, setFabricationRequests, id, nextBudget);
      }

      await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Refresh dashboard stats
      const [fabRequests, creativeReqs, purchaseOrders] = await Promise.all([
        fetchFabricationRequests(),
        fetchCreativeRequests(),
        fetchPurchaseOrders()
      ]);
      const stats = calculateDashboardStats(fabRequests, creativeReqs, purchaseOrders);
      setDashboardStats(stats);

    } catch (e) {
      console.error("Reject budget failed:", e);
      fetchCreativeRequests();
      fetchFabricationRequests();
      alert("Failed to reject budget. Refreshed lists from server.");
    } finally {
      setLoadingActionId(null);
    }
  };

  const openApproveModal = (row) => {
    setActiveRow(row);
    setActiveSource(row?.budget?.source || null);
    setBudgetModalMode("approve");
    setBudgetModalOpen(true);
  };

  const openRejectModal = (row) => {
    setActiveRow(row);
    setActiveSource(row?.budget?.source || null);
    setBudgetModalMode("reject");
    setBudgetModalOpen(true);
  };

  // Compute UI-facing status
  const computeDisplayStatus = (row) => {
    const b = (row && row.budget?.status) || "";
    const lb = String(b).toLowerCase();
    if (lb === "approved") return "Sent to Accounting";
    if (lb === "rejected") return "Rejected";
    return row.status || "Pending";
  };

  // Budget cell
  const BudgetCell = ({ row }) => {
    const { amount, notes } = row.budget || {};
    return (
      <div className="budget-cell">
        <div className="budget-meta">
          <div>Amount: {amount != null ? `₱${Number(amount).toLocaleString()}` : "—"}</div>
          <div className="notes">Notes: {notes ? notes : "—"}</div>
        </div>
      </div>
    );
  };

  // Actions cell
  const ActionCell = ({ row }) => {
    const bStatus = String(row?.budget?.status || "").toLowerCase();
    const isPending = bStatus === "pending";
    const isBusy = loadingActionId === row._id;

    return (
      <div className="btn-group">
        <button
          disabled={!isPending || isBusy}
          className="btn-approve"
          onClick={() => openApproveModal(row)}
        >
          {isBusy ? "Saving..." : "Approve"}
        </button>
        <button
          disabled={!isPending || isBusy}
          className="btn-reject"
          onClick={() => openRejectModal(row)}
        >
          Reject
        </button>
      </div>
    );
  };

  // ====== RENDER FUNCTIONS ======
  const renderDashboardView = () => (
    <div className="dashboard-view">
      {/* Stats Cards */}
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="card-icon"></div>
          <div className="card-content">
            <div className="card-value">{dashboardStats.totalPending}</div>
            <div className="card-label">Pending Requests</div>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="card-icon"></div>
          <div className="card-content">
            <div className="card-value">{dashboardStats.totalApproved}</div>
            <div className="card-label">Approved Budgets</div>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="card-icon"></div>
          <div className="card-content">
            <div className="card-value">{dashboardStats.totalRejected}</div>
            <div className="card-label">Rejected Requests</div>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="card-icon"></div>
          <div className="card-content">
            <div className="card-value">{dashboardStats.totalPurchaseOrders}</div>
            <div className="card-label">Purchase Orders</div>
          </div>
        </div>
      </div>

      {/* Recent Activities - Notification Board */}
      <div className="recent-activity">
        <h3>Recent Activities</h3>
        <div className="activity-list">
          {dashboardStats.recentActivities.length === 0 ? (
            <p>No recent activities</p>
          ) : (
            dashboardStats.recentActivities.map((activity, index) => (
              <div key={activity.id || index} className="activity-item">
                <div className="activity-icon">
                  {activity.status === 'approved' ? '✅' : 
                   activity.status === 'rejected' ? '❌' : '⏳'}
                </div>
                <div className="activity-content">
                  <span className="activity-text">
                    <strong>{activity.type}</strong>: {activity.title}
                  </span>
                  <span className="activity-time">
                    Dept: {activity.department} • Status: {activity.status} • 
                    {activity.amount ? ` ₱${Number(activity.amount).toLocaleString()}` : ' No amount'} • 
                    {new Date(activity.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderRequestsView = () => (
    <div className="contracts-table-container">
      <div className="table-header">
        <h3>All Requests</h3>
        <div className="filter-section">
          <label>Filter by Department:</label>
          <select 
            value={departmentFilter} 
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Departments</option>
            <option value="Creative">Creative</option>
            <option value="Warehouse">Warehouse</option>
          </select>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Department</th>
            <th>Requestor/Name</th>
            <th>Contract No.</th>
            <th>Item and Quantity</th>
            <th>Remarks</th>
            <th>Date</th>
            <th>Status</th>
            <th>Budget</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRequests.length === 0 ? (
            <tr>
              <td colSpan="9">No requests found</td>
            </tr>
          ) : (
            filteredRequests.map((request, i) => (
              <tr key={request._id || i}>
                <td>
                  <span className={`department-badge ${request.department.toLowerCase()}`}>
                    {request.department}
                  </span>
                </td>
                <td>
                  {request.department === 'Creative' 
                    ? request.requestName 
                    : request.requestor}
                </td>
                <td>{request.contractNo}</td>
                <td>{request.item}</td>
                <td>{request.remarks}</td>
                <td>{request.date ? new Date(request.date).toLocaleDateString() : "—"}</td>
                <td>{computeDisplayStatus(request)}</td>
                <td><BudgetCell row={request} /></td>
                <td><ActionCell row={request} /></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderReportsView = () => (
    <div className="contracts-table-container">
      <div className="table-header">
        <h3>Request Reports</h3>
      </div>
      <div className="reports-placeholder">
        <p>Request reports and analytics will be displayed here.</p>
        <p>This section can show approved budgets, spending trends, and vendor performance.</p>
      </div>
    </div>
  );

  return (
    <div className="department-dashboard">
      {/* Left Sidebar - Warehouse Style */}
      <div className="dashboard-sidebar">
        <div className="accreditation-header">
          <h1>PURCHASING</h1>
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
              className={`nav-btn ${activeView === "requests" ? "active" : ""}`} 
              onClick={() => setActiveView("requests")}
            >
              All Requests
            </button>
          </div>
          
          <div className="nav-section">
            <div className="section-title">Reports</div>
            <button 
              className={`nav-btn ${activeView === "reports" ? "active" : ""}`} 
              onClick={() => setActiveView("reports")}
            >
              Requests Reports
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
        {activeView === "requests" && renderRequestsView()}
        {activeView === "reports" && renderReportsView()}
      </div>

      {/* Modal for Approve/Reject */}
      <BudgetFormModal
        open={budgetModalOpen}
        mode={budgetModalMode}
        initialAmount={budgetModalMode === "approve" ? activeRow?.budget?.amount ?? "" : ""}
        title={budgetModalMode === "approve" ? "Approve Budget" : "Reject Budget"}
        onCancel={() => {
          setBudgetModalOpen(false);
          setActiveRow(null);
          setActiveSource(null);
        }}
        onSubmit={async ({ amount, notes }) => {
          const id = activeRow?._id;
          const source = activeSource;
          setBudgetModalOpen(false);

          if (budgetModalMode === "approve") {
            if (amount === "" || isNaN(Number(amount))) {
              alert("Please enter a valid amount.");
              return;
            }
            await approveBudget({ id, source, amount, notes });
          } else {
            await rejectBudget({ id, source, notes });
          }

          setActiveRow(null);
          setActiveSource(null);
        }}
      />
    </div>
  );
}

export default PurchasingDashboard;