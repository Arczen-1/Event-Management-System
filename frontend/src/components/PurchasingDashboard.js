import React, { useState, useEffect, useCallback } from "react";
import "./DepartmentDashboard.css";

// Helper lives outside the component so hooks don't depend on it
const isSentToPurchasing = (s) =>
  String(s || "").toLowerCase().trim() === "sent to purchasing";

// Normalize 1 creative row into the columns you render
const normalizeCreativeRow = (c) => {
  const materials = Array.isArray(c.materials) ? c.materials : [];
  const first = materials[0];

  // Item column ALWAYS shows "name (qty)" if materials exist; otherwise fallback to single item/quantity or request name
  const item = first
    ? `${first.name} (${first.quantity ?? "—"})`
    : c.item
    ? `${c.item} (${c.quantity ?? "—"})`
    : c.requestName || "—";

  return {
    requestName: c.requestName || c.name || c.title || "—",
    contractNo:
      c.contractNo ||
      c.contractNumber ||
      c.contract?.contractNumber ||
      c.contract?.contractNo ||
      "—",
    item,
    remarks: "—", // always blank for now
    date: c.dueDate || c.date || c.createdAt || null,
    status: "Pending", // always pending for purchasing queue
  };
};

function PurchasingDashboard({ onLogout }) {
  const [fabricationRequests, setFabricationRequests] = useState([]);
  const [creativeRequests, setCreativeRequests] = useState([]);

  // ----- FABRICATION -----
  const fetchFabricationRequests = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/fabrication-requests");
      const data = await res.json();
      setFabricationRequests(Array.isArray(data) ? data : data || []);
    } catch (err) {
      console.error("Error fetching fabrication requests:", err);
      setFabricationRequests([]);
    }
  }, []);

  // ----- CREATIVE (supports multiple shapes & endpoints) -----
  const fetchCreativeRequests = useCallback(async () => {
    try {
      // Try primary endpoint
      let res = await fetch("http://localhost:5000/creative-requests");
      // If backend uses the other path, fallback
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

  // Fetch once on mount
  useEffect(() => {
    fetchFabricationRequests();
    fetchCreativeRequests();
  }, [fetchFabricationRequests, fetchCreativeRequests]);

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
              </tr>
            </thead>
            <tbody>
              {fabricationRequests.length === 0 ? (
                <tr>
                  <td colSpan="6">No requests received yet.</td>
                </tr>
              ) : (
                fabricationRequests.map((r, i) => (
                  <tr key={i}>
                    <td>{r.user?.name || r.requestor?.name || "—"}</td>
                    <td>{r.item}</td>
                    <td>{r.quantity}</td>
                    <td>{r.remarks || "—"}</td>
                    <td>
                      {r.date ? new Date(r.date).toLocaleDateString() : "—"}
                    </td>
                    <td>{r.status || "Pending"}</td>
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
              </tr>
            </thead>
            <tbody>
              {creativeRequests.length === 0 ? (
                <tr>
                  <td colSpan="6">No creative requests sent to purchasing yet.</td>
                </tr>
              ) : (
                creativeRequests.map((c, i) => (
                  <tr key={i}>
                    <td>{c.requestName}</td>
                    <td>{c.contractNo}</td>
                    <td>{c.item}</td>
                    <td>{c.remarks}</td>
                    <td>{c.date ? new Date(c.date).toLocaleDateString() : "—"}</td>
                    <td>{c.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PurchasingDashboard;
