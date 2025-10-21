import React, { useState, useEffect } from "react";
import "./DepartmentDashboard.css";

function LogisticsDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [page, setPage] = useState(1);

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
          // 1. CHANGED: Filter for "For Approval" status
          (data.contracts || []).filter(c => c.status === "For Approval").map((c) => ({
            id: c._id,
            name: (c.page1 && (c.page1.contractName || c.page1.occasion)) || "Contract",
            celebratorName: (c.page1 && c.page1.celebratorName) || "",
            contractNumber: c.contractNumber,
          }))
        );
      }
    } catch (e) {
      console.error("Error fetching contracts:", e);
    }
  };

  const renderContractsTable = () => {
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedContracts = contracts.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="contracts-table-container">
        <div className="table-header">
          {/* 2. CHANGED: Title updated */}
          <h3>Contracts for Logistics Review</h3>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedContracts.length === 0 ? (
                <tr className="no-contracts">
                  {/* 3. CHANGED: Text updated */}
                  <td colSpan="4">No contracts awaiting review</td>
                </tr>
              ) : (
                paginatedContracts.map(contract => (
                  <tr key={contract.id} className="clickable-row" onClick={async () => {
                    try {
                      const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                      const data = await res.json();
                      if (res.ok) setSelectedContract(data.contract);
                    } catch (e) {}
                  }}>
                    <td>{contract.name}</td>
                    <td>{contract.celebratorName}</td>
                    <td>{contract.contractNumber || "-"}</td>
                    <td>
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

  // 4. MODIFIED: Modal now shows all fields from your new code
  const renderDetailsModal = () => (
    <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Logistics Contract Details</h3>
          <button className="close-btn" onClick={() => setSelectedContract(null)}>×</button>
        </div>
        <div className="modal-body">
          {selectedContract && (
            <div className="contract-details">
              <div className="detail-section">
                <h4>Event Information</h4>
                <div className="detail-row">
                  <strong>Contract Number:</strong> {selectedContract.contractNumber}
                </div>
                <div className="detail-row">
                  <strong>Celebrator:</strong> {selectedContract.page1?.celebratorName || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Date of Event:</strong> {selectedContract.page1?.eventDate || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Ingress Time:</strong> {selectedContract.page1?.ingressTime || "N/A"}
                </div>
              </div>

              <div className="detail-section">
                <h4>Coordinator Details</h4>
                 <div className="detail-row">
                  <strong>Name:</strong> {selectedContract.page1?.coordinatorName || "N/A"}
                </div>
                 <div className="detail-row">
                  <strong>Mobile:</strong> {selectedContract.page1?.coordinatorMobile || "N/A"}
                </div>
                 <div className="detail-row">
                  <strong>Email:</strong> {selectedContract.page1?.coordinatorEmail || "N/A"}
                </div>
              </div>

              <div className="detail-section">
                <h4>Venue Details</h4>
                <div className="detail-row">
                  <strong>Venue:</strong> {selectedContract.page1?.venue || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Hall:</strong> {selectedContract.page1?.hall || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Address of Venue:</strong> {selectedContract.page1?.address || "N/A"}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* 5. MODIFIED: Only Close button is present */}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setSelectedContract(null)}>Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="department-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Logistics Dashboard</h1>
          <button onClick={onLogout} className="logout-btn header-logout">Logout</button>
        </div>
      </div>
      <div className="dashboard-content">
        {renderContractsTable()}
        {selectedContract && renderDetailsModal()}
      </div>
    </div>
  );
}

export default LogisticsDashboard;