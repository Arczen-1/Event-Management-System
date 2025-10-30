import React, { useState, useEffect } from "react";
import "./DepartmentDashboard.css";

function KitchenDashboard({ onLogout }) {
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
          (data.contracts || []).filter(c => c.status === "Active").map((c) => ({
            id: c._id,
            name: (c.page1 && (c.page1.contractName || c.page1.occasion)) || "Contract",
            celebratorName: (c.page1 && c.page1.celebratorName) || "",
            contractNumber: c.contractNumber,
            page1: c.page1,
            page2: c.page2,
            page3: c.page3,
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
          <h3>Active Contracts</h3>
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
                  <td colSpan="4">No active contracts available</td>
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

  const renderDetailsModal = () => (
    <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Kitchen Contract Details</h3>
          <button className="close-btn" onClick={() => setSelectedContract(null)}>×</button>
        </div>
        <div className="modal-body">
          {selectedContract && (
            <div className="contract-details">
              <div className="detail-section">
                <h4>Contract Information</h4>
                <div className="detail-row">
                  <strong>Contract Number:</strong> {selectedContract.contractNumber}
                </div>
                <div className="detail-row">
                  <strong>Celebrator/Corporate Name:</strong> {selectedContract.page1?.celebratorName || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Date of Event:</strong> {selectedContract.page1?.eventDate || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Arrival of Guests:</strong> {selectedContract.page1?.arrivalOfGuests || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Total No. of Guests:</strong> {selectedContract.page1?.totalGuests || "N/A"}
                </div>
              </div>

              <div className="detail-section">
                <h4>Menu Details</h4>
                <div className="detail-row">
                  <strong>Cocktail Hour:</strong> {selectedContract.page3?.cocktailHour || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Appetizer:</strong> {selectedContract.page3?.appetizer || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Soup:</strong> {selectedContract.page3?.soup || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Bread:</strong> {selectedContract.page3?.bread || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Salad:</strong> {selectedContract.page3?.salad || "N/A"}
                </div>
                {selectedContract.page3?.mainEntree ? (
                  selectedContract.page3.mainEntree.split('\n').map((item, index) => (
                    <div key={index} className="detail-row">
                      <strong>{index === 0 ? 'Main Entrée:' : ''}</strong> {item.trim()}
                    </div>
                  ))
                ) : (
                  <div className="detail-row">
                    <strong>Main Entrée:</strong> N/A
                  </div>
                )}
                <div className="detail-row">
                  <strong>Dessert:</strong> {selectedContract.page3?.dessert || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Cake Name:</strong> {selectedContract.page3?.cakeName || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Kids Meal:</strong> {selectedContract.page3?.kidsMeal || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Crew Meal:</strong> {selectedContract.page3?.crewMeal || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Drinks at Cocktail:</strong> {selectedContract.page3?.drinksCocktail || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Drinks at Meal:</strong> {selectedContract.page3?.drinksMeal || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Roasted Pig:</strong> {selectedContract.page3?.roastedPig || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Roasted Calf:</strong> {selectedContract.page3?.roastedCalf || "N/A"}
                </div>
              </div>
            </div>
          )}
        </div>
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
          <h1>Kitchen Dashboard</h1>
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

export default KitchenDashboard;



