import React, { useState, useEffect } from "react";
import "./DepartmentDashboard.css";

function WarehouseDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [page, setPage] = useState(1);
  const [activeView, setActiveView] = useState("contracts");

  const [inventoryData, setInventoryData] = useState([]);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [inventoryModalMode, setInventoryModalMode] = useState("add");
  const [inventoryModalData, setInventoryModalData] = useState({});
  const [inventoryEditingIndex, setInventoryEditingIndex] = useState(null);

  const [monitoringData, setMonitoringData] = useState([]);
  const [monitoringModalOpen, setMonitoringModalOpen] = useState(false);
  const [monitoringModalMode, setMonitoringModalMode] = useState("add");
  const [monitoringModalData, setMonitoringModalData] = useState({});
  const [monitoringEditingIndex, setMonitoringEditingIndex] = useState(null);

  // ------------------- Fetch Data -------------------
  useEffect(() => {
    if (activeView === "contracts") fetchContracts();
    if (activeView === "inventory") fetchInventory();
    if (activeView === "monitoring") fetchMonitoring();
  }, [activeView]);

  const fetchContracts = async () => {
    try {
      const res = await fetch("http://localhost:5000/contracts");
      const data = await res.json();
      if (res.ok) {
        setContracts(
          (data.contracts || [])
            .filter((c) => c.status === "Active")
            .map((c) => ({
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

  const fetchInventory = async () => {
    try {
      const res = await fetch("http://localhost:5000/inventory-movement");
      const data = await res.json();
      setInventoryData(data);
    } catch (err) {
      console.error("Error fetching inventory data:", err);
    }
  };

  const fetchMonitoring = async () => {
    try {
      const res = await fetch("http://localhost:5000/monitoring");
      const data = await res.json();
      setMonitoringData(data);
    } catch (err) {
      console.error("Error fetching monitoring data:", err);
    }
  };

  // ------------------- Inventory CRUD -------------------
  const openInventoryModal = (mode, data = {}, index = null) => {
    setInventoryModalMode(mode);
    setInventoryModalData(data);
    setInventoryEditingIndex(index);
    setInventoryModalOpen(true);
  };

  const closeInventoryModal = () => {
    setInventoryModalOpen(false);
    setInventoryModalData({});
    setInventoryEditingIndex(null);
  };

  const saveInventoryItem = () => {
    if (inventoryModalMode === "add") {
      setInventoryData((prev) => [...prev, inventoryModalData]);
    } else if (inventoryModalMode === "edit") {
      setInventoryData((prev) =>
        prev.map((item, idx) =>
          idx === inventoryEditingIndex ? inventoryModalData : item
        )
      );
    }
    closeInventoryModal();
  };

  const deleteInventoryItem = (idx) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setInventoryData((prev) => prev.filter((_, index) => index !== idx));
    }
  };

  // ------------------- Monitoring CRUD -------------------
  const openMonitoringModal = (mode, data = {}, index = null) => {
    setMonitoringModalMode(mode);
    setMonitoringModalData(data);
    setMonitoringEditingIndex(index);
    setMonitoringModalOpen(true);
  };

  const closeMonitoringModal = () => {
    setMonitoringModalOpen(false);
    setMonitoringModalData({});
    setMonitoringEditingIndex(null);
  };

  const saveMonitoringItem = () => {
    if (monitoringModalMode === "add") {
      setMonitoringData((prev) => [...prev, monitoringModalData]);
    } else if (monitoringModalMode === "edit") {
      setMonitoringData((prev) =>
        prev.map((item, idx) =>
          idx === monitoringEditingIndex ? monitoringModalData : item
        )
      );
    }
    closeMonitoringModal();
  };

  const deleteMonitoringItem = (idx) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setMonitoringData((prev) => prev.filter((_, index) => index !== idx));
    }
  };

  // ------------------- Render Contracts -------------------
  const renderContractsTable = () => {
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedContracts = contracts.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="contracts-table-container">
        <div className="table-header">
          <h3>Active Contracts</h3>
          <div className="pager">
            <button
              className="pager-btn"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              ←
            </button>
            <span className="page-indicator">
              Page {page} of {Math.ceil(contracts.length / itemsPerPage)}
            </span>
            <button
              className="pager-btn"
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(contracts.length / itemsPerPage)}
            >
              →
            </button>
          </div>
        </div>
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
              <tr>
                <td colSpan="4">No active contracts available</td>
              </tr>
            ) : (
              paginatedContracts.map((contract) => (
                <tr key={contract.id}>
                  <td>{contract.name}</td>
                  <td>{contract.celebratorName}</td>
                  <td>{contract.contractNumber}</td>
                  <td>
                    <button
                      className="btn-review"
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            `http://localhost:5000/contracts/${contract.id}`
                          );
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
    );
  };

  // ------------------- Inventory Table -------------------
  const renderInventoryTable = () => (
    <div className="contracts-table-container">
      <div className="table-actions">
        <button className="btn-add" onClick={() => openInventoryModal("add")}>
          Add Item
        </button>
      </div>
      <h3>Inventory Monitoring</h3>
      {inventoryData.length === 0 ? (
        <p>No inventory data</p>
      ) : (
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Description</th>
              <th>UOM</th>
              <th>On-hand Start</th>
              <th>Quantity</th>
              <th>Damages</th>
              <th>On-hand End</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventoryData.map((item, idx) => (
              <tr key={idx}>
                <td>{item["Item Code"]}</td>
                <td>{item["Item Description"]}</td>
                <td>{item.UOM}</td>
                <td>{item["On-hand (Start)"]}</td>
                <td>{item.Quantity}</td>
                <td>{item.Damages}</td>
                <td>{item["On-hand (End)"]}</td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => openInventoryModal("edit", item, idx)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => deleteInventoryItem(idx)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // ------------------- Monitoring Table -------------------
  const renderMonitoringTable = () => (
    <div className="contracts-table-container">
      <div className="table-actions">
        <button className="btn-add" onClick={() => openMonitoringModal("add")}>
          Add Section
        </button>
      </div>
      <h3>Inventory Monitoring Sections</h3>
      {monitoringData.length === 0 ? (
        <p>No monitoring data</p>
      ) : (
        monitoringData.map((section, idx) => (
          <div key={idx} style={{ marginBottom: "2rem" }}>
            <table className="monitoring-table">
              <thead>
                <tr>
                  {section.header.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{cell}</td>
                    ))}
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() =>
                          openMonitoringModal("edit", section, idx)
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => deleteMonitoringItem(idx)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );

  // ------------------- Modals -------------------
  const renderInventoryModal = () =>
    inventoryModalOpen && (
      <div className="modal-overlay" onClick={closeInventoryModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h3>
            {inventoryModalMode === "add"
              ? "Add Inventory Item"
              : "Edit Inventory Item"}
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveInventoryItem();
            }}
          >
            {[
              "Item Code",
              "Item Description",
              "UOM",
              "On-hand (Start)",
              "Quantity",
              "Damages",
              "On-hand (End)",
            ].map((field) => (
              <div key={field} className="modal-input-group">
                <label>{field}</label>
                <input
                  value={inventoryModalData[field] || ""}
                  onChange={(e) =>
                    setInventoryModalData((prev) => ({
                      ...prev,
                      [field]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div className="modal-actions">
              <button type="submit" className="btn-save">
                Save
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={closeInventoryModal}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );

  const renderMonitoringModal = () =>
    monitoringModalOpen && (
      <div className="modal-overlay" onClick={closeMonitoringModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h3>
            {monitoringModalMode === "add" ? "Add Section" : "Edit Section"}
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMonitoringItem();
            }}
          >
            <div className="modal-input-group">
              <label>Header (comma-separated)</label>
              <input
                value={monitoringModalData.header?.join(", ") || ""}
                onChange={(e) =>
                  setMonitoringModalData((prev) => ({
                    ...prev,
                    header: e.target.value
                      .split(",")
                      .map((h) => h.trim()),
                  }))
                }
              />
            </div>
            <div className="modal-actions">
              <button type="submit" className="btn-save">
                Save
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={closeMonitoringModal}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );

  // ------------------- Contract Details Modal -------------------
  const renderDetailsModal = () =>
    selectedContract && (
      <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Warehouse Contract Details</h3>
            <button
              className="close-btn"
              onClick={() => setSelectedContract(null)}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <h4>Contract Number: {selectedContract.contractNumber}</h4>
            <p>
              <strong>Celebrator:</strong>{" "}
              {selectedContract.page1?.celebratorName || "N/A"}
            </p>
            <p>
              <strong>Date of Event:</strong>{" "}
              {selectedContract.page1?.eventDate || "N/A"}
            </p>
            <p>
              <strong>VIP Table Type:</strong>{" "}
              {selectedContract.page1?.vipTableType || "N/A"}
            </p>
            <p>
              <strong>Regular Table Type:</strong>{" "}
              {selectedContract.page1?.regularTableType || "N/A"}
            </p>
            <h4>Chairs</h4>
            <p>
              Monoblock: {selectedContract.page2?.chairsMonoblock || "N/A"}
            </p>
            <p>
              Tiffany: {selectedContract.page2?.chairsTiffany || "N/A"}
            </p>
            <p>
              Crystal: {selectedContract.page2?.chairsCrystal || "N/A"}
            </p>
            <h4>Menu Summary</h4>
            <p>
              Main Entrée Count:{" "}
              {selectedContract.page3?.mainEntree
                ? selectedContract.page3.mainEntree
                    .split("\n")
                    .filter((i) => i.trim()).length
                : 0}
            </p>
          </div>
        </div>
      </div>
    );

  // ------------------- Main Render -------------------
  return (
    <div className="department-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Warehouse Dashboard</h1>
          <div className="header-nav">
            <button
              className={`nav-btn ${
                activeView === "contracts" ? "active" : ""
              }`}
              onClick={() => setActiveView("contracts")}
            >
              Active Contracts
            </button>
            <button
              className={`nav-btn ${
                activeView === "inventory" ? "active" : ""
              }`}
              onClick={() => setActiveView("inventory")}
            >
              Inventory Monitoring
            </button>
            <button
              className={`nav-btn ${
                activeView === "monitoring" ? "active" : ""
              }`}
              onClick={() => setActiveView("monitoring")}
            >
              Inventory Sections
            </button>
          </div>
          <button onClick={onLogout} className="logout-btn header-logout">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeView === "contracts" && renderContractsTable()}
        {activeView === "inventory" && renderInventoryTable()}
        {activeView === "monitoring" && renderMonitoringTable()}
      </div>

      {selectedContract && renderDetailsModal()}
      {renderInventoryModal()}
      {renderMonitoringModal()}
    </div>
  );
}

export default WarehouseDashboard;
