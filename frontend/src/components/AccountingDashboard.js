import React, { useState, useEffect } from "react";
import "./DepartmentDashboard.css";

function FinanceDashboard({ onLogout, user }) {
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState(null);
  const [message, setMessage] = useState("");
  const [activeView, setActiveView] = useState("dashboard");
  const [accountingContracts, setAccountingContracts] = useState([]);
  const [activeContracts, setActiveContracts] = useState([]);

  // Load data on component mount
  useEffect(() => {
    fetchContracts();
    fetchInvoices();
  }, []);

  const fetchContracts = async () => {
    try {
      const res = await fetch("http://localhost:5000/contracts");
      if (res.ok) {
        const data = await res.json();
        const allContracts = data.contracts || [];
        setContracts(allContracts);
        
        // Filter for contracts that need accounting review
        const forAccountingReview = allContracts.filter(contract => 
          contract.status === "For Accounting Review"
        );
        setAccountingContracts(forAccountingReview);
        
        // Filter for active contracts
        const activeContracts = allContracts.filter(contract => 
          contract.status === "Active"
        );
        setActiveContracts(activeContracts);
      }
    } catch (err) {
      console.error("Fetch contracts error:", err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch("http://localhost:5000/finance/invoices");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error("Fetch invoices error:", err);
    }
  };

  const approveContract = async (contractId) => {
    try {
      const res = await fetch(`http://localhost:5000/contracts/${contractId}/accounting-approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        setMessage("Contract approved and marked as Active");
        setTimeout(() => setMessage(""), 3000);
        fetchContracts(); // Refresh the contracts list
        setSelectedContract(null);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to approve contract");
      }
    } catch (err) {
      console.error("Approve contract error:", err);
      alert("Failed to approve contract");
    }
  };

  const rejectContract = async (contractId, reason) => {
    try {
      const res = await fetch(`http://localhost:5000/contracts/${contractId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      });

      if (res.ok) {
        setMessage("Contract rejected");
        setTimeout(() => setMessage(""), 3000);
        fetchContracts(); // Refresh the contracts list
        setSelectedContract(null);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to reject contract");
      }
    } catch (err) {
      console.error("Reject contract error:", err);
      alert("Failed to reject contract");
    }
  };

  const generateInvoice = async (contract) => {
    try {
      const res = await fetch("http://localhost:5000/finance/invoices/generate-number");
      if (res.ok) {
        const data = await res.json();
        
        const invoiceData = {
          contractId: contract._id,
          invoiceNumber: data.invoiceNumber,
          contractNumber: contract.contractNumber,
          client: contract.page1?.celebratorName || "Unknown Client",
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          items: [
            {
              description: `Event Contract - ${contract.page1?.occasion || 'Contract'}`,
              quantity: 1,
              unitPrice: contract.page3?.grandTotal || 0,
              amount: contract.page3?.grandTotal || 0
            }
          ],
          totalAmount: contract.page3?.grandTotal || 0,
          status: "pending"
        };
        
        setNewInvoice(invoiceData);
        setSelectedContract(contract);
        setShowInvoiceModal(true);
      }
    } catch (err) {
      console.error("Generate invoice error:", err);
      alert("Failed to generate invoice number");
    }
  };

  const createInvoice = async () => {
    try {
      const res = await fetch("http://localhost:5000/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvoice)
      });

      if (res.ok) {
        setShowInvoiceModal(false);
        fetchInvoices();
        fetchContracts(); // Refresh contracts list
        setMessage("Invoice created successfully");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Create invoice error:", err);
    }
  };

  const markAsPaid = async (invoiceId) => {
    try {
      const res = await fetch(`http://localhost:5000/finance/invoices/${invoiceId}/mark-paid`, {
        method: "PUT"
      });

      if (res.ok) {
        fetchInvoices();
        setMessage("Invoice marked as paid");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Mark as paid error:", err);
    }
  };

  // Financial statistics calculation
  const calculateFinancialStats = () => {
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    
    const pendingRevenue = invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    return {
      totalRevenue,
      pendingRevenue,
      paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
      unpaidInvoices: invoices.filter(inv => inv.status === 'pending').length,
      overdueInvoices: invoices.filter(inv => 
        inv.status === 'pending' && new Date(inv.dueDate) < new Date()
      ).length,
      contractsForReview: accountingContracts.length,
      activeContractsCount: activeContracts.length
    };
  };

  const stats = calculateFinancialStats();

  // Render Dashboard View
  const renderDashboardView = () => {
    return (
      <div className="dashboard-view">
        {message && <div className="message success">{message}</div>}

        {/* Financial Overview Cards */}
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <div className="card-icon"></div>
            <div className="card-content">
              <div className="card-value">₱{stats.totalRevenue.toLocaleString()}</div>
              <div className="card-label">Total Revenue</div>
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="card-icon"></div>
            <div className="card-content">
              <div className="card-value">₱{stats.pendingRevenue.toLocaleString()}</div>
              <div className="card-label">Pending Revenue</div>
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="card-icon"></div>
            <div className="card-content">
              <div className="card-value">{stats.contractsForReview}</div>
              <div className="card-label">For Review</div>
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="card-icon"></div>
            <div className="card-content">
              <div className="card-value">{stats.activeContractsCount}</div>
              <div className="card-label">Active Contracts</div>
            </div>
          </div>
        </div>


        {/* Recent Contracts Needing Review */}
        {accountingContracts.length > 0 && (
          <div className="section-container">
            <div className="section-header">
              <h3>Contracts Needing Accounting Review</h3>
              <button 
                className="text-link"
                onClick={() => setActiveView("accounting-review")}
              >
                View All →
              </button>
            </div>
            <div className="contracts-table">
              <table>
                <thead>
                  <tr>
                    <th>Contract Name</th>
                    <th>Client</th>
                    <th>Value</th>
                    <th>Event Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accountingContracts.slice(0, 5).map(contract => (
                    <tr key={contract._id}>
                      <td>{contract.page1?.occasion || contract.page1?.contractName || 'Contract'}</td>
                      <td>{contract.page1?.celebratorName || 'N/A'}</td>
                      <td>₱{(contract.page3?.grandTotal || 0).toLocaleString()}</td>
                      <td>{contract.page1?.eventDate || 'N/A'}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-primary small"
                            onClick={() => setSelectedContract(contract)}
                          >
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Active Contracts */}
        {activeContracts.length > 0 && (
          <div className="section-container">
            <div className="section-header">
              <h3>Recent Active Contracts</h3>
              <button 
                className="text-link"
                onClick={() => setActiveView("active-contracts")}
              >
                View All →
              </button>
            </div>
            <div className="contracts-table">
              <table>
                <thead>
                  <tr>
                    <th>Contract Name</th>
                    <th>Client</th>
                    <th>Value</th>
                    <th>Event Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeContracts.slice(0, 5).map(contract => (
                    <tr key={contract._id}>
                      <td>{contract.page1?.occasion || contract.page1?.contractName || 'Contract'}</td>
                      <td>{contract.page1?.celebratorName || 'N/A'}</td>
                      <td>₱{(contract.page3?.grandTotal || 0).toLocaleString()}</td>
                      <td>{contract.page1?.eventDate || 'N/A'}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-primary small"
                            onClick={() => setSelectedContract(contract)}
                          >
                            View
                          </button>
                          <button 
                            className="btn-success small"
                            onClick={() => generateInvoice(contract)}
                          >
                            Create Invoice
                          </button>
                        </div>
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

  // Render Accounting Review Contracts View
  const renderAccountingReviewView = () => {
    return (
      <div className="department-view">
        <div className="view-header">
          <h2>Contracts For Accounting Review</h2>
          <button className="back-btn" onClick={() => setActiveView("dashboard")}>
            ← Back to Dashboard
          </button>
        </div>

        {message && <div className="message success">{message}</div>}

        <div className="contracts-table-container">
          <div className="table-header">
            <h3>Contracts For Accounting Review ({accountingContracts.length})</h3>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accountingContracts.length === 0 ? (
                  <tr className="no-contracts">
                    <td colSpan="6">No contracts pending accounting review</td>
                  </tr>
                ) : (
                  accountingContracts.map(contract => (
                    <tr key={contract._id}>
                      <td className="clickable-cell" onClick={() => setSelectedContract(contract)}>
                        {contract.page1?.occasion || contract.page1?.contractName || 'Contract'}
                      </td>
                      <td className="clickable-cell" onClick={() => setSelectedContract(contract)}>
                        {contract.page1?.celebratorName || 'N/A'}
                      </td>
                      <td className="clickable-cell" onClick={() => setSelectedContract(contract)}>
                        {contract.contractNumber || "-"}
                      </td>
                      <td className="clickable-cell" onClick={() => setSelectedContract(contract)}>
                        ₱{(contract.page3?.grandTotal || 0).toLocaleString()}
                      </td>
                      <td className="clickable-cell" onClick={() => setSelectedContract(contract)}>
                        {contract.page1?.eventDate || 'N/A'}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-primary small"
                            onClick={() => setSelectedContract(contract)}
                          >
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render Active Contracts View
  const renderActiveContractsView = () => {
    return (
      <div className="department-view">
        <div className="view-header">
          <h2>Active Contracts</h2>
          <button className="back-btn" onClick={() => setActiveView("dashboard")}>
            ← Back to Dashboard
          </button>
        </div>

        {message && <div className="message success">{message}</div>}

        <div className="contracts-table-container">
          <div className="table-header">
            <h3>Active Contracts ({activeContracts.length})</h3>
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
                {activeContracts.length === 0 ? (
                  <tr className="no-contracts">
                    <td colSpan="7">No active contracts found</td>
                  </tr>
                ) : (
                  activeContracts.map(contract => (
                    <tr key={contract._id}>
                      <td className="clickable-cell" onClick={() => setSelectedContract(contract)}>
                        {contract.page1?.occasion || contract.page1?.contractName || 'Contract'}
                      </td>
                      <td className="clickable-cell" onClick={() => setSelectedContract(contract)}>
                        {contract.page1?.celebratorName || 'N/A'}
                      </td>
                      <td className="clickable-cell" onClick={() => setSelectedContract(contract)}>
                        {contract.contractNumber || "-"}
                      </td>
                      <td className="clickable-cell" onClick={() => setSelectedContract(contract)}>
                        ₱{(contract.page3?.grandTotal || 0).toLocaleString()}
                      </td>
                      <td className="clickable-cell" onClick={() => setSelectedContract(contract)}>
                        {contract.page1?.eventDate || 'N/A'}
                      </td>
                      <td>
                        <span className="status active">{contract.status}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-primary small"
                            onClick={() => setSelectedContract(contract)}
                          >
                            View
                          </button>
                          <button
                            className="btn-success small"
                            onClick={() => generateInvoice(contract)}
                          >
                            Create Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render Invoices View
  const renderInvoicesView = () => {
    return (
      <div className="department-view">
        <div className="view-header">
          <h2>Invoice Management</h2>
          <button className="back-btn" onClick={() => setActiveView("dashboard")}>
            ← Back to Dashboard
          </button>
        </div>

        {message && <div className="message success">{message}</div>}

        <div className="invoices-table-container">
          <div className="table-header">
            <h3>All Invoices ({invoices.length})</h3>
          </div>
          
          <div className="invoices-table">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Contract #</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="8">No invoices found</td>
                  </tr>
                ) : (
                  invoices.map(invoice => (
                    <tr key={invoice._id}>
                      <td>{invoice.invoiceNumber}</td>
                      <td>{invoice.contractNumber}</td>
                      <td>{invoice.client}</td>
                      <td>₱{(invoice.totalAmount || 0).toLocaleString()}</td>
                      <td>{new Date(invoice.issueDate).toLocaleDateString()}</td>
                      <td className={new Date(invoice.dueDate) < new Date() && invoice.status === 'pending' ? 'overdue' : ''}>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`status ${invoice.status}`}>
                          {invoice.status}
                          {new Date(invoice.dueDate) < new Date() && invoice.status === 'pending' && ' (Overdue)'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-primary small">View</button>
                          {invoice.status === 'pending' && (
                            <button 
                              className="btn-success small"
                              onClick={() => markAsPaid(invoice._id)}
                            >
                              Mark Paid
                            </button>
                          )}
                          <button className="btn-secondary small">Download</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render Contract Details Modal
  const renderContractModal = () => (
    selectedContract && (
      <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
        <div className="modal large-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Contract Details - {selectedContract.contractNumber}</h3>
            <button className="close-btn" onClick={() => setSelectedContract(null)}>×</button>
          </div>
          
          <div className="modal-body">
            <div className="contract-details">
              <div className="detail-section">
                <h4>Contract Information</h4>
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
                  <strong>Event:</strong> {selectedContract.page1?.occasion || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Event Date:</strong> {selectedContract.page1?.eventDate || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Venue:</strong> {selectedContract.page1?.venue || "N/A"}
                </div>
                <div className="detail-row">
                  <strong>Total Guests:</strong> {selectedContract.page1?.totalGuests || "N/A"}
                </div>
              </div>

              <div className="detail-section">
                <h4>Financial Details</h4>
                <div className="detail-row">
                  <strong>Contract Value:</strong> ₱{(selectedContract.page3?.grandTotal || 0).toLocaleString()}
                </div>
                {selectedContract.page3 && Object.entries(selectedContract.page3).map(([key, value]) => (
                  key !== 'grandTotal' && value && (
                    <div key={key} className="detail-row">
                      <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {value}
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            {selectedContract.status === "For Accounting Review" && (
              <div className="approval-actions">
                <button 
                  className="btn-approve"
                  onClick={() => approveContract(selectedContract._id)}
                >
                  Approve & Activate Contract
                </button>
                <button 
                  className="btn-reject"
                  onClick={() => {
                    const reason = prompt("Please enter reason for rejection:");
                    if (reason) {
                      rejectContract(selectedContract._id, reason);
                    }
                  }}
                >
                  Reject Contract
                </button>
              </div>
            )}
            {(selectedContract.status === "Active" || selectedContract.status === "For Accounting Review") && (
              <button 
                className="btn-success"
                onClick={() => generateInvoice(selectedContract)}
              >
                Create Invoice
              </button>
            )}
            <button className="btn-secondary" onClick={() => setSelectedContract(null)}>
              Close
            </button>
          </div>
        </div>
      </div>
    )
  );

  // Render Invoice Generation Modal (same as before)
  const renderInvoiceModal = () => (
    showInvoiceModal && newInvoice && (
      <div className="modal-overlay">
        <div className="modal">
          <h3>Generate Invoice</h3>
          <div className="invoice-preview">
            {/* ... invoice modal content same as before ... */}
          </div>
          <div className="modal-actions">
            <button className="btn-primary" onClick={createInvoice}>
              Create Invoice
            </button>
            <button className="btn-secondary" onClick={() => setShowInvoiceModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="department-dashboard">
      {/* Left Sidebar */}
      <div className="dashboard-sidebar">
        <div className="accreditation-header">
          <h1>FINANCE</h1>
          <h2>Dashboard</h2>
        </div>
        
        <div className="header-nav">
          <div className="nav-section">
            <div className="section-title">NAVIGATION</div>
            <button 
              className={`nav-btn ${activeView === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveView("dashboard")}
            >
              Dashboard
            </button>
            <button 
              className={`nav-btn ${activeView === "accounting-review" ? "active" : ""}`}
              onClick={() => setActiveView("accounting-review")}
            >
              For Review ({accountingContracts.length})
            </button>
            <button 
              className={`nav-btn ${activeView === "active-contracts" ? "active" : ""}`}
              onClick={() => setActiveView("active-contracts")}
            >
              Active Contracts ({activeContracts.length})
            </button>
            <button 
              className={`nav-btn ${activeView === "invoices" ? "active" : ""}`}
              onClick={() => setActiveView("invoices")}
            >
              Invoices
            </button>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeView === "dashboard" && renderDashboardView()}
        {activeView === "accounting-review" && renderAccountingReviewView()}
        {activeView === "active-contracts" && renderActiveContractsView()}
        {activeView === "invoices" && renderInvoicesView()}
        
        {/* Modals */}
        {renderContractModal()}
        {renderInvoiceModal()}
      </div>
    </div>
  );
}

export default FinanceDashboard;