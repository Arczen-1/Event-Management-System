import React, { useState, useEffect } from "react";
import "./SalesManagerDashboard.css";

function CreativeDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [creativeRequests, setCreativeRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeContract, setActiveContract] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [newRequest, setNewRequest] = useState({
    requestName: "",
    materialsNeeded: "",
    contractNo: "",
    dueDate: "",
    status: "Draft",
  });

  useEffect(() => {
    fetchContracts();
    fetchCreativeRequests();
  }, []);

  const fetchContracts = async () => {
    try {
      const res = await fetch("http://localhost:5000/contracts/creative");
      const data = await res.json();
      const raw = Array.isArray(data) ? data : data.contracts || [];
      const mapped = raw.map((c) => ({
        id: c._id,
        name:
          (c.page1 && (c.page1.contractName || c.page1.occasion)) || "Contract",
        client:
          (c.page1 &&
            (c.page1.celebratorName ||
              c.page1.client ||
              c.page1.clientName)) ||
          "",
        value:
          (c.page3 && c.page3.grandTotal) ||
          (c.page1 && c.page1.value) ||
          "",
        startDate:
          (c.page1 && (c.page1.eventDate || c.page1.startDate)) || "",
        endDate: (c.page1 && (c.page1.eventDate || c.page1.endDate)) || "",
        status: c.status || "Draft",
        contractNumber: c.contractNumber,
        raw: c,
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
      else if (Array.isArray(data.creativeRequests))
        arr = data.creativeRequests;
      else if (data.request) arr = [data.request];
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

  const parseMaterials = (input) => {
    if (!input || !input.trim()) return [];
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

  const formatMaterials = (materials) => {
    if (!Array.isArray(materials)) return "";
    return materials.map((m) => `${m.name} (${m.quantity})`).join("\n");
  };

  const handleCreateOrUpdateRequest = async (e) => {
    e.preventDefault();
    try {
      const materialsArray = parseMaterials(newRequest.materialsNeeded);

      if (editingRequest) {
        if (editingRequest.status === "Approved") {
          alert("Approved requests cannot be edited.");
          return;
        }

        const res = await fetch(
          `http://localhost:5000/creativeRequests/${editingRequest._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...newRequest,
              materials: materialsArray,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to update request");

        setCreativeRequests((prev) =>
          prev.map((r) =>
            r._id === editingRequest._id ? data.updatedRequest || data : r
          )
        );
        setEditingRequest(null);
      } else {
        if (!activeContract) {
          alert("Please select a contract first (Add Creative Request button).");
          return;
        }

        const payload = {
          requestName: newRequest.requestName,
          contractNo: newRequest.contractNo,
          dueDate: newRequest.dueDate,
          status: newRequest.status || "Draft",
          materials: materialsArray,
          contractRef: activeContract.id,
          contractName: activeContract.name,
          client: activeContract.client,
          startDate: activeContract.startDate,
          endDate: activeContract.endDate,
        };

        const res = await fetch("http://localhost:5000/creativeRequests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to create request");

        const created = data.request || data.createdRequest || data;
        setCreativeRequests((prev) => [...prev, created]);
      }

      setShowForm(false);
      setActiveContract(null);
      setNewRequest({
        requestName: "",
        materialsNeeded: "",
        contractNo: "",
        dueDate: "",
        status: "Draft",
      });
    } catch (err) {
      console.error("Request error:", err);
      alert("Failed: " + (err.message || ""));
    }
  };

  const handleDeleteRequest = async (id, status) => {
    if (status === "Approved") {
      alert("Approved requests cannot be deleted.");
      return;
    }

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

  const onContractRowClick = async (contract) => {
    try {
      const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedContract(data.contract || contract.raw || null);
      } else {
        console.error("Failed to fetch contract details:", data);
      }
    } catch (err) {
      console.error("Error fetching contract details:", err);
    }
  };

  const statusClass = (s = "") =>
    s.toLowerCase().replace(/\s+/g, "-").replace("sent-to-purchasing", "approved");

  const sectionStyle = { marginTop: "28px" };

  // ✅ Create / Edit Request Form (restored)
  const renderCreateForm = () => (
    <div className="create-contract-form">
      <h3>
        {editingRequest
          ? "Edit Creative Request"
          : activeContract
          ? `Create Creative Request for: ${activeContract.name}`
          : "Create Creative Request"}
      </h3>
      <form onSubmit={handleCreateOrUpdateRequest}>
        <div className="form-row">
          <div className="form-group">
            <label>Request Name</label>
            <input
              type="text"
              name="requestName"
              value={newRequest.requestName}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Contract No.</label>
            <input
              type="text"
              name="contractNo"
              value={newRequest.contractNo}
              readOnly
            />
          </div>
        </div>
        <div className="form-group">
          <label>Materials Needed (one per line, format: Name (Qty))</label>
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
            <select
              name="status"
              value={newRequest.status}
              onChange={handleInputChange}
            >
              <option value="Draft">Draft</option>
              <option value="For Approval">For Approval</option>
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
                contractNo: "",
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

  // ✅ Requests Table with remarks (unchanged)
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
              <th>Contract No.</th>
              <th>Client</th>
              <th>Materials Needed</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Remarks</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {creativeRequests.length === 0 ? (
              <tr className="no-contracts">
                <td colSpan="8">No creative requests yet</td>
              </tr>
            ) : (
              creativeRequests.map((r, idx) => {
                const normalizedStatus =
                  r.status === "Sent to Purchasing" ? "Approved" : r.status;
                const isLocked =
                  normalizedStatus === "Approved" ||
                  normalizedStatus === "Sent to Purchasing";

                return (
                  <tr
                    key={r._id || idx}
                    style={
                      normalizedStatus === "Rejected"
                        ? { backgroundColor: "#ffe6e6" }
                        : {}
                    }
                  >
                    <td>{r.requestName || ""}</td>
                    <td>{r.contractNo || "-"}</td>
                    <td>{r.client || ""}</td>
                    <td style={{ maxWidth: 240, whiteSpace: "pre-wrap" }}>
                      {r.materials
                        ?.map((m) => `${m.name} (${m.quantity})`)
                        .join("\n") || ""}
                    </td>
                    <td>{r.dueDate ? String(r.dueDate).slice(0, 10) : ""}</td>
                    <td>
                      <span
                        className={`status ${
                          normalizedStatus === "Approved"
                            ? "active"
                            : statusClass(normalizedStatus)
                        }`}
                      >
                        {normalizedStatus}
                      </span>
                    </td>
                    <td>
                      {normalizedStatus === "Rejected" && r.rejectionReason ? (
                        <span
                          title={r.rejectionReason}
                          style={{
                            color: "#a40802",
                            fontStyle: "italic",
                            fontSize: "13px",
                            display: "inline-block",
                            maxWidth: "200px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {r.rejectionReason}
                        </span>
                      ) : (
                        <span style={{ color: "#777", fontSize: "13px" }}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="btn-group">
                        {!isLocked ? (
                          <>
                            <button
                              className="btn-edit"
                              onClick={() => {
                                setEditingRequest(r);
                                setShowForm(true);
                                setActiveContract(null);
                                setNewRequest({
                                  requestName: r.requestName || "",
                                  materialsNeeded: formatMaterials(r.materials),
                                  contractNo: r.contractNo || "",
                                  dueDate: r.dueDate
                                    ? String(r.dueDate).slice(0, 10)
                                    : "",
                                  status: r.status || "Draft",
                                });
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() =>
                                handleDeleteRequest(r._id, normalizedStatus)
                              }
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <span
                            style={{
                              color: "#666",
                              fontStyle: "italic",
                              fontSize: "13px",
                            }}
                          >
                            Locked (Approved)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ✅ Contracts + Details modal remain unchanged
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
                <tr
                  key={c.id}
                  className="clickable-row"
                  onClick={() => onContractRowClick(c)}
                >
                  <td>{c.name}</td>
                  <td>{c.client}</td>
                  <td>{c.contractNumber || "-"}</td>
                  <td>{c.startDate?.slice(0, 10)}</td>
                  <td>{c.endDate?.slice(0, 10)}</td>
                  <td>
                    <span className={`status ${statusClass(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="action-btn primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveContract(c);
                        setEditingRequest(null);
                        setShowForm(true);
                        setNewRequest((prev) => ({
                          ...prev,
                          requestName: c.name,
                          contractNo: c.contractNumber,
                        }));
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

  const renderDetailsModal = () => (
    <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Creative Contract Details</h3>
          <button
            className="close-btn"
            onClick={() => setSelectedContract(null)}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {selectedContract && (
            <div className="contract-details contract-details-comprehensive">
              <div className="detail-section">
                <h4>Contract Information</h4>
                <div className="detail-row">
                  <strong>Contract Number:</strong>{" "}
                  {selectedContract.contractNumber}
                </div>
                <div className="detail-row">
                  <strong>Client:</strong>{" "}
                  {selectedContract.page1?.client || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Date of Event:</strong>{" "}
                  {selectedContract.page1?.eventDate || "N/A"}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button
            className="btn-secondary"
            onClick={() => setSelectedContract(null)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // ✅ Fixed final return
  return (
    <div className="sales-manager-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Creatives Department Dashboard</h1>
          <button onClick={onLogout} className="logout-btn header-logout">
            Logout
          </button>
        </div>
      </div>
      <div className="dashboard-content">
        {showForm ? (
          renderCreateForm()
        ) : (
          <>
            {renderContractsTable()}
            {renderRequestsTable()}
          </>
        )}
        {selectedContract && renderDetailsModal()}
      </div>
    </div>
  );
}

export default CreativeDashboard;
