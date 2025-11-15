import React, { useState, useEffect } from "react";
import "./DepartmentDashboard.css";

function WarehouseDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [page, setPage] = useState(1);
  const [activeView, setActiveView] = useState("dashboard");

  // Inventory state
  const [inventoryData, setInventoryData] = useState([]);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [inventoryModalMode, setInventoryModalMode] = useState("add");
  const [inventoryModalData, setInventoryModalData] = useState({});
  const [inventoryEditingId, setInventoryEditingId] = useState(null);
  const [currentInventoryDepartment, setCurrentInventoryDepartment] = useState("warehouse");

  // Fabrication request modal state
  const [fabricationRequestModalOpen, setFabricationRequestModalOpen] = useState(false);
  const [selectedItemForRequest, setSelectedItemForRequest] = useState(null);
  const [fabricationRequestData, setFabricationRequestData] = useState({
    quantity: "",
    remarks: ""
  });

  // Other state
  const [fabricationRequests, setFabricationRequests] = useState([]);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [inventory, setInventory] = useState([]);
  const [message, setMessage] = useState("");
  const [fabricationReport, setFabricationReport] = useState([]);

  // ------------------- Fetch Data -------------------
  useEffect(() => {
    if (activeView === "dashboard") fetchDashboardData();
    if (activeView === "contracts") fetchContracts();
    if (activeView === "inventory") fetchInventory();
    if (activeView === "fabrication-report") generateFabricationReport();
  }, [activeView]);

  const fetchDashboardData = async () => {
    await Promise.all([
      fetchContracts(),
      fetchInventory(),
      fetchFabricationRequests()
    ]);
  };

  const fetchContracts = async () => {
    try {
      const res = await fetch("http://localhost:5000/contracts");
      const data = await res.json();
      if (res.ok) {
        setContracts(
          (data.contracts || [])
            .filter(c => c.status === "Active")
            .map(c => ({
              id: c._id,
              name: (c.page1 && (c.page1.contractName || c.page1.occasion)) || "Contract",
              client: (c.page1 && c.page1.celebratorName) || "",
              value: (c.page3 && c.page3.grandTotal) || "",
              startDate: (c.page1 && c.page1.eventDate) || "",
              endDate: (c.page1 && c.page1.eventDate) || "",
              contractNumber: c.contractNumber,
              raw: c,
            }))
        );
      }
    } catch (e) {
      console.error("Error fetching contracts:", e);
    }
  };

  const fetchInventory = async (department = "warehouse") => {
    try {
      let url = "http://localhost:5000/inventory";
      if (department) {
        url = `http://localhost:5000/inventory?department=${department}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      setInventoryData(data);
    } catch (err) {
      console.error("Error fetching inventory data:", err);
      setInventoryData([]);
    }
  };

  const fetchFabricationRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/fabrication-requests");
      const data = await res.json();
      setFabricationRequests(data || []);
    } catch (err) {
      console.error("Error fetching fabrication requests:", err);
    }
  };

  // ------------------- Inventory Analysis -------------------
  const getStockStatus = (item) => {
    const quantity = parseInt(item.Quantity) || 0;
    if (quantity === 0) return { status: "out-of-stock", text: "Out of Stock", priority: 1 };
    if (quantity <= 5) return { status: "low-stock", text: "Low Stock", priority: 2 };
    return { status: "normal", text: "In Stock", priority: 3 };
  };

  const getLowStockItems = () => {
    return inventoryData.filter(item => {
      const { status } = getStockStatus(item);
      return status === "low-stock" || status === "out-of-stock";
    }).sort((a, b) => getStockStatus(a).priority - getStockStatus(b).priority);
  };

  const generateFabricationReport = () => {
    const lowStockItems = getLowStockItems();
    const report = lowStockItems.map(item => {
      const quantity = parseInt(item.Quantity) || 0;
      const suggestedQuantity = quantity === 0 ? 20 : 15; // Suggested restock quantity
      
      return {
        ...item,
        currentStock: quantity,
        suggestedQuantity,
        urgency: quantity === 0 ? "High" : "Medium",
        requestType: "restock"
      };
    });
    
    setFabricationReport(report);
  };

  // ------------------- Fabrication Request Functions -------------------
  const openFabricationRequestModal = (item) => {
    setSelectedItemForRequest(item);
    setFabricationRequestData({
      quantity: item.suggestedQuantity.toString(),
      remarks: `Restock request for ${item["Item Name"]}. Current stock: ${item.currentStock || 0}`
    });
    setFabricationRequestModalOpen(true);
  };

  const closeFabricationRequestModal = () => {
    setFabricationRequestModalOpen(false);
    setSelectedItemForRequest(null);
    setFabricationRequestData({
      quantity: "",
      remarks: ""
    });
  };

  const submitFabricationRequest = async (item, requestedQuantity, remarks = "") => {
    try {
      const requestData = {
        username: user?.username,    
        item: item["Item Name"],
        itemId: item["Item Id"] || item._id,
        quantity: requestedQuantity,
        remarks: remarks || `Restock request for ${item["Item Name"]}. Current stock: ${item.Quantity || 0}`,
        requestType: "restock",
        status: "pending",
        currentStock: item.Quantity || 0,
        department: "warehouse"
      };

      const res = await fetch("http://localhost:5000/fabrication-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Fabrication request for ${item["Item Name"]} submitted successfully!`);
        fetchFabricationRequests();
        return true;
      } else {
        setMessage("Error: " + data.message);
        return false;
      }
    } catch (err) {
      console.error("Error submitting fabrication request:", err);
      setMessage("Server error while submitting request.");
      return false;
    }
  };

  const handleFabricationRequestSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedItemForRequest) return;

    const success = await submitFabricationRequest(
      selectedItemForRequest,
      parseInt(fabricationRequestData.quantity),
      fabricationRequestData.remarks
    );

    if (success) {
      closeFabricationRequestModal();
    }
  };

  const submitBulkFabricationRequests = async (items) => {
    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      const success = await submitFabricationRequest(
        item, 
        item.suggestedQuantity, 
        "Bulk restock request from fabrication report"
      );
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setMessage(`Bulk request completed: ${successCount} successful, ${errorCount} failed`);
  };

  const downloadFabricationReport = () => {
    const reportData = fabricationReport.map(item => ({
      "Item ID": item["Item Id"] || item._id,
      "Item Name": item["Item Name"],
      "Category": item.Category,
      "Current Stock": item.currentStock,
      "Suggested Quantity": item.suggestedQuantity,
      "Unit": item.Unit,
      "Urgency": item.urgency,
      "Request Type": item.requestType
    }));

    const csv = [
      Object.keys(reportData[0]).join(","),
      ...reportData.map(row => Object.values(row).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fabrication-restock-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setMessage("Fabrication report downloaded successfully!");
  };

  // ------------------- Inventory CRUD -------------------
  const openInventoryModal = (mode, data = {}, id = null, department = "warehouse") => {
    setInventoryModalMode(mode);
    setInventoryModalData(data);
    setInventoryEditingId(id);
    setCurrentInventoryDepartment(department);
    setInventoryModalOpen(true);
  };

  const closeInventoryModal = () => {
    setInventoryModalOpen(false);
    setInventoryModalData({});
    setInventoryEditingId(null);
  };

  const saveInventoryItem = async () => {
    try {
      const url = inventoryModalMode === "add" 
        ? "http://localhost:5000/inventory" 
        : `http://localhost:5000/inventory/${inventoryEditingId}`;
      
      const method = inventoryModalMode === "add" ? "POST" : "PUT";
      
      const itemData = {
        ...inventoryModalData,
        Department: currentInventoryDepartment,
        Quantity: parseInt(inventoryModalData.Quantity) || 0
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`Item ${inventoryModalMode === "add" ? "added" : "updated"} successfully!`);
        fetchInventory(currentInventoryDepartment);
        closeInventoryModal();
      } else {
        setMessage(data.message || "Error saving item");
      }
    } catch (err) {
      console.error("Error saving inventory item:", err);
      setMessage("Error saving item");
    }
  };

  const deleteInventoryItem = async (id, department = "warehouse") => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`http://localhost:5000/inventory/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage("Item deleted successfully!");
        fetchInventory(department);
      } else {
        setMessage("Error deleting item");
      }
    } catch (err) {
      console.error("Error deleting inventory item:", err);
      setMessage("Error deleting item");
    }
  };

  // ====== RENDER FUNCTIONS ======
  const renderDashboardView = () => {
    const totalItems = inventoryData.length;
    const lowStockItems = getLowStockItems();
    const outOfStockItems = lowStockItems.filter(item => getStockStatus(item).status === "out-of-stock").length;
    const lowStockCount = lowStockItems.filter(item => getStockStatus(item).status === "low-stock").length;
    const pendingRequests = fabricationRequests.filter(req => req.status === 'pending').length;
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedContracts = contracts.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="dashboard-view">

        {/* Stats Overview */}
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <div className="card-icon"></div>
            <div className="card-content">
              <div className="card-value">{totalItems}</div>
              <div className="card-label">Total Items</div>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="card-icon"></div>
            <div className="card-content">
              <div className="card-value">{lowStockCount}</div>
              <div className="card-label">Low Stock</div>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="card-icon"></div>
            <div className="card-content">
              <div className="card-value">{outOfStockItems}</div>
              <div className="card-label">Out of Stock</div>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="card-icon"></div>
            <div className="card-content">
              <div className="card-value">{pendingRequests}</div>
              <div className="card-label">Pending Requests</div>
            </div>
          </div>
        </div>
        <div className="contracts-table-container">
        <div className="table-header">
          <h3>Active Contracts</h3>
          <div className="pager">
            <button className="pager-btn" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>←</button>
            <span className="page-indicator">Page {page} of {Math.ceil(contracts.length / itemsPerPage)}</span>
            <button className="pager-btn" onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(contracts.length / itemsPerPage)}>→</button>
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
              <tr><td colSpan="4">No active contracts available</td></tr>
            ) : (
              paginatedContracts.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.client}</td>
                  <td>{c.contractNumber}</td>
                  <td>
                    <button className="btn-review" onClick={() => setSelectedContract(c.raw)}>View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
        {/* Low Stock Alert Table */}
        {lowStockItems.length > 0 && (
          <div className="section-container">
            <div className="section-header">
              <h3>Items Needing for Requests ({lowStockItems.length})</h3>
            </div>
            <div className="low-stock-table">
              <table>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Current Stock</th>
                    <th>Status</th>
                    <th>Category</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.slice(0, 5).map((item, idx) => {
                    const { status, text } = getStockStatus(item);
                    const quantity = parseInt(item.Quantity) || 0;
                    
                    return (
                      <tr key={item._id || idx} className={`stock-alert ${status}`}>
                        <td className="item-name">{item["Item Name"]}</td>
                        <td className="stock-quantity">{quantity}</td>
                        <td>
                          <span className={`status ${status}`}>
                            {text}
                          </span>
                        </td>
                        <td>{item.Category}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-primary small"
                              onClick={() => openFabricationRequestModal({
                                ...item,
                                currentStock: quantity,
                                suggestedQuantity: quantity === 0 ? 20 : 15
                              })}
                            >
                              Request Restock
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {lowStockItems.length > 5 && (
                <div className="view-all-link">
                  <button 
                    className="text-link" 
                    onClick={() => setActiveView("fabrication-report")}
                  >
                    View All {lowStockItems.length} Items Needing Requests →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFabricationReportView = () => {
    const lowStockItems = getLowStockItems();

    return (
      <div className="contracts-table-container">
        <div className="table-header">
          <h3>Request Item Report</h3>
           {message && <div className="message success">{message}</div>}
          <div className="table-actions">
            <button 
              className="btn-secondary" 
              onClick={downloadFabricationReport}
              disabled={fabricationReport.length === 0}
            >
              Download Report
            </button>
            <button 
              className="btn-secondary" 
              onClick={generateFabricationReport}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="report-summary">
          <div className="summary-cards">
            <div className="summary-card critical">
              <div className="summary-value">
                {fabricationReport.filter(item => item.urgency === "High").length}
              </div>
              <div className="summary-label">Critical (Out of Stock)</div>
            </div>
            <div className="summary-card warning">
              <div className="summary-value">
                {fabricationReport.filter(item => item.urgency === "Medium").length}
              </div>
              <div className="summary-label">Warning (Low Stock)</div>
            </div>
            <div className="summary-card total">
              <div className="summary-value">{fabricationReport.length}</div>
              <div className="summary-label">Total Items to Request</div>
            </div>
          </div>
        </div>

        {fabricationReport.length === 0 ? (
          <div className="no-data">
            <p>No items require fabrication requests at this time.</p>
            <p>All inventory items are sufficiently stocked.</p>
          </div>
        ) : (
          <table className="fabrication-report-table">
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Suggested Quantity</th>
                <th>Unit</th>
                <th>Urgency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fabricationReport.map((item, idx) => (
                <tr key={item._id || idx} className={`urgency-${item.urgency.toLowerCase()}`}>
                  <td>{item["Item Id"] || item._id}</td>
                  <td className="item-name">{item["Item Name"]}</td>
                  <td>{item.Category}</td>
                  <td className="current-stock">{item.currentStock}</td>
                  <td className="suggested-quantity">{item.suggestedQuantity}</td>
                  <td>{item.Unit}</td>
                  <td>
                    <span className={`urgency-badge ${item.urgency.toLowerCase()}`}>
                      {item.urgency}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-primary small"
                        onClick={() => openFabricationRequestModal(item)}
                      >
                        Request
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
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
              <tr><td colSpan="4">No active contracts available</td></tr>
            ) : (
              paginatedContracts.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.client}</td>
                  <td>{c.contractNumber}</td>
                  <td>
                    <button className="btn-review" onClick={() => setSelectedContract(c.raw)}>View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderInventoryTable = () => {
    return (
      <div className="contracts-table-container">
        <div className="table-header">
          <h3>Warehouse Inventory Management</h3>
          <div className="table-actions">
            <button className="btn-add" onClick={() => openInventoryModal("add", {}, null, "warehouse")}>
              Add New Item
            </button>
          </div>
        </div>
        
        {inventoryData.length === 0 ? (
          <div className="no-data">
            <p>No inventory data found for warehouse.</p>
            <button 
              className="btn-primary" 
              onClick={() => fetchInventory("warehouse")}
            >
              Refresh Data
            </button>
          </div>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Quantity</th>
                <th>Stock Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventoryData.map((item, idx) => {
                const quantity = parseInt(item.Quantity) || 0;
                const itemId = item["Item Id"] || item._id || `No ID-${idx}`;
                const itemName = item["Item Name"] || "Unnamed Item";
                const category = item.Category || "Uncategorized";
                const unit = item.Unit || "pcs";
                const { status, text } = getStockStatus(item);
                
                return (
                  <tr key={item._id || idx}>
                    <td>{itemId}</td>
                    <td>{itemName}</td>
                    <td>{category}</td>
                    <td>{unit}</td>
                    <td>{quantity}</td>
                    <td>
                      <span className={`status ${status}`}>
                        {text}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-edit" 
                          onClick={() => openInventoryModal("edit", item, item._id, "warehouse")}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-delete" 
                          onClick={() => deleteInventoryItem(item._id, "warehouse")}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  };   

  const renderFabricationRequestModal = () => (
    fabricationRequestModalOpen && selectedItemForRequest && (
      <div className="modal-overlay" onClick={closeFabricationRequestModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Create Restock Request</h3>
            <button className="close-btn" onClick={closeFabricationRequestModal}>×</button>
          </div>
          
          <form onSubmit={handleFabricationRequestSubmit}>
            <div className="modal-input-group">
              <label>Requestor Name</label>
              <input
                type="text"
                value={user?.username || ""}
                readOnly
              />
            </div>

            <div className="modal-input-group">
              <label>Item Name</label>
              <input
                type="text"
                value={selectedItemForRequest["Item Name"]}
                readOnly
              />
            </div>

            <div className="modal-input-group">
              <label>Current Stock</label>
              <input
                type="text"
                value={selectedItemForRequest.currentStock}
                readOnly
              />
            </div>

            <div className="modal-input-group">
              <label>Suggested Quantity</label>
              <input
                type="text"
                value={selectedItemForRequest.suggestedQuantity}
                readOnly
              />
            </div>

            <div className="modal-input-group">
              <label>Quantity Needed *</label>
              <input
                type="number"
                min="1"
                value={fabricationRequestData.quantity}
                onChange={(e) => setFabricationRequestData(prev => ({ 
                  ...prev, 
                  quantity: e.target.value 
                }))}
                required
              />
            </div>

            <div className="modal-input-group">
              <label>Remarks (Optional)</label>
              <textarea
                value={fabricationRequestData.remarks}
                onChange={(e) => setFabricationRequestData(prev => ({ 
                  ...prev, 
                  remarks: e.target.value 
                }))}
                placeholder="Additional information about this restock request..."
                rows="3"
              />
            </div>

            <div className="modal-actions">
              <button type="submit" className="btn-save">Submit Request</button>
              <button type="button" className="btn-cancel" onClick={closeFabricationRequestModal}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );

  const renderDetailsModal = () => (
    selectedContract && (
      <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
        <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Contract Details - {selectedContract?.contractNumber}</h3>
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
                    <strong>Venue:</strong> {selectedContract.page1?.venue || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>Total No. of Guests:</strong> {selectedContract.page1?.totalGuests || "N/A"}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Event Timeline</h4>
                  <div className="detail-row">
                    <strong>Arrival of Guests:</strong> {selectedContract.page1?.arrivalOfGuests || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>Ingress Time:</strong> {selectedContract.page1?.ingressTime || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>Cocktail Time:</strong> {selectedContract.page1?.cocktailTime || "N/A"}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Guest Breakdown</h4>
                  <div className="detail-row">
                    <strong>VIP Guests:</strong> {selectedContract.page1?.vipTableType || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>Regular Guests:</strong> {selectedContract.page1?.regularTableType || "N/A"}
                  </div>
                </div>

                {selectedContract.page3 && (
                  <div className="detail-section">
                    <h4>Menu Details</h4>
                    {selectedContract.page3.cocktailHour && (
                      <div className="detail-row">
                        <strong>Cocktail Hour:</strong> {selectedContract.page3.cocktailHour}
                      </div>
                    )}
                    {selectedContract.page3.mainEntree && (
                      <div className="detail-row">
                        <strong>Main Entrée:</strong> {selectedContract.page3.mainEntree}
                      </div>
                    )}
                    {selectedContract.page3.dessert && (
                      <div className="detail-row">
                        <strong>Dessert:</strong> {selectedContract.page3.dessert}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setSelectedContract(null)}>Close</button>
          </div>
        </div>
      </div>
    )
  );

  const renderInventoryModal = () => (
    inventoryModalOpen && (
      <div className="modal-overlay" onClick={closeInventoryModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h3>
            {inventoryModalMode === "add" ? "Add Inventory Item" : "Edit Inventory Item"} - {currentInventoryDepartment}
          </h3>
          <form onSubmit={(e) => { e.preventDefault(); saveInventoryItem(); }}>
            {["Item Id", "Item Name", "Category", "Unit", "Quantity"].map(field => (
              <div key={field} className="modal-input-group">
                <label>{field}</label>
                <input
                  value={inventoryModalData[field] || ""}
                  onChange={(e) => setInventoryModalData(prev => ({ ...prev, [field]: e.target.value }))}
                  type={field === "Quantity" ? "number" : "text"}
                />
              </div>
            ))}
            <div className="modal-actions">
              <button type="submit" className="btn-save">Save</button>
              <button type="button" className="btn-cancel" onClick={closeInventoryModal}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    )
  );

  return (
    <div className="department-dashboard">
      {/* Left Sidebar */}
      <div className="dashboard-sidebar">
        <div className="accreditation-header">
          <h1>WAREHOUSE</h1>
          <h2>Dashboard</h2>
        </div>
        
        <div className="header-nav">
          <div className="nav-section">
            <div className="section-title">Navigation</div>
            <button className={`nav-btn ${activeView === "dashboard" ? "active" : ""}`} onClick={() => setActiveView("dashboard")}>
              Dashboard
            </button>
          </div>
          
          <div className="nav-section">
            <div className="section-title">Fabrication Management</div>
            <button className={`nav-btn ${activeView === "inventory" ? "active" : ""}`} onClick={() => setActiveView("inventory")}>
              Warehouse Inventory
            </button>
            <button className={`nav-btn ${activeView === "fabrication-report" ? "active" : ""}`} onClick={() => setActiveView("fabrication-report")}>
              Request Item Report
            </button>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeView === "dashboard" && renderDashboardView()}
        {activeView === "contracts" && renderContractsTable()}
        {activeView === "inventory" && renderInventoryTable()}
        {activeView === "fabrication-report" && renderFabricationReportView()}
      </div>

      {selectedContract && renderDetailsModal()}
      {renderInventoryModal()}
      {renderFabricationRequestModal()}
    </div>
  );
}

export default WarehouseDashboard;