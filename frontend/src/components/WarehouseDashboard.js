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

  // Post-event checklist state
  const [submittedChecklists, setSubmittedChecklists] = useState([]);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [checklistItems, setChecklistItems] = useState([]);
  const [missingItems, setMissingItems] = useState([]);
  const [isEditingChecklist, setIsEditingChecklist] = useState(false);
  const [editingChecklistId, setEditingChecklistId] = useState(null);

  // Other state
  const [fabricationRequests, setFabricationRequests] = useState([]);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [message, setMessage] = useState("");
  const [fabricationReport, setFabricationReport] = useState([]);

  // ------------------- Fetch Data -------------------
  useEffect(() => {
    if (activeView === "dashboard") fetchDashboardData();
    if (activeView === "contracts") fetchContracts();
    if (activeView === "inventory") fetchInventory();
    if (activeView === "fabrication-report") generateFabricationReport();
    if (activeView === "fabrication-requests") fetchFabricationRequests();
    if (activeView === "checklists") fetchSubmittedChecklists();
  }, [activeView]);

  const fetchDashboardData = async () => {
    await Promise.all([
      fetchContracts(),
      fetchInventory(),
      fetchFabricationRequests()
    ]);
  };

  const fetchSubmittedChecklists = async () => {
    try {
      const res = await fetch("http://localhost:5000/post-event-checklists");
      const data = await res.json();
      if (res.ok) {
        setSubmittedChecklists(data);
      }
    } catch (err) {
      console.error("Error fetching checklists:", err);
      setSubmittedChecklists([]);
    }
  };

  const fetchContracts = async () => {
  try {
    const res = await fetch("http://localhost:5000/contracts");
    const data = await res.json();
    if (res.ok) {
      const checklistsRes = await fetch("http://localhost:5000/post-event-checklists");
      const checklistsData = await checklistsRes.ok ? await checklistsRes.json() : [];
      
      setContracts(
        (data.contracts || [])
          .filter(c => c.status === "Active" || c.status === "Completed")
          .map(c => {
            const existingChecklist = checklistsData.find(cl => cl.contractId === c._id && cl.department === 'warehouse');
            return {
              id: c._id,
              name: (c.page1 && (c.page1.contractName || c.page1.occasion)) || "Contract",
              client: (c.page1 && c.page1.celebratorName) || "",
              value: (c.page3 && c.page3.grandTotal) || "",
              eventDate: c.page1?.eventDate || "",
              contractNumber: c.contractNumber,
              status: c.status,
              hasChecklist: !!existingChecklist,
              existingChecklistId: existingChecklist?._id,
              raw: c,
              // Include table configuration for easy access
              tableConfig: {
                vip: {
                  type: c.page1?.vipTableType,
                  quantity: c.page1?.vipTableQuantity,
                  chairs: c.page1?.vipChairs
                },
                regular: {
                  type: c.page1?.regularTableType,
                  quantity: c.page1?.regularTableQuantity,
                  chairs: c.page1?.regularChairs
                }
              }
            }
          })
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

  // ------------------- Post-Event Checklist -------------------
  const openChecklistModal = async (contract, editMode = false, checklistId = null) => {
    setSelectedContract(contract);
    
    if (editMode && checklistId) {
      try {
        const res = await fetch(`http://localhost:5000/post-event-checklist/${checklistId}`);
        if (res.ok) {
          const existingChecklist = await res.json();
          setChecklistItems(existingChecklist.checklistItems || []);
          setMissingItems(existingChecklist.missingItems || []);
          setEditingChecklistId(checklistId);
          setIsEditingChecklist(true);
        }
      } catch (err) {
        console.error("Error loading checklist for editing:", err);
        setMessage("Error loading checklist");
        return;
      }
    } else {
      const existingChecklist = submittedChecklists.find(cl => 
        cl.contractId === contract._id && cl.department === 'warehouse'
      );
      
      if (existingChecklist) {
        setMessage("A warehouse checklist already exists for this contract. Use the Edit button.");
        return;
      }
      
      const generatedChecklist = generateChecklistItems(contract);
      setChecklistItems(generatedChecklist);
      setMissingItems([]);
      setIsEditingChecklist(false);
      setEditingChecklistId(null);
    }
    
    setChecklistModalOpen(true);
  };

  const generateChecklistItems = (contract) => {
  const p1 = contract.page1 || {};
  const p2 = contract.page2 || {};
  const items = [];

  // Warehouse department items - furniture, equipment, lighting, sound
  const warehouseFields = ['furniture', 'equipment', 'lighting', 'sound'];
  
  warehouseFields.forEach(field => {
    if (p2[field] && p2[field].length > 0) {
      const fieldItems = Array.isArray(p2[field]) ? p2[field] : [p2[field]];
      fieldItems.forEach(item => {
        if (item.trim() !== '') {
          items.push({
            id: `${field}-${item}`,
            name: `${field.charAt(0).toUpperCase() + field.slice(1)}: ${item}`,
            category: field,
            checked: false,
            missing: false,
            department: 'warehouse'
          });
        }
      });
    }
  });

  // Add VIP Table Configuration
  if (p1.vipTableType && p1.vipTableQuantity) {
    items.push({
      id: `vip-table-${p1.vipTableType}`,
      name: `VIP Table: ${p1.vipTableType} (Quantity: ${p1.vipTableQuantity})`,
      category: 'tables',
      checked: false,
      missing: false,
      department: 'warehouse',
      details: {
        type: p1.vipTableType,
        quantity: p1.vipTableQuantity,
        chairs: p1.vipChairs || 'Not specified',
        seatCapacity: 8 // Assuming 8 seats per table as per your requirement
      }
    });
  }

  // Add VIP Chairs
  if (p1.vipChairs && p1.vipTableQuantity) {
    const totalVipChairs = parseInt(p1.vipTableQuantity) * 8; // 8 chairs per table
    items.push({
      id: `vip-chairs-${p1.vipChairs}`,
      name: `VIP Chairs: ${p1.vipChairs} (Quantity: ${totalVipChairs})`,
      category: 'chairs',
      checked: false,
      missing: false,
      department: 'warehouse',
      details: {
        type: p1.vipChairs,
        quantity: totalVipChairs.toString(),
        tableType: p1.vipTableType || 'Not specified'
      }
    });
  }

  // Add Regular Table Configuration
  if (p1.regularTableType && p1.regularTableQuantity) {
    items.push({
      id: `regular-table-${p1.regularTableType}`,
      name: `Regular Table: ${p1.regularTableType} (Quantity: ${p1.regularTableQuantity})`,
      category: 'tables',
      checked: false,
      missing: false,
      department: 'warehouse',
      details: {
        type: p1.regularTableType,
        quantity: p1.regularTableQuantity,
        chairs: p1.regularChairs || 'Not specified',
        seatCapacity: 8 // Assuming 8 seats per table
      }
    });
  }

  // Add Regular Chairs
  if (p1.regularChairs && p1.regularTableQuantity) {
    const totalRegularChairs = parseInt(p1.regularTableQuantity) * 8; // 8 chairs per table
    items.push({
      id: `regular-chairs-${p1.regularChairs}`,
      name: `Regular Chairs: ${p1.regularChairs} (Quantity: ${totalRegularChairs})`,
      category: 'chairs',
      checked: false,
      missing: false,
      department: 'warehouse',
      details: {
        type: p1.regularChairs,
        quantity: totalRegularChairs.toString(),
        tableType: p1.regularTableType || 'Not specified'
      }
    });
  }

  return items;
};

  const handleChecklistChange = (itemId, field, value) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const submitChecklist = async () => {
    try {
      const missingItemsList = checklistItems.filter(item => item.missing);
      
      const checklistData = {
        contractId: selectedContract._id,
        contractNumber: selectedContract.contractNumber,
        checklistItems: checklistItems,
        missingItems: missingItemsList,
        submittedBy: user?.username,
        department: 'warehouse',
        submittedAt: new Date().toISOString()
      };

      let url = "http://localhost:5000/post-event-checklist";
      let method = "POST";

      if (isEditingChecklist && editingChecklistId) {
        url = `http://localhost:5000/post-event-checklist/${editingChecklistId}`;
        method = "PUT";
      } else {
        const existingChecklist = submittedChecklists.find(cl => 
          cl.contractId === selectedContract._id && cl.department === 'warehouse'
        );
        
        if (existingChecklist) {
          setMessage("A warehouse checklist already exists for this contract. Please use the Edit button.");
          return;
        }
      }

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checklistData),
      });

      if (res.ok) {
        const responseData = await res.json();
        
        setMessage(`Warehouse checklist ${isEditingChecklist ? 'updated' : 'submitted'} successfully!`);
        setChecklistModalOpen(false);
        
        setIsEditingChecklist(false);
        setEditingChecklistId(null);
        
        fetchContracts();
        fetchSubmittedChecklists();
        
      } else {
        const data = await res.json();
        setMessage("Error: " + data.message);
      }
    } catch (err) {
      console.error("Error submitting checklist:", err);
      setMessage("Server error while submitting checklist");
    }
  };

  // ------------------- Fabrication Request Approval Workflow -------------------
  const approveFabricationRequest = async (requestId) => {
    try {
      const res = await fetch(`http://localhost:5000/fabrication-requests/${requestId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: user?.username })
      });

      if (res.ok) {
        setMessage("Fabrication request approved!");
        fetchFabricationRequests();
      } else {
        const data = await res.json();
        setMessage("Error: " + data.message);
      }
    } catch (err) {
      console.error("Error approving request:", err);
      setMessage("Server error while approving request");
    }
  };

  const markRequestAsReceived = async (requestId) => {
    try {
      const res = await fetch(`http://localhost:5000/fabrication-requests/${requestId}/received`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receivedBy: user?.username })
      });

      if (res.ok) {
        setMessage("Items received and inventory updated!");
        fetchFabricationRequests();
        fetchInventory();
      } else {
        const data = await res.json();
        setMessage("Error: " + data.message);
      }
    } catch (err) {
      console.error("Error marking as received:", err);
      setMessage("Server error while updating request");
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
      const suggestedQuantity = quantity === 0 ? 20 : 15;
      
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
    a.download = `warehouse-fabrication-report-${new Date().toISOString().split('T')[0]}.csv`;
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

  // ------------------- Utility Functions -------------------
  const isEventPassed = (eventDate) => {
    if (!eventDate) return false;
    
    try {
      const eventDay = new Date(eventDate).toISOString().split('T')[0];
      const todayDay = new Date().toISOString().split('T')[0];
      return eventDay < todayDay;
    } catch (error) {
      console.error('Error:', error);
      return false;
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
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedContracts.length === 0 ? (
                <tr><td colSpan="5">No active contracts available</td></tr>
              ) : (
                paginatedContracts.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.client}</td>
                    <td>{c.contractNumber}</td>
                    <td>
                      <span className={`status ${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-review" onClick={() => renderDetailsModal(c.raw)}>View</button>
                        {isEventPassed(c.eventDate) && c.status === "Active" && (
                          <button 
                            className="btn-checklist"
                            onClick={() => openChecklistModal(c.raw)}
                          >
                            Post-Event Checklist
                          </button>
                        )}
                        {isEventPassed(c.eventDate) && c.status === "Active" && c.hasChecklist && (
                          <button 
                            className="btn-edit small"
                            onClick={() => openChecklistModal(c.raw, true, c.existingChecklistId)}
                          >
                            Edit Checklist
                          </button>
                        )}
                      </div>
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

        {submittedChecklists.length > 0 && (
          <div className="section-container">
            <div className="section-header">
              <h3>Recent Post-Event Checklists</h3>
              <button 
                className="text-link"
                onClick={() => setActiveView("checklists")}
              >
                View All →
              </button>
            </div>
            <div className="recent-checklists">
              <table>
                <thead>
                  <tr>
                    <th>Contract Number</th>
                    <th>Submitted By</th>
                    <th>Missing Items</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submittedChecklists.slice(0, 3).map((checklist, index) => (
                    <tr key={checklist._id || index}>
                      <td>{checklist.contractNumber}</td>
                      <td>{checklist.submittedBy}</td>
                      <td>
                        <span className={`missing-count ${checklist.missingItems?.length > 0 ? 'has-missing' : ''}`}>
                          {checklist.missingItems?.length || 0}
                        </span>
                      </td>
                      <td>
                        {checklist.createdAt ? new Date(checklist.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <button 
                          className="btn-primary small"
                          onClick={() => setSelectedChecklist(checklist)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFabricationRequestsView = () => {
    return (
      <div className="contracts-table-container">
        <div className="table-header">
          <h3>Fabrication Requests</h3>
          {message && <div className="message success">{message}</div>}
        </div>

        <table className="fabrication-requests-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Requested By</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fabricationRequests.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">No fabrication requests found</td>
              </tr>
            ) : (
              fabricationRequests.map(request => (
                <tr key={request._id} className={`status-${request.status}`}>
                  <td>{request._id.slice(-6)}</td>
                  <td>{request.item}</td>
                  <td>{request.quantity}</td>
                  <td>{request.username}</td>
                  <td>
                    <span className={`status-badge ${request.status}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      {request.status === "pending" && (
                        <button 
                          className="btn-approve small"
                          onClick={() => approveFabricationRequest(request._id)}
                        >
                          Approve
                        </button>
                      )}
                      {request.status === "approved" && (
                        <button 
                          className="btn-success small"
                          onClick={() => markRequestAsReceived(request._id)}
                        >
                          Mark Received
                        </button>
                      )}
                      {request.status === "completed" && (
                        <span className="completed-text">Completed</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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

  const renderChecklistsView = () => {
    return (
      <div className="contracts-table-container">
        <div className="table-header">
          <h3>Submitted Post-Event Checklists</h3>
          {message && <div className="message success">{message}</div>}
          <div className="table-actions">
            <button 
              className="btn-secondary" 
              onClick={fetchSubmittedChecklists}
            >
              Refresh
            </button>
          </div>
        </div>

        {submittedChecklists.length === 0 ? (
          <div className="no-data">
            <p>No post-event checklists submitted yet.</p>
            <p>Checklists will appear here after events are completed and submitted.</p>
          </div>
        ) : (
          <table className="checklists-table">
            <thead>
              <tr>
                <th>Contract Number</th>
                <th>Department</th>
                <th>Submitted By</th>
                <th>Total Items</th>
                <th>Missing Items</th>
                <th>Submitted Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submittedChecklists.map((checklist, index) => (
                <tr key={checklist._id || index}>
                  <td><strong>{checklist.contractNumber}</strong></td>
                  <td>
                    <span className={`department-badge ${checklist.department}`}>
                      {checklist.department.toUpperCase()}
                    </span>
                  </td>
                  <td>{checklist.submittedBy}</td>
                  <td>{checklist.checklistItems?.length || 0}</td>
                  <td>
                    <span className={`missing-count ${checklist.missingItems?.length > 0 ? 'has-missing' : ''}`}>
                      {checklist.missingItems?.length || 0}
                    </span>
                  </td>
                  <td>
                    {checklist.createdAt ? new Date(checklist.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-primary small"
                        onClick={() => setSelectedChecklist(checklist)}
                      >
                        View
                      </button>
                      {checklist.department === 'warehouse' && (
                        <button 
                          className="btn-edit small"
                          onClick={async () => {
                            const contract = contracts.find(c => c.raw?._id === checklist.contractId);
                            if (contract) {
                              await openChecklistModal(contract.raw, true, checklist._id);
                            }
                          }}
                        >
                          Edit
                        </button>
                      )}
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

  const renderChecklistDetailModal = () => (
    selectedChecklist && (
      <div className="modal-overlay" onClick={() => setSelectedChecklist(null)}>
        <div className="modal-content large-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Checklist Details - {selectedChecklist.contractNumber}</h3>
            <button className="close-btn" onClick={() => setSelectedChecklist(null)}>×</button>
          </div>
          
          <div className="modal-body">
            <div className="checklist-detail-container">
              <div className="checklist-meta">
                <div className="meta-grid">
                  <div className="meta-item">
                    <strong>Contract Number:</strong>
                    <span>{selectedChecklist.contractNumber}</span>
                  </div>
                  <div className="meta-item">
                    <strong>Submitted By:</strong>
                    <span>{selectedChecklist.submittedBy}</span>
                  </div>
                  <div className="meta-item">
                    <strong>Submitted Date:</strong>
                    <span>
                      {selectedChecklist.submittedAt ? 
                        new Date(selectedChecklist.submittedAt).toLocaleDateString() : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="meta-item">
                    <strong>Total Items:</strong>
                    <span>{selectedChecklist.checklistItems?.length || 0}</span>
                  </div>
                  <div className="meta-item">
                    <strong>Checked Items:</strong>
                    <span>
                      {selectedChecklist.checklistItems?.filter(item => item.checked).length || 0}
                    </span>
                  </div>
                  <div className="meta-item missing">
                    <strong>Missing Items:</strong>
                    <span className="missing-badge">
                      {selectedChecklist.missingItems?.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="checklist-items-section">
                <h4>Checklist Items</h4>
                {selectedChecklist.checklistItems?.length === 0 ? (
                  <p className="no-items">No items in this checklist.</p>
                ) : (
                  <div className="checklist-items-grid">
                    {selectedChecklist.checklistItems?.map((item, index) => (
                      <div 
                        key={item.id || index} 
                        className={`checklist-item-card ${item.missing ? 'missing' : ''} ${item.checked ? 'checked' : ''}`}
                      >
                        <div className="item-status">
                          {item.checked ? (
                            <span className="status-icon checked">✓</span>
                          ) : (
                            <span className="status-icon unchecked">○</span>
                          )}
                          {item.missing && (
                            <span className="status-icon missing">⚠</span>
                          )}
                        </div>
                        <div className="item-details">
                          <div className="item-name">{item.name}</div>
                          <div className="item-category">Category: {item.category}</div>
                          <div className="item-status-text">
                            {item.checked ? 'Returned/Recovered' : 'Not Returned'}
                            {item.missing && ' • Reported Missing'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedChecklist.missingItems?.length > 0 && (
                <div className="missing-items-section">
                  <h4 className="missing-header">⚠ Missing Items Report</h4>
                  <div className="missing-items-list">
                    {selectedChecklist.missingItems.map((item, index) => (
                      <div key={item.id || index} className="missing-item">
                        <span className="missing-icon">⚠</span>
                        <span className="missing-name">{item.name}</span>
                        <span className="missing-category">({item.category})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button 
              className="btn-secondary" 
              onClick={() => setSelectedChecklist(null)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  );

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
            <p>No inventory data found for warehouse department.</p>
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

  const renderChecklistModal = () => (
    checklistModalOpen && selectedContract && (
      <div className="modal-overlay" onClick={() => setChecklistModalOpen(false)}>
        <div className="modal-content large-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              {isEditingChecklist ? 'Edit' : 'Create'} Warehouse Checklist - {selectedContract.contractNumber}
              {isEditingChecklist && <span className="edit-badge">(Editing)</span>}
            </h3>
            <button className="close-btn" onClick={() => {
              setChecklistModalOpen(false);
              setIsEditingChecklist(false);
              setEditingChecklistId(null);
            }}>×</button>
          </div>
          
          <div className="modal-body">
            <div className="checklist-container">
              <div className="checklist-header">
                <h4>Event: {selectedContract.page1?.occasion || "Event"}</h4>
                <p>Client: {selectedContract.page1?.celebratorName || "N/A"}</p>
                <p>Event Date: {selectedContract.page1?.eventDate || "N/A"}</p>
                <div className="department-notice">
                  <strong>Warehouse Department Only</strong>
                  <p>This checklist is for Warehouse items only: Furniture, Equipment, Lighting, and Sound.</p>
                  <p>Contract will be marked as Completed when all departments (Creative, Linen, Warehouse) submit their checklists.</p>
                </div>
                {isEditingChecklist && (
                  <div className="edit-notice">
                    <span>⚠ Editing existing Warehouse checklist.</span>
                  </div>
                )}
              </div>

              <div className="checklist-items">
                <h5>Warehouse Items Checklist</h5>
                {checklistItems.length === 0 ? (
                  <p className="no-items">No warehouse items found for this event.</p>
                ) : (
                  <div className="checklist-items-container">
                    {checklistItems.map(item => (
                      <div key={item.id} className="checklist-item">
                        <div className="checklist-item-content">
                          <div className="item-main-info">
                            <label className="checkbox-container large">
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={(e) => handleChecklistChange(item.id, 'checked', e.target.checked)}
                              />
                              <span className="checkmark"></span>
                              <span className="item-name">{item.name}</span>
                            </label>
                            <span className="item-department-badge">Warehouse</span>
                          </div>
                          
                          <div className="item-status-actions">
                            <label className="missing-toggle">
                              <input
                                type="checkbox"
                                checked={item.missing}
                                onChange={(e) => handleChecklistChange(item.id, 'missing', e.target.checked)}
                              />
                              <span className="toggle-slider"></span>
                              <span className="missing-label">
                                {item.missing ? 'Missing' : 'Report Missing'}
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="checklist-summary">
                <h5>Summary</h5>
                <div className="summary-stats">
                  <div className="stat">
                    <span className="stat-label">Total Items:</span>
                    <span className="stat-value">{checklistItems.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Checked Items:</span>
                    <span className="stat-value">
                      {checklistItems.filter(item => item.checked).length}
                    </span>
                  </div>
                  <div className="stat missing">
                    <span className="stat-label">Missing Items:</span>
                    <span className="stat-value">
                      {checklistItems.filter(item => item.missing).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              className="btn-primary" 
              onClick={submitChecklist}
              disabled={checklistItems.length === 0}
            >
              {isEditingChecklist ? 'Update Warehouse Checklist' : 'Submit Warehouse Checklist'}
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => {
                setChecklistModalOpen(false);
                setIsEditingChecklist(false);
                setEditingChecklistId(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  );

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
              {/* Contract Information Section */}
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

              {/* Table Configuration Section */}
              <div className="detail-section">
                <h4>Table Configuration</h4>
                
                {/* VIP Table Configuration */}
                <div className="table-config-section">
                  <h5>VIP Setup</h5>
                  <div className="detail-row">
                    <strong>VIP Table Type:</strong> {selectedContract.page1?.vipTableType || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>VIP Table Quantity:</strong> {selectedContract.page1?.vipTableQuantity || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>VIP Chair Type:</strong> {selectedContract.page1?.vipChairs || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>Total VIP Seats:</strong> 
                    {selectedContract.page1?.vipTableQuantity ? 
                      ` ${parseInt(selectedContract.page1.vipTableQuantity) * 8} seats` : "N/A"}
                  </div>
                </div>

                {/* Regular Table Configuration */}
                <div className="table-config-section">
                  <h5>Regular Setup</h5>
                  <div className="detail-row">
                    <strong>Regular Table Type:</strong> {selectedContract.page1?.regularTableType || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>Regular Table Quantity:</strong> {selectedContract.page1?.regularTableQuantity || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>Regular Chair Type:</strong> {selectedContract.page1?.regularChairs || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>Total Regular Seats:</strong> 
                    {selectedContract.page1?.regularTableQuantity ? 
                      ` ${parseInt(selectedContract.page1.regularTableQuantity) * 8} seats` : "N/A"}
                  </div>
                </div>
              </div>

              {/* Event Timeline Section */}
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

              {/* Guest Breakdown Section */}
              <div className="detail-section">
                <h4>Guest Breakdown</h4>
                <div className="detail-row">
                  <strong>VIP Guests:</strong> {selectedContract.page1?.totalVIP || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Regular Guests:</strong> {selectedContract.page1?.totalRegular || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Total Guests:</strong> {selectedContract.page1?.totalGuests || "N/A"}
                </div>
              </div>

              {/* Menu Details Section */}
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
          {isEventPassed(selectedContract.page1?.eventDate) && selectedContract.status === "Active" && (
            <button 
              className="btn-checklist"
              onClick={() => openChecklistModal(selectedContract)}
            >
              Post-Event Checklist
            </button>
          )}
          <button className="btn-secondary" onClick={() => setSelectedContract(null)}>Close</button>
        </div>
      </div>
    </div>
  )
);
}
export default WarehouseDashboard;
