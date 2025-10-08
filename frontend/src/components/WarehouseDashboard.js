import React, { useState, useEffect } from "react";
import "./DepartmentDashboard.css";

function WarehouseDashboard({ onLogout }) {
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
          <h3>Warehouse Contract Details</h3>
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
                <h4>Table Types</h4>
                <div className="detail-row">
                  <strong>VIP Table Type:</strong> {selectedContract.page1?.vipTableType || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Regular Table Type:</strong> {selectedContract.page1?.regularTableType || "N/A"}
                </div>
              </div>

              <div className="detail-section">
                <h4>Chairs</h4>
                <div className="detail-row">
                  <strong>Monoblock:</strong> {selectedContract.page2?.chairsMonoblock || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Tiffany:</strong> {selectedContract.page2?.chairsTiffany || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Crystal:</strong> {selectedContract.page2?.chairsCrystal || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Rustic:</strong> {selectedContract.page2?.chairsRustic || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Kiddie:</strong> {selectedContract.page2?.chairsKiddie || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Premium Chairs:</strong> {selectedContract.page2?.premiumChairs || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Chair Remarks:</strong> {selectedContract.page2?.chairsRemarks || "N/A"}
                </div>
              </div>

              <div className="detail-section">
                <h4>Cake Table</h4>
                <div className="detail-row">
                  <strong>Cake Table:</strong> {selectedContract.page2?.flowerCakeTable || "N/A"}
                </div>
              </div>

              <div className="detail-section">
                <h4>Menu Quantities</h4>
                <div className="detail-row">
                  <strong>Appetizer =</strong> {selectedContract.page3?.appetizer === "N/A" || selectedContract.page3?.appetizer === "Not Applicable" ? 0 : 1}
                </div>
                <div className="detail-row">
                  <strong>Soup =</strong> {selectedContract.page3?.soup === "N/A" || selectedContract.page3?.soup === "Not Applicable" ? 0 : 1}
                </div>
                <div className="detail-row">
                  <strong>Bread =</strong> {selectedContract.page3?.bread === "N/A" || selectedContract.page3?.bread === "Not Applicable" ? 0 : 1}
                </div>
                <div className="detail-row">
                  <strong>Salad =</strong> {selectedContract.page3?.salad === "N/A" || selectedContract.page3?.salad === "Not Applicable" ? 0 : 1}
                </div>
                <div className="detail-row">
                  <strong>Main Entrée =</strong> {selectedContract.page3?.mainEntree === "N/A" || selectedContract.page3?.mainEntree === "Not Applicable" ? 0 : selectedContract.page3.mainEntree.split('\n').filter(item => item.trim()).length}
                </div>
                <div className="detail-row">
                  <strong>Dessert =</strong> {selectedContract.page3?.dessert === "N/A" || selectedContract.page3?.dessert === "Not Applicable" ? 0 : 1}
                </div>
                <div className="detail-row">
                  <strong>Crew Meal =</strong> {selectedContract.page3?.crewMeal === "N/A" || selectedContract.page3?.crewMeal === "Not Applicable" ? 0 : 1}
                </div>
                <div className="detail-row">
                  <strong>Drinks at Cocktail =</strong> {selectedContract.page3?.drinksCocktail === "N/A" || selectedContract.page3?.drinksCocktail === "Not Applicable" ? 0 : 1}
                </div>
                <div className="detail-row">
                  <strong>Drinks at Meal =</strong> {selectedContract.page3?.drinksMeal === "N/A" || selectedContract.page3?.drinksMeal === "Not Applicable" ? 0 : 1}
                </div>
                <div className="detail-row">
                  <strong>Roasted Pig =</strong> {selectedContract.page3?.roastedPig === "N/A" || selectedContract.page3?.roastedPig === "Not Applicable" ? 0 : 1}
                </div>
                <div className="detail-row">
                  <strong>Roasted Calf =</strong> {selectedContract.page3?.roastedCalf === "N/A" || selectedContract.page3?.roastedCalf === "Not Applicable" ? 0 : 1}
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
          <h1>Warehouse Dashboard</h1>
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

export default WarehouseDashboard;



