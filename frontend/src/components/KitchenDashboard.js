import React, { useState, useEffect } from "react";
import "./DepartmentDashboard.css";

function KitchenDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchContracts();
  }, []);

  // Progress tracking based on payment stage
  const calculateProgress = (contract) => {
    if (!contract.paymentStatus) return 10;

    switch (contract.paymentStatus) {
      case "Down Payment Paid":
        return 40;
      case "Fully Paid":
        return 100;
      default:
        return 20;
    }
  };

  // Kitchen workflow visibility
  const getKitchenStatus = (contract) => {
    if (contract.kitchenSubmitted) return "Completed";
    if (contract.status === "Cancelled") return "Cancelled";
    if (contract.status === "For Approval") return "Pending";
    return "In Progress";
  };

  // Show only future events
  const isUpcoming = (date) => {
    if (!date) return false;
    const today = new Date();
    const eventDate = new Date(date);
    today.setHours(0,0,0,0);
    eventDate.setHours(0,0,0,0);
    return eventDate >= today;
  };

  // Detect urgent events (3 days before)
  const isUrgent = (date) => {
    if (!date) return false;
    const today = new Date();
    const eventDate = new Date(date);
    const diff = (eventDate - today) / (1000 * 60 * 60 * 24);
    return diff <= 3 && diff >= 0;
  };

  const fetchContracts = async () => {
    try {
      const res = await fetch("http://localhost:5000/contracts");
      const data = await res.json();

      if (res.ok) {
        const filtered = (data.contracts || [])
          .filter(c =>
            c.status !== "Cancelled" &&
            isUpcoming(c.page1?.eventDate)
          )
          .map(c => ({
            id: c._id,
            name: c.page1?.contractName || c.page1?.occasion || "Contract",
            celebratorName: c.page1?.celebratorName || "",
            contractNumber: c.contractNumber,
            eventDate: c.page1?.eventDate,
            guests: c.page1?.totalGuests,
            progress: calculateProgress(c),
            kitchenStatus: getKitchenStatus(c),
            urgent: isUrgent(c.page1?.eventDate)
          }));

        setContracts(filtered);
      }
    } catch (e) {
      console.error("Error fetching contracts:", e);
    }
  };

  const renderContractsTable = () => {
    const itemsPerPage = 10;
    const totalPages = Math.max(1, Math.ceil(contracts.length / itemsPerPage));

    const startIndex = (page - 1) * itemsPerPage;
    const paginatedContracts = contracts.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="contracts-table-container">
        <div className="table-header">
          <h3>Upcoming & Active Kitchen Events</h3>

          <div className="pager">
            <button
              className="pager-btn"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              ←
            </button>

            <span className="page-indicator">
              Page {page} of {totalPages}
            </span>

            <button
              className="pager-btn"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              →
            </button>
          </div>
        </div>

        <div className="contracts-table">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Guests</th>
                <th>Date</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedContracts.length === 0 ? (
                <tr className="no-contracts">
                  <td colSpan="6">No upcoming kitchen events</td>
                </tr>
              ) : (
                paginatedContracts.map(contract => (
                  <tr
                    key={contract.id}
                    className={`clickable-row ${contract.urgent ? "urgent-row" : ""}`}
                    onClick={async () => {
                      try {
                        const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                        const data = await res.json();
                        if (res.ok) setSelectedContract(data.contract);
                      } catch (e) {
                        console.error("Error fetching contract:", e);
                      }
                    }}
                  >
                    <td>{contract.name}</td>
                    <td>{contract.guests || "-"}</td>
                    <td>{contract.eventDate || "-"}</td>
                    <td>{contract.kitchenStatus}</td>
                    <td>{contract.progress}%</td>

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
                        View Menu
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

  // Helper to render multi-line menu items nicely
  const renderMenuSection = (title, data) => {
    if (!data) return <div className="detail-row"><strong>{title}:</strong> N/A</div>;

    const items = data.split('\n').filter(item => item.trim() !== "");

    if (items.length === 0) {
      return <div className="detail-row"><strong>{title}:</strong> N/A</div>;
    }

    return (
      <>
        <div className="detail-row"><strong>{title}:</strong></div>

        <ul className="menu-detail-list">
          {items.map((item, index) => (
            <li key={index}>{item.trim()}</li>
          ))}
        </ul>
      </>
    );
  };

  // Modal for viewing full contract menu
  const renderDetailsModal = () => (
    <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h3>Kitchen Contract Details</h3>
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

                <div className="detail-row">
                  <strong>Total No. of Guests:</strong> {selectedContract.page1?.totalGuests || "N/A"}
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
                <h4>Menu Details</h4>

                {renderMenuSection("Cocktail Hour", selectedContract.page3?.cocktailHour)}
                {renderMenuSection("Food Stations", selectedContract.page3?.foodStations)}
                {renderMenuSection("Appetizer", selectedContract.page3?.appetizer)}
                {renderMenuSection("Soup", selectedContract.page3?.soup)}
                {renderMenuSection("Salad", selectedContract.page3?.salad)}
                {renderMenuSection("Main Entrée", selectedContract.page3?.mainEntree)}
                {renderMenuSection("Rice", selectedContract.page3?.rice)}
                {renderMenuSection("Dessert", selectedContract.page3?.dessert)}
                {renderMenuSection("Drinks", selectedContract.page3?.drinks)}

              </div>

              <div className="detail-section">
                <h4>Other Items</h4>

                <div className="detail-row">
                  <strong>Cake:</strong> {selectedContract.page2?.cakeNameCode || "N/A"}
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
          <button className="btn-secondary" onClick={() => setSelectedContract(null)}>
            Close
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <div className="department-dashboard">

      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Kitchen Dashboard</h1>
          <button onClick={onLogout} className="logout-btn header-logout">
            Logout
          </button>
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
