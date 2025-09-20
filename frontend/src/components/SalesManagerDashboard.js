import React, { useState, useEffect } from "react";
import "./SalesManagerDashboard.css";
import ContractForm from "./ContractForm";

function SalesManagerDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [nextNumber, setNextNumber] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);
  const [editExisting, setEditExisting] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // "all", "for-approval", "approved"
  const [newContract, setNewContract] = useState({
    name: "",
    client: "",
    value: "",
    startDate: "",
    endDate: "",
    status: "For Approval" // Sales Manager creates contracts that need approval
  });

  // Load contracts from backend on mount
  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
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
    } catch (e) {
      console.error("Error fetching contracts:", e);
    }
  };

  const handleInputChange = (e) => {
    setNewContract({
      ...newContract,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    try {
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

      setNewContract({
        name: "",
        client: "",
        value: "",
        startDate: "",
        endDate: "",
        status: "For Approval",
      });
      setShowCreateForm(false);
      setNextNumber("");
    } catch (err) {
      console.error(err);
      alert("Failed to create contract. Please try again.");
    }
  };

  const handleApprove = async (contractId) => {
    try {
      const res = await fetch(`http://localhost:5000/contracts/${contractId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve");

      // Update local state
      setContracts(contracts.map(c => 
        c.id === contractId 
          ? { ...c, status: "For Accounting Review" }
          : c
      ));
      
      alert("Contract approved and sent to Accounting Department");
    } catch (err) {
      console.error(err);
      alert("Failed to approve contract. Please try again.");
    }
  };

  const handleReject = async (contractId) => {
    try {
      const res = await fetch(`http://localhost:5000/contracts/${contractId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject");

      // Update local state
      setContracts(contracts.map(c => 
        c.id === contractId 
          ? { ...c, status: "Draft" }
          : c
      ));
      
      alert("Contract rejected and returned to Draft");
    } catch (err) {
      console.error(err);
      alert("Failed to reject contract. Please try again.");
    }
  };

  const getFilteredContracts = () => {
    switch (activeTab) {
      case "for-approval":
        return contracts.filter(c => c.status === "For Approval");
      case "approved":
        return contracts.filter(c => c.status === "For Accounting Review");
      default:
        return contracts;
    }
  };

  const renderCreateForm = () => (
    <div className="create-contract-form">
      <h3>Create New Contract</h3>
      {nextNumber && (
        <div className="next-number">
          Next Contract Number: {nextNumber}
        </div>
      )}
      <form onSubmit={handleCreateContract}>
        <div className="form-row">
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
            <label>Client</label>
            <input
              type="text"
              name="client"
              value={newContract.client}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Value</label>
            <input
              type="number"
              name="value"
              value={newContract.value}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Event Date</label>
            <input
              type="date"
              name="startDate"
              value={newContract.startDate}
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

  const renderContractsTable = () => {
    const filteredContracts = getFilteredContracts();
    
    return (
      <div className="contracts-table-container">
        <div className="table-header">
          <h3>Contract Management</h3>
          <button 
            className="action-btn primary"
            onClick={() => setShowCreateForm(true)}
          >
            Create New Contract
          </button>
        </div>
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Contracts
          </button>
          <button 
            className={`tab ${activeTab === "for-approval" ? "active" : ""}`}
            onClick={() => setActiveTab("for-approval")}
          >
            For Approval ({contracts.filter(c => c.status === "For Approval").length})
          </button>
          <button 
            className={`tab ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            Sent to Accounting ({contracts.filter(c => c.status === "For Accounting Review").length})
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
                <th>Event Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr className="no-contracts">
                  <td colSpan="7">No contracts found</td>
                </tr>
              ) : (
                filteredContracts.map(contract => (
                  <tr key={contract.id} className="clickable-row" onClick={async () => {
                    try {
                      const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                      const data = await res.json();
                      if (res.ok) setSelectedContract(data.contract);
                    } catch (e) {}
                  }}>
                    <td>{contract.name}</td>
                    <td>{contract.client}</td>
                    <td>{contract.contractNumber || "-"}</td>
                    <td>₱{contract.value}</td>
                    <td>{contract.startDate}</td>
                    <td>
                      <span className={`status ${contract.status.toLowerCase().replace(' ', '-')}`}>
                        {contract.status}
                      </span>
                    </td>
                    <td>
                      {contract.status === "For Approval" && (
                        <div className="action-buttons">
                          <button 
                            className="btn-approve"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(contract.id);
                            }}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn-reject"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(contract.id);
                            }}
                          >
                            Reject
                          </button>
                        </div>
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
  };

  const renderDetailsModal = () => (
    <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Contract Details</h3>
          <button className="close-btn" onClick={() => setSelectedContract(null)}>×</button>
        </div>
        <div className="modal-body">
          {selectedContract && (
            <div className="contract-details">
              <div className="detail-row">
                <strong>Contract Number:</strong> {selectedContract.contractNumber}
              </div>
              <div className="detail-row">
                <strong>Status:</strong> 
                <span className={`status ${selectedContract.status?.toLowerCase().replace(' ', '-')}`}>
                  {selectedContract.status}
                </span>
              </div>
              <div className="detail-row">
                <strong>Client:</strong> {selectedContract.page1?.celebratorName || "N/A"}
              </div>
              <div className="detail-row">
                <strong>Event Date:</strong> {selectedContract.page1?.eventDate || "N/A"}
              </div>
              <div className="detail-row">
                <strong>Total Value:</strong> ₱{selectedContract.page3?.grandTotal || "N/A"}
              </div>
              {/* Add more details as needed */}
            </div>
          )}
        </div>
        <div className="modal-actions">
          {selectedContract?.status === "For Approval" && (
            <div className="approval-actions">
              <button className="btn-approve" onClick={() => {
                handleApprove(selectedContract._id);
                setSelectedContract(null);
              }}>Approve</button>
              <button className="btn-reject" onClick={() => {
                handleReject(selectedContract._id);
                setSelectedContract(null);
              }}>Reject</button>
            </div>
          )}
          <button className="btn-secondary" onClick={() => setSelectedContract(null)}>Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="sales-manager-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Sales Manager Dashboard</h1>
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

export default SalesManagerDashboard;
