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
    budget: {
      status: budgetState,
      amount: r.budget?.amount ?? r.budgetAmount ?? r.estimatedCost ?? null,
      notes: r.budget?.notes || r.budgetNotes || "",
      requestRef: r.budget?.requestRef || r.reference || r._id || r.id || null,
      source: "fabrication",
    },
  };
};

// ====== Budget Form Modal (centered fields) ======
function BudgetFormModal({
  open,
  mode, // "approve" | "reject"
  initialAmount, // number | null
  onCancel,
  onSubmit, // ({amount, notes})
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
  const [loadingActionId, setLoadingActionId] = useState(null);

  // modal state
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetModalMode, setBudgetModalMode] = useState("approve"); // approve | reject
  const [activeRow, setActiveRow] = useState(null); // row object
  const [activeSource, setActiveSource] = useState(null); // "creative" | "fabrication"

  // ----- Fetch: FABRICATION -----
  const fetchFabricationRequests = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/fabrication-requests");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data || [];
      setFabricationRequests(list.map(normalizeFabricationRow));
    } catch (err) {
      console.error("Error fetching fabrication requests:", err);
      setFabricationRequests([]);
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
    } catch (err) {
      console.error("Error fetching creative requests:", err);
      setCreativeRequests([]);
    }
  }, []);

  // ----- Lifecycle -----
  useEffect(() => {
    fetchFabricationRequests();
    fetchCreativeRequests();
  }, [fetchFabricationRequests, fetchCreativeRequests]);

  // ----- Budget Actions (Approve/Reject) -----
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

  // Compute UI-facing status:
  // If budget Approved -> "Sent to Accounting"
  // If budget Rejected -> "Rejected"
  // Else use row.status (default "Pending")
  const computeDisplayStatus = (row) => {
    const b = (row && row.budget?.status) || "";
    const lb = String(b).toLowerCase();
    if (lb === "approved") return "Sent to Accounting";
    if (lb === "rejected") return "Rejected";
    return row.status || "Pending";
  };

  // Budget-only cell (no status badge here)
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

  // Separate actions cell
  const ActionCell = ({ row }) => {
    const bStatus = String(row?.budget?.status || "").toLowerCase();
    const isPending = bStatus === "pending";
    return (
      <div className="budget-actions" style={{ display: "flex", gap: 8 }}>
        <button
          disabled={!isPending || loadingActionId === row._id}
          className="btn btn-approve"
          onClick={() => openApproveModal(row)}
        >
          {loadingActionId === row._id ? "Saving..." : "Approve"}
        </button>
        <button
          disabled={!isPending || loadingActionId === row._id}
          className="btn btn-reject"
          onClick={() => openRejectModal(row)}
        >
          Reject
        </button>
      </div>
    );
  };

  return (
    <div className="department-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Purchasing Dashboard</h1>
          <button onClick={onLogout} className="logout-btn header-logout">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* === FABRICATION REQUESTS SECTION === */}
        <div className="contracts-table-container">
          <div className="table-header">
            <h3>Incoming Fabrication Requests</h3>
          </div>

          <table>
            <thead>
              <tr>
                <th>Requestor</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Remarks</th>
                <th>Date</th>
                <th>Status</th>
                <th>Budget</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fabricationRequests.length === 0 ? (
                <tr>
                  <td colSpan="8">No requests received yet.</td>
                </tr>
              ) : (
                fabricationRequests.map((r, i) => (
                  <tr key={r._id || i}>
                    <td>{r.requestor}</td>
                    <td>{r.item}</td>
                    <td>{r.quantity}</td>
                    <td>{r.remarks}</td>
                    <td>{r.date ? new Date(r.date).toLocaleDateString() : "—"}</td>
                    <td>{computeDisplayStatus(r)}</td>
                    <td><BudgetCell row={r} /></td>
                    <td><ActionCell row={r} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* === CREATIVE REQUESTS SECTION === */}
        <div className="contracts-table-container" style={{ marginTop: "40px" }}>
          <div className="table-header">
            <h3>Incoming Creatives Request</h3>
          </div>

          <table>
            <thead>
              <tr>
                <th>Request Name</th>
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
              {creativeRequests.length === 0 ? (
                <tr>
                  <td colSpan="8">No creative requests sent to purchasing yet.</td>
                </tr>
              ) : (
                creativeRequests.map((c, i) => (
                  <tr key={c._id || i}>
                    <td>{c.requestName}</td>
                    <td>{c.contractNo}</td>
                    <td>{c.item}</td>
                    <td>{c.remarks}</td>
                    <td>{c.date ? new Date(c.date).toLocaleDateString() : "—"}</td>
                    <td>{computeDisplayStatus(c)}</td>
                    <td><BudgetCell row={c} /></td>
                    <td><ActionCell row={c} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Approve/Reject (Creative-style) */}
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
