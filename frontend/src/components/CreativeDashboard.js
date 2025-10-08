import React, { useState, useEffect } from "react";
import "./SalesManagerDashboard.css";

function CreativeDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [creativeRequests, setCreativeRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeContract, setActiveContract] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [newRequest, setNewRequest] = useState({
    requestName: "",
    materialsNeeded: "",
    designer: "",
    dueDate: "",
    status: "Draft",
  });

  useEffect(() => {
    fetchContracts();
    fetchCreativeRequests();
  }, []);

  const fetchContracts = async () => {
    try {
      const res = await fetch("http://localhost:5000/contracts");
      const data = await res.json();
      const raw = Array.isArray(data) ? data : data.contracts || [];
      const mapped = raw.map((c) => ({
        id: c._id,
        name: (c.page1 && (c.page1.contractName || c.page1.occasion)) || "Contract",
        client: (c.page1 && (c.page1.celebratorName || c.page1.client || c.page1.clientName)) || "",
        value: (c.page3 && c.page3.grandTotal) || (c.page1 && c.page1.value) || "",
        startDate: (c.page1 && (c.page1.eventDate || c.page1.startDate)) || "",
        endDate: (c.page1 && (c.page1.eventDate || c.page1.endDate)) || "",
        status: c.status || "Draft",
        contractNumber: c.contractNumber,
        raw,
      }));
      setContracts(mapped);
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setContracts([]);
    }
  };

  const fetchCreativeRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/creativeRequests");
      const data = await res.json();
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

  // --- Helper: convert textarea string to array of material objects ---
  const parseMaterials = (input) => {
    if (!input.trim()) return [];
    return input
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(.*?)(?:\((\d+)\))?$/);
        return {
          name: match ? match[1].trim() : line,
          quantity: match && match[2] ? Number(match[2]) : 1,
          notes: "",
        };
      });
  };

  // --- Helper: convert materials array to textarea string ---
  const formatMaterials = (materials) => {
    if (!Array.isArray(materials)) return "";
    return materials.map((m) => `${m.name} (${m.quantity})`).join("\n");
  };

  // --- Create or update creative request ---
  const handleCreateOrUpdateRequest = async (e) => {
    e.preventDefault();
    try {
      const materialsArray = parseMaterials(newRequest.materialsNeeded);

      if (editingRequest) {
        const res = await fetch(`http://localhost:5000/creativeRequests/${editingRequest._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newRequest,
            requestName: newRequest.requestName,
            materials: materialsArray,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update request");
        setCreativeRequests((prev) =>
          prev.map((r) => (r._id === editingRequest._id ? data.updatedRequest || data : r))
        );
        setEditingRequest(null);
      } else {
        if (!activeContract) {
          alert("Please select a contract first (Add Creative Request button).");
          return;
        }

        const payload = {
          requestName: newRequest.requestName,
          designer: newRequest.designer,
          dueDate: newRequest.dueDate,
          status: newRequest.status || "Draft",
          materials: materialsArray,
          contractRef: activeContract.raw?._id || activeContract.id,
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
        const created = data.request || data.createdRequest || data;
        setCreativeRequests((prev) => [...prev, created]);
      }

      setShowForm(false);
      setActiveContract(null);
      setNewRequest({
        requestName: "",
        materialsNeeded: "",
        designer: "",
        dueDate: "",
        status: "Draft",
      });
    } catch (err) {
      console.error("Request error:", err);
      alert("Failed: " + (err.message || ""));
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;
    try {
      const res = await fetch(`http://localhost:5000/creativeRequests/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete request");
      setCreativeRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete request: " + (err.message || ""));
    }
  };

  const statusClass = (s = "") => s.toLowerCase().replace(/\s+/g, "-");
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
                  <td>{c.name}</td>
                  <td>{c.client}</td>
                  <td>{c.contractNumber || "-"}</td>
                  <td>{c.startDate ? String(c.startDate).slice(0, 10) : ""}</td>
                  <td>{c.endDate ? String(c.endDate).slice(0, 10) : ""}</td>
                  <td><span className={`status ${statusClass(c.status)}`}>{c.status}</span></td>
                  <td>
                    <button
                      className="action-btn primary"
                      onClick={() => {
                        setActiveContract(c);
                        setEditingRequest(null);
                        setShowForm(true);
                        setNewRequest((prev) => ({ ...prev, requestName: c.name }));
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
        {editingRequest
          ? `Edit Creative Request`
          : activeContract
          ? `Create Creative Request for: ${activeContract.name}`
          : "Create Creative Request"}
      </h3>
      <form onSubmit={handleCreateOrUpdateRequest}>
        <div className="form-row">
          <div className="form-group">
            <label>Request Name</label>
            <input type="text" name="requestName" value={newRequest.requestName} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Designer Assigned</label>
            <input type="text" name="designer" value={newRequest.designer} onChange={handleInputChange} required />
          </div>
        </div>
        <div className="form-group">
          <label>Materials Needed (one per line, format: Name (Qty))</label>
          <textarea name="materialsNeeded" value={newRequest.materialsNeeded} onChange={handleInputChange} rows={4} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" name="dueDate" value={newRequest.dueDate} onChange={handleInputChange} required />
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
          <button type="submit" className="btn-primary">
            {editingRequest ? "Update Request" : "Submit Request"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setShowForm(false);
              setActiveContract(null);
              setEditingRequest(null);
              setNewRequest({
                requestName: "",
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
              <th>Request Name</th>
              <th>Contract</th>
              <th>Client</th>
              <th>Materials Needed</th>
              <th>Designer</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {creativeRequests.length === 0 ? (
              <tr className="no-contracts">
                <td colSpan="8">No creative requests yet</td>
              </tr>
            ) : (
              creativeRequests.map((r, idx) => (
                <tr key={r._id || idx}>
                  <td>{r.requestName || ""}</td>
                  <td>{r.contractName || r.contractNo || ""}</td>
                  <td>{r.client || ""}</td>
                  <td style={{ maxWidth: 240, whiteSpace: "pre-wrap" }}>
                    {r.materials?.map((m) => `${m.name} (${m.quantity})`).join("\n") || ""}
                  </td>
                  <td>{r.designer}</td>
                  <td>{r.dueDate ? String(r.dueDate).slice(0, 10) : ""}</td>
                  <td><span className={`status ${statusClass(r.status)}`}>{r.status}</span></td>
                  <td>
                    <div className="btn-group">
                      <button
                        className="btn-edit"
                        onClick={() => {
                          setEditingRequest(r);
                          setShowForm(true);
                          setActiveContract(null);
                          setNewRequest({
                            requestName: r.requestName || "",
                            materialsNeeded: formatMaterials(r.materials),
                            designer: r.designer || "",
                            dueDate: r.dueDate ? String(r.dueDate).slice(0, 10) : "",
                            status: r.status || "Draft",
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDeleteRequest(r._id)}>
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
