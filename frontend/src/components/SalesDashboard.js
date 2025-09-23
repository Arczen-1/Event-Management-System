import React, { useState, useEffect } from "react";
import "./SalesDashboard.css";
import ContractForm from "./ContractForm";

function SalesDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [nextNumber, setNextNumber] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);
  const [editExisting, setEditExisting] = useState(null);
  const [newContract, setNewContract] = useState({
    name: "",
    client: "",
    value: "",
    startDate: "",
    endDate: "",
    status: "Draft"
  });

  // Load a preview of the next contract number
  useEffect(() => {
    if (showCreateForm && !editExisting) {
      fetch("http://localhost:5000/contracts/next-number")
        .then((res) => res.json())
        .then((data) => setNextNumber(data.nextNumber || ""))
        .catch(() => setNextNumber(""));
    }
  }, [showCreateForm, editExisting]);

  // Load contracts from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/contracts");
        const data = await res.json();
        if (res.ok) {
          setContracts(
            (data.contracts || []).map((c) => ({
              id: c._id,
              name: (c.page1 && (c.page1.contractName || c.page1.occasion)) || "Contract",
              client: (c.page1 && c.page1.celebratorName) || "",
              value: (c.page3 && c.page3.grandTotal) || "",
              startDate: (c.page1 && c.page1.eventDate) || "",
              endDate: (c.page1 && c.page1.eventDate) || "",
              status: c.status || "Draft",
              contractNumber: c.contractNumber,
            }))
          );
        }
      } catch (e) {}
    })();
  }, []);

  const handleInputChange = (e) => {
    setNewContract({
      ...newContract,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    try {
      // Build minimal payload mapping to backend sections
      const payload = {
        department: "Sales",
        status: newContract.status,
        page1: {
          contractName: newContract.name,
          client: newContract.client,
          value: newContract.value,
          startDate: newContract.startDate,
          endDate: newContract.endDate,
        },
      };

      const res = await fetch("http://localhost:5000/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create");

      // Append to local list for immediate feedback
      setContracts([
        ...contracts,
        {
          id: data.contract._id,
          name: newContract.name,
          client: newContract.client,
          value: newContract.value,
          startDate: newContract.startDate,
          endDate: newContract.endDate,
          status: newContract.status,
          contractNumber: data.contract.contractNumber,
        },
      ]);

      // Reset form
      setNewContract({
        name: "",
        client: "",
        value: "",
        startDate: "",
        endDate: "",
        status: "Draft",
      });
      setShowCreateForm(false);
      setNextNumber("");
    } catch (err) {
      console.error(err);
      alert("Failed to create contract. Please try again.");
    }
  };

  const renderCreateForm = () => (
    <div className="create-contract-form">
      <h3>Create New Contract</h3>
      {nextNumber && (
        <div className="next-number">Next Contract No.: <strong>{nextNumber}</strong></div>
      )}
      <form onSubmit={handleCreateContract}>
        <div className="form-group">
          <label>Contract Name</label>
          <input
            type="text"
            name="name"
            value={newContract.name}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Client Name</label>
          <input
            type="text"
            name="client"
            value={newContract.client}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Contract Value</label>
          <input
            type="number"
            name="value"
            value={newContract.value}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={newContract.startDate}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={newContract.endDate}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Status</label>
          <select
            name="status"
            value={newContract.status}
            onChange={handleInputChange}
          >
            <option value="Draft">Draft</option>
            <option value="For Approval">For Approval</option>
            <option value="For Accounting Review">For Accounting Review</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-primary">Create Contract</button>
          <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const renderContractsTable = () => (
    <div className="contracts-table-container">
      <div className="table-header">
        <h3>My Contracts</h3>
        <button 
          className="action-btn primary"
          onClick={() => setShowCreateForm(true)}
        >
          Create New Contract
        </button>
      </div>
      
      <div className="contracts-table">
        <table>
          <thead>
            <tr>
              <th>Contract Name</th>
              <th>Client</th>
              <th>Contract No.</th>
              <th>Value</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr className="no-contracts">
                <td colSpan="7">No contracts created yet</td>
              </tr>
            ) : (
              contracts.map(contract => (
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
                  }}>{contract.endDate}</td>
                  <td className="clickable-cell" onClick={async () => {
                    try {
                      const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                      const data = await res.json();
                      if (res.ok) setSelectedContract(data.contract);
                    } catch (e) {}
                  }}>
                    <span className={`status ${contract.status.toLowerCase().replace(' ', '-')}`}>
                      {contract.status}
                    </span>
                  </td>
                  <td>
                    {contract.status === "Draft" && (
                      <button
                        className="btn-primary small"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await fetch(`http://localhost:5000/contracts/${contract.id}/send-for-approval`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" }
                            });
                            const data = await res.json();
                            if (res.ok) {
                              // Update the contract status in the local state
                              setContracts(prevContracts =>
                                prevContracts.map(c =>
                                  c.id === contract.id
                                    ? { ...c, status: "For Approval" }
                                    : c
                                )
                              );
                            } else {
                              alert(data.message || "Failed to send for approval");
                            }
                          } catch (error) {
                            alert("Failed to send for approval. Please try again.");
                          }
                        }}
                      >
                        Send for Approval
                      </button>
                    )}
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
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Contract Details</h3>
        <div className="details-header">
          <div><span className="muted">No.:</span> <strong>{selectedContract.contractNumber}</strong></div>
          <div><span className="muted">Status:</span> <span className={`status-pill ${selectedContract.status.toLowerCase()}`}>{selectedContract.status}</span></div>
        </div>

        {(() => {
          const toTitle = (k) => k
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^./, (c) => c.toUpperCase());

          const Section = ({ title, data }) => {
            const entries = Object.entries(data || {}).filter(([_, v]) => v !== undefined && v !== null && String(v).trim() !== "");
            return (
              <div className="details-section">
                <h4>{title}</h4>
                {entries.length === 0 ? (
                  <div className="empty">No data</div>
                ) : (
                  <div className="kv-grid">
                    {entries.map(([k, v]) => (
                      <div key={k} className="kv-item">
                        <div className="kv-label">{toTitle(k)}</div>
                        <div className="kv-value">{String(v)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          };

          return (
            <>
              <Section title="Page 1" data={selectedContract.page1} />
              <Section title="Page 2" data={selectedContract.page2} />
              <Section title="Page 3" data={selectedContract.page3} />
            </>
          );
        })()}
        <div className="modal-actions">
          {selectedContract.status === "Draft" && (
            <button className="btn-primary" onClick={() => {
              setEditExisting(selectedContract);
              setSelectedContract(null);
              setShowCreateForm(true);
            }}>Edit</button>
          )}
          <button className="btn-secondary" onClick={() => setSelectedContract(null)}>Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="sales-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          {/* Left: Title matches Admin style */}
          <h1>Sales Dashboard</h1>
          {/* Right: Logout aligned to right, same class as Admin */}
          <button onClick={onLogout} className="logout-btn header-logout">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        {showCreateForm ? (
          <ContractForm
            onCancel={() => { setShowCreateForm(false); setEditExisting(null); }}
            onCreated={(created) => {
              setShowCreateForm(false);
              setEditExisting(null);
              // If editing, replace existing entry; otherwise append
              setContracts((prev) => {
                const idx = prev.findIndex((c) => c.id === created.id);
                if (idx !== -1) {
                  const copy = [...prev];
                  copy[idx] = created;
                  return copy;
                }
                return [...prev, created];
              });
            }}
            existing={editExisting}
          />
        ) : (
          renderContractsTable()
        )}
        {selectedContract && renderDetailsModal()}
      </div>
    </div>
  );
}

export default SalesDashboard;
