import React, { useState, useEffect } from "react";
import "./SalesManagerDashboard.css"; // reuse the sales manager css for consistent styling
import ContractForm from "./ContractForm";

function CreativeManagerDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [creativeRequests, setCreativeRequests] = useState([]);
  const [showCreateContractForm, setShowCreateContractForm] = useState(false);
  const [showCreateRequestForm, setShowCreateRequestForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editContractExisting, setEditContractExisting] = useState(null);
  const [editRequestExisting, setEditRequestExisting] = useState(null);
  const [activeContractsTab, setActiveContractsTab] = useState("all");
  const [activeRequestsTab, setActiveRequestsTab] = useState("all");
  const [newRequest, setNewRequest] = useState({
    requestName: "",
    designer: "",
    dueDate: "",
    status: "For Approval",
    contractRef: "",
    materials: [],
    notes: ""
  });

  // Load both lists on mount
  useEffect(() => {
    fetchContracts();
    fetchCreativeRequests();
  }, []);

  const fetchContracts = async () => {
    try {
      const res = await fetch("http://localhost:5000/contracts");
      const data = await res.json();
      if (res.ok) {
        setContracts(
          (data.contracts || []).map((c) => {
            let status = c.status || "Draft";
            if (c.rejectionReason && status === "For Approval") {
              status = "Returned by Accounting";
            }
            return {
              id: c._id,
              name: (c.page1 && (c.page1.contractName || c.page1.occasion)) || "Contract",
              client: (c.page1 && c.page1.celebratorName) || "",
              startDate: (c.page1 && c.page1.eventDate) || "",
              endDate: (c.page1 && c.page1.eventDate) || "",
              status,
              contractNumber: c.contractNumber,
              rejectionReason: c.rejectionReason || "",
            };
          })
        );
      }
    } catch (e) {
      console.error("Error fetching contracts:", e);
    }
  };

  const fetchCreativeRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/creativeRequests");
      const data = await res.json();
      if (res.ok) {
        setCreativeRequests(data.requests || []);
      }
    } catch (e) {
      console.error("Error fetching creative requests:", e);
    }
  };

  // CONTRACTS: Approve => send to Accounting originally; here keep consistent naming change done in frontend:
  const handleApproveContract = async (contractId) => {
    try {
      const res = await fetch(`http://localhost:5000/contracts/${contractId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve");
      // update local state: Sent to Accounting stays same in backend; display "Sent to Purchasing" in UI where needed
      setContracts(contracts.map(c => c.id === contractId ? { ...c, status: "For Accounting Review" } : c));
      alert("Contract approved and sent to Accounting");
    } catch (err) {
      console.error(err);
      alert("Failed to approve contract.");
    }
  };

  // CREATIVE REQUESTS ACTIONS
  const handleRequestInputChange = (e) => {
    const { name, value } = e.target;
    setNewRequest({ ...newRequest, [name]: value });
  };

  const handleAddMaterial = () => {
    setNewRequest({ ...newRequest, materials: [...newRequest.materials, { name: "", quantity: 1, notes: "" }] });
  };

  const handleMaterialChange = (index, field, value) => {
    const m = [...newRequest.materials];
    m[index][field] = field === "quantity" ? Number(value) : value;
    setNewRequest({ ...newRequest, materials: m });
  };

  const handleRemoveMaterial = (index) => {
    const m = [...newRequest.materials];
    m.splice(index, 1);
    setNewRequest({ ...newRequest, materials: m });
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newRequest };
      // If contractRef is empty string, remove it
      if (!payload.contractRef) delete payload.contractRef;
      const res = await fetch("http://localhost:5000/creativeRequests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create request");
      setCreativeRequests([data.request, ...creativeRequests]);
      setShowCreateRequestForm(false);
      setNewRequest({
        requestName: "",
        designer: "",
        dueDate: "",
        status: "For Approval",
        contractRef: "",
        materials: [],
        notes: ""
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create creative request.");
    }
  };

  const handleUpdateRequest = async (id, payload) => {
    try {
      const res = await fetch(`http://localhost:5000/creativeRequests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update");
      setCreativeRequests(crs => crs.map(r => (r._id === id ? data.request : r)));
      setEditRequestExisting(null);
      setSelectedRequest(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update creative request.");
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm("Delete this creative request?")) return;
    try {
      const res = await fetch(`http://localhost:5000/creativeRequests/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete");
      setCreativeRequests(crs => crs.filter(r => r._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete creative request.");
    }
  };

  const handleMarkRequestCompleted = async (id) => {
    try {
      await handleUpdateRequest(id, { status: "Completed" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendToPurchasing = async (id) => {
    try {
      // update status to "Sent to Purchasing"
      await handleUpdateRequest(id, { status: "Sent to Purchasing" });
      alert("Creative request sent to Purchasing.");
    } catch (err) {
      console.error(err);
    }
  };

  const getFilteredContracts = () => {
    switch (activeContractsTab) {
      case "for-approval":
        return contracts.filter(c => c.status === "For Approval" || c.status === "Returned by Accounting");
      case "sent":
        return contracts.filter(c => c.status === "For Accounting Review");
      default:
        return contracts;
    }
  };

  const getFilteredRequests = () => {
    switch (activeRequestsTab) {
      case "for-approval":
        return creativeRequests.filter(r => r.status === "For Approval");
      case "sent":
        return creativeRequests.filter(r => r.status === "Sent to Purchasing");
      case "completed":
        return creativeRequests.filter(r => r.status === "Completed");
      default:
        return creativeRequests;
    }
  };

  // Render helpers
  const renderContractsSection = () => {
    const filtered = getFilteredContracts();
    return (
      <div className="contracts-table-container" style={{ marginBottom: 24 }}>
        <div className="table-header">
          <h3>Contracts from Sales</h3>
          <div>
            <button className="action-btn primary" onClick={() => setShowCreateContractForm(true)}>Create New Contract</button>
          </div>
        </div>

        <div className="tabs" style={{ marginBottom: 12 }}>
          <button className={`tab ${activeContractsTab === "all" ? "active" : ""}`} onClick={() => setActiveContractsTab("all")}>All Contracts</button>
          <button className={`tab ${activeContractsTab === "for-approval" ? "active" : ""}`} onClick={() => setActiveContractsTab("for-approval")}>For Approval ({contracts.filter(c => c.status === "For Approval").length})</button>
          <button className={`tab ${activeContractsTab === "sent" ? "active" : ""}`} onClick={() => setActiveContractsTab("sent")}>Sent to Purchasing ({contracts.filter(c => c.status === "For Accounting Review").length})</button>
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
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr className="no-contracts"><td colSpan="6">No contracts found</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="clickable-row" onClick={async () => {
                  try {
                    const res = await fetch(`http://localhost:5000/contracts/${c.id}`);
                    const data = await res.json();
                    if (res.ok) setSelectedContract(data.contract);
                  } catch (e) {}
                }}>
                  <td>{c.name}</td>
                  <td>{c.client}</td>
                  <td>{c.contractNumber || "-"}</td>
                  <td>{c.startDate}</td>
                  <td>{c.endDate}</td>
                  <td>
                    <span className={`status ${c.status.toLowerCase().replace(/ /g, "-")}`} title={c.rejectionReason || ""}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRequestsSection = () => {
    const filtered = getFilteredRequests();
    return (
      <div className="contracts-table-container">
        <div className="table-header">
          <h3>Creative Requests</h3>
          <div>
            <button className="action-btn primary" onClick={() => { setShowCreateRequestForm(true); setEditRequestExisting(null); }}>
              Add Creative Request
            </button>
          </div>
        </div>

        <div className="tabs" style={{ marginBottom: 12 }}>
          <button className={`tab ${activeRequestsTab === "all" ? "active" : ""}`} onClick={() => setActiveRequestsTab("all")}>All Requests</button>
          <button className={`tab ${activeRequestsTab === "for-approval" ? "active" : ""}`} onClick={() => setActiveRequestsTab("for-approval")}>For Approval ({creativeRequests.filter(r => r.status === "For Approval").length})</button>
          <button className={`tab ${activeRequestsTab === "sent" ? "active" : ""}`} onClick={() => setActiveRequestsTab("sent")}>Sent to Purchasing ({creativeRequests.filter(r => r.status === "Sent to Purchasing").length})</button>
          <button className={`tab ${activeRequestsTab === "completed" ? "active" : ""}`} onClick={() => setActiveRequestsTab("completed")}>Completed ({creativeRequests.filter(r => r.status === "Completed").length})</button>
        </div>

        <div className="contracts-table">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Designer</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr className="no-contracts"><td colSpan="5">No requests found</td></tr>
              ) : filtered.map((r) => (
                <tr key={r._id}>
                  <td className="clickable-cell" onClick={() => setSelectedRequest(r)}>{r.requestName}</td>
                  <td>{r.designer}</td>
                  <td>{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : ""}</td>
                  <td>
                    <span className={`status ${r.status.toLowerCase().replace(/ /g, "-")}`}>{r.status}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {r.status !== "Completed" && (
                        <button className="btn-primary small" onClick={() => handleMarkRequestCompleted(r._id)}>Mark Completed</button>
                      )}
                      {r.status !== "Sent to Purchasing" && (
                        <button className="btn-primary small" onClick={() => handleSendToPurchasing(r._id)}>Send to Purchasing</button>
                      )}
                      <button className="btn-secondary small" onClick={() => { setEditRequestExisting(r); setShowCreateRequestForm(true); }}>
                        Edit
                      </button>
                      <button className="btn-primary small" onClick={() => handleDeleteRequest(r._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCreateRequestForm = () => (
    <div className="create-contract-form">
      <h3>{editRequestExisting ? "Edit Creative Request" : "Create New Creative Request"}</h3>
      <form onSubmit={async (e) => {
        e.preventDefault();
        if (editRequestExisting) {
          const payload = { ...newRequest };
          // If contractRef blank, remove
          if (!payload.contractRef) delete payload.contractRef;
          await handleUpdateRequest(editRequestExisting._id, payload);
          setShowCreateRequestForm(false);
          setEditRequestExisting(null);
          setNewRequest({
            requestName: "",
            designer: "",
            dueDate: "",
            status: "For Approval",
            contractRef: "",
            materials: [],
            notes: ""
          });
        } else {
          await handleCreateRequest(e);
        }
      }}>
        <div className="form-row">
          <div className="form-group">
            <label>Task</label>
            <input type="text" name="requestName" value={newRequest.requestName} onChange={handleRequestInputChange} required />
          </div>
          <div className="form-group">
            <label>Designer</label>
            <input type="text" name="designer" value={newRequest.designer} onChange={handleRequestInputChange} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" name="dueDate" value={newRequest.dueDate} onChange={handleRequestInputChange} required />
          </div>
          <div className="form-group">
            <label>Linked Contract (optional)</label>
            <select name="contractRef" value={newRequest.contractRef || ""} onChange={handleRequestInputChange}>
              <option value="">None</option>
              {contracts.map(c => <option key={c.id} value={c.id}>{c.name} — {c.contractNumber}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea name="notes" value={newRequest.notes} onChange={handleRequestInputChange} rows="3" />
        </div>

        <div className="materials-section">
          <h4>Materials</h4>
          {newRequest.materials.map((m, idx) => (
            <div key={idx} className="material-row">
              <input placeholder="Material name" value={m.name} onChange={(e) => handleMaterialChange(idx, "name", e.target.value)} required />
              <input type="number" min="1" placeholder="Qty" value={m.quantity} onChange={(e) => handleMaterialChange(idx, "quantity", e.target.value)} />
              <input placeholder="Notes" value={m.notes} onChange={(e) => handleMaterialChange(idx, "notes", e.target.value)} />
              <button type="button" className="btn-secondary small" onClick={() => handleRemoveMaterial(idx)}>Remove</button>
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <button type="button" className="btn-primary small" onClick={handleAddMaterial}>Add Material</button>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">{editRequestExisting ? "Save Changes" : "Create Request"}</button>
          <button type="button" className="btn-secondary" onClick={() => { setShowCreateRequestForm(false); setEditRequestExisting(null); }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const renderContractDetailsModal = () => (
    <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Contract Details - {selectedContract?.contractNumber}</h3>
          <button className="close-btn" onClick={() => setSelectedContract(null)}>×</button>
        </div>
        <div className="modal-body">
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(selectedContract, null, 2)}</pre>
        </div>
        <div className="modal-actions">
          {selectedContract?.status === "For Approval" && (
            <div className="approval-actions">
              <button className="btn-approve" onClick={() => { handleApproveContract(selectedContract._id); setSelectedContract(null); }}>Approve</button>
            </div>
          )}
          <button className="btn-secondary" onClick={() => setSelectedContract(null)}>Close</button>
        </div>
      </div>
    </div>
  );

  const renderRequestDetailsModal = () => (
    <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Creative Request - {selectedRequest?.requestName}</h3>
          <button className="close-btn" onClick={() => setSelectedRequest(null)}>×</button>
        </div>
        <div className="modal-body">
          {selectedRequest && (
            <>
              <div><strong>Designer:</strong> {selectedRequest.designer}</div>
              <div><strong>Due Date:</strong> {selectedRequest.dueDate ? new Date(selectedRequest.dueDate).toLocaleDateString() : ""}</div>
              <div><strong>Status:</strong> <span className={`status ${selectedRequest.status.toLowerCase().replace(/ /g, "-")}`}>{selectedRequest.status}</span></div>
              <div style={{ marginTop: 12 }}>
                <strong>Materials</strong>
                {selectedRequest.materials && selectedRequest.materials.length > 0 ? (
                  <ul>
                    {selectedRequest.materials.map((m, i) => (
                      <li key={i}>{m.name} — {m.quantity} {m.notes ? `(${m.notes})` : ""}</li>
                    ))}
                  </ul>
                ) : <div className="empty">No materials listed</div>}
              </div>
              {selectedRequest.notes && <div style={{ marginTop: 12 }}><strong>Notes:</strong><div>{selectedRequest.notes}</div></div>}
            </>
          )}
        </div>
        <div className="modal-actions">
          {selectedRequest && selectedRequest.status !== "Completed" && (
            <button className="btn-primary" onClick={() => { handleMarkRequestCompleted(selectedRequest._id); setSelectedRequest(null); }}>Mark Completed</button>
          )}
          <button className="btn-secondary" onClick={() => setSelectedRequest(null)}>Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="sales-manager-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Creative Manager Dashboard</h1>
          <button onClick={onLogout} className="logout-btn header-logout">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Both sections visible on one page */}
        {showCreateContractForm ? (
          <ContractForm
            onCancel={() => { setShowCreateContractForm(false); setEditContractExisting(null); }}
            onCreated={(created) => {
              setShowCreateContractForm(false);
              setEditContractExisting(null);
              setContracts(prev => [...prev, created]);
            }}
            existing={editContractExisting}
          />
        ) : null}

        {showCreateRequestForm ? renderCreateRequestForm() : null}

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
          {renderContractsSection()}
          {renderRequestsSection()}
        </div>

        {selectedContract && renderContractDetailsModal()}
        {selectedRequest && renderRequestDetailsModal()}
      </div>
    </div>
  );
}

export default CreativeManagerDashboard;
