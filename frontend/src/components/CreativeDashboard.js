import React, { useState, useEffect } from "react";
import "./SalesManagerDashboard.css";

function CreativeDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]); // mapped list (same shape as SalesDashboard)
  const [creativeRequests, setCreativeRequests] = useState([]); // creative requests from backend
  const [showForm, setShowForm] = useState(false);
  const [activeContract, setActiveContract] = useState(null);
  const [newRequest, setNewRequest] = useState({
    requestTitle: "",
    materialsNeeded: "",
    designer: "",
    dueDate: "",
    status: "Draft",
  });

  useEffect(() => {
    fetchContracts();
    fetchCreativeRequests();
  }, []);

  // --- Fetch contracts (map to same shape as SalesDashboard) ---
  const fetchContracts = async () => {
    try {
      const res = await fetch("http://localhost:5000/contracts");
      const data = await res.json();
      // data might be { contracts: [...] } or an array; normalize
      const raw = Array.isArray(data) ? data : data.contracts || [];
      const mapped = raw.map((c) => ({
        id: c._id,
        // same naming logic as SalesDashboard so contract name & client show correctly
        name: (c.page1 && (c.page1.contractName || c.page1.occasion)) || "Contract",
        client: (c.page1 && (c.page1.celebratorName || c.page1.client || c.page1.clientName)) || "",
        value: (c.page3 && c.page3.grandTotal) || (c.page1 && c.page1.value) || "",
        startDate: (c.page1 && (c.page1.eventDate || c.page1.startDate)) || "",
        endDate: (c.page1 && (c.page1.eventDate || c.page1.endDate)) || "",
        status: c.status || "Draft",
        contractNumber: c.contractNumber,
        raw // keep raw contract if you need full details
      }));
      setContracts(mapped);
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setContracts([]);
    }
  };

  // --- Fetch creative requests (handle both shapes) ---
  const fetchCreativeRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/creativeRequests");
      const data = await res.json();
      // backend might return array or { requests: [...] } or { request: ... } — normalize
      let arr = [];
      if (Array.isArray(data)) arr = data;
      else if (Array.isArray(data.requests)) arr = data.requests;
      else if (Array.isArray(data.creativeRequests)) arr = data.creativeRequests;
      else if (data.request) arr = [data.request];
      else arr = [];
      setCreativeRequests(arr);
    } catch (err) {
      console.error("Error fetching creative requests:", err);
      setCreativeRequests([]);
    }
  };

  const handleInputChange = (e) => {
    setNewRequest({
      ...newRequest,
      [e.target.name]: e.target.value,
    });
  };

  // --- Create creative request (send contract details + request fields) ---
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!activeContract) {
      alert("Please select a contract first (Add Creative Request button).");
      return;
    }

    try {
      const payload = {
        // match backend schema: requestTitle, materialsNeeded, designer, dueDate, status
        requestTitle: newRequest.requestTitle,
        materialsNeeded: newRequest.materialsNeeded,
        designer: newRequest.designer,
        dueDate: newRequest.dueDate,
        status: newRequest.status || "Draft",

        // forward contract fields (store them on creative request)
        contractId: activeContract.raw?._id || activeContract.id,
        contractName: activeContract.name,
        client: activeContract.client,
        contractNo: activeContract.contractNumber,
        startDate: activeContract.startDate,
        endDate: activeContract.endDate,
      };

      const res = await fetch("http://localhost:5000/creativeRequests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create request");

      // backend might return { request } or the request object itself
      const created = data.request || data.createdRequest || data;
      // append to the list and reset
      setCreativeRequests((prev) => [...prev, created]);
      setShowForm(false);
      setActiveContract(null);
      setNewRequest({
        requestTitle: "",
        materialsNeeded: "",
        designer: "",
        dueDate: "",
        status: "Draft",
      });
    } catch (err) {
      console.error("Create request error:", err);
      alert("Failed to create request: " + (err.message || ""));
    }
  };

  // --- Helpers for rendering / filtering ---
  const statusClass = (s = "") => s.toLowerCase().replace(/\s+/g, "-");

  // Spacing container style: keep everything aligned with Sales dashboard container
  // (You can also add a CSS class to SalesManagerDashboard.css if you prefer)
  const sectionStyle = { marginTop: "28px" };

  const renderContractsTable = () => (
    <div className="contracts-table-container">
      <div className="table-header">
        <h3>Contracts from Sales</h3>
      </div>

      <div className="contracts-table">
        <table>
          <thead>
            <tr>
              <th>Contract Name</th>
              <th>Client</th>
              <th>Contract No.</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr className="no-contracts">
                <td colSpan="7">No contracts found</td>
              </tr>
            ) : (
              contracts.map((c) => (
                <tr key={c.id}>
                  {/* Use clickable-cell style from SalesDashboard so details open consistently */}
                  <td className="clickable-cell">{c.name}</td>
                  <td className="clickable-cell">{c.client}</td>
                  <td className="clickable-cell">{c.contractNumber || "-"}</td>
                  <td className="clickable-cell">{c.startDate ? String(c.startDate).slice(0, 10) : ""}</td>
                  <td className="clickable-cell">{c.endDate ? String(c.endDate).slice(0, 10) : ""}</td>
                  <td>
                    <span className={`status ${statusClass(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="action-btn primary"
                      onClick={() => {
                        setActiveContract(c);
                        setShowForm(true);
                        // populate request title default from contract name
                        setNewRequest((prev) => ({ ...prev, requestTitle: c.name }));
                      }}
                    >
                      Add Creative Request
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

  const renderCreateForm = () => (
    <div className="create-contract-form">
      <h3>
        {activeContract ? `Create Creative Request for: ${activeContract.name}` : "Create Creative Request"}
      </h3>

      <form onSubmit={handleCreateRequest}>
        <div className="form-row">
          <div className="form-group">
            <label>Request Title</label>
            <input
              type="text"
              name="requestTitle"
              value={newRequest.requestTitle}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Designer Assigned</label>
            <input
              type="text"
              name="designer"
              value={newRequest.designer}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Materials Needed (detail each item)</label>
          <textarea
            name="materialsNeeded"
            value={newRequest.materialsNeeded}
            onChange={handleInputChange}
            rows={4}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={newRequest.dueDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={newRequest.status} onChange={handleInputChange}>
              <option value="Draft">Draft</option>
              <option value="For Approval">For Approval</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">Submit Request</button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setShowForm(false);
              setActiveContract(null);
              setNewRequest({
                requestTitle: "",
                materialsNeeded: "",
                designer: "",
                dueDate: "",
                status: "Draft",
              });
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const renderRequestsTable = () => (
    <div className="contracts-table-container" style={sectionStyle}>
      <div className="table-header">
        <h3>Creative Requests</h3>
      </div>

      <div className="contracts-table">
        <table>
          <thead>
            <tr>
              <th>Request Title</th>
              <th>Contract</th>
              <th>Client</th>
              <th>Materials Needed</th>
              <th>Designer</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {creativeRequests.length === 0 ? (
              <tr className="no-contracts">
                <td colSpan="7">No creative requests yet</td>
              </tr>
            ) : (
              creativeRequests.map((r, idx) => (
                <tr key={r._id || idx}>
                  <td>{r.requestTitle || r.requestName || r.title || ""}</td>
                  <td>{r.contractName || r.contractNo || ""}</td>
                  <td>{r.client || ""}</td>
                  <td style={{ maxWidth: 240, whiteSpace: "pre-wrap" }}>{r.materialsNeeded}</td>
                  <td>{r.designer}</td>
                  <td>{r.dueDate ? String(r.dueDate).slice(0, 10) : ""}</td>
                  <td>
                    <span className={`status ${statusClass(r.status)}`}>
                      {r.status}
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

  return (
    <div className="sales-manager-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Creatives Department Dashboard</h1>
          <button onClick={onLogout} className="logout-btn header-logout">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        {showForm ? renderCreateForm() : (
          <>
            {renderContractsTable()}
            {renderRequestsTable()}
          </>
        )}
      </div>
    </div>
  );
}

export default CreativeDashboard;
