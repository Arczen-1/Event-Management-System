import React, { useState, useEffect } from "react";
import "./DepartmentDashboard.css";

function FinanceDashboard({ onLogout, user }) {
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState(null);
  const [paymentOption, setPaymentOption] = useState("");
  const [paymentDetails, setPaymentDetails] = useState({
    downpaymentAmount: "",
    downpaymentDueDate: "",
    fullPaymentDueDate: "",
    downpaymentReceivedBy: "",
    fullPaymentReceivedBy: ""
  });
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
        setShowPaymentModal(false);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to approve contract");
      }
    } catch (err) {
      console.error("Approve contract error:", err);
      alert("Failed to approve contract");
    }
  };

  const approveWithPayment = async () => {
    if (!paymentOption) {
      alert("Please select a payment option");
      return;
    }

    try {
      const updateData = {
        paymentOption: paymentOption,
        ...paymentDetails
      };

      const res = await fetch(`http://localhost:5000/contracts/${selectedContract._id}/accounting-approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        setMessage("Contract approved with payment details");
        setTimeout(() => setMessage(""), 3000);
        fetchContracts();
        setSelectedContract(null);
        setShowPaymentModal(false);
        setPaymentOption("");
        setPaymentDetails({
          downpaymentAmount: "",
          downpaymentDueDate: "",
          fullPaymentDueDate: "",
          downpaymentReceivedBy: "",
          fullPaymentReceivedBy: ""
        });
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
        
        // Create comprehensive invoice items breakdown
        const invoiceItems = generateInvoiceBreakdown(contract);
        const totalAmount = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
        
        const invoiceData = {
          contractId: contract._id,
          invoiceNumber: data.invoiceNumber,
          contractNumber: contract.contractNumber,
          client: contract.page1?.celebratorName || "Unknown Client",
          clientEmail: contract.page1?.celebratorEmail || "",
          clientAddress: contract.page1?.celebratorAddress || "",
          clientMobile: contract.page1?.celebratorMobile || "",
          eventDate: contract.page1?.eventDate || "",
          occasion: contract.page1?.occasion || "",
          venue: contract.page1?.venue || "",
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          items: invoiceItems,
          totalAmount: totalAmount,
          status: "pending",
          breakdown: {
            menuCost: contract.page3?.totalMenuCost || 0,
            creativeCost: contract.page2?.totalCreativeRequirementCost || 0,
            specialReqCost: contract.page3?.totalSpecialReqCost || 0,
            mobilization: contract.page3?.mobilizationCharge || 0,
            taxes: contract.page3?.taxes || 0
          }
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

  // Generate comprehensive invoice breakdown
  const generateInvoiceBreakdown = (contract) => {
    const items = [];
    const p2 = contract.page2 || {};
    const p3 = contract.page3 || {};
    const pBuffet = contract.pageBuffet || {};

    // 1. Menu Costs
    if (p3.totalMenuCost && parseFloat(p3.totalMenuCost) > 0) {
      items.push({
        category: "menu",
        description: "Food & Beverage Package",
        quantity: parseInt(contract.page1?.totalGuests) || 1,
        unitPrice: parseFloat(p3.totalMenuCost) / (parseInt(contract.page1?.totalGuests) || 1),
        amount: parseFloat(p3.totalMenuCost),
        details: getMenuDetails(pBuffet, p3)
      });
    }

    // 2. Creative Requirements
    const creativeCosts = p2.creativeCosts || {};
    const totalCreativeCost = p2.totalCreativeRequirementCost || 0;
    
    if (totalCreativeCost > 0) {
      items.push({
        category: "creative",
        description: "Creative Requirements & Decor",
        quantity: 1,
        unitPrice: totalCreativeCost,
        amount: totalCreativeCost,
        details: getCreativeDetails(creativeCosts, p2)
      });
    }

    // 3. Special Requirements
    if (p3.totalSpecialReqCost && parseFloat(p3.totalSpecialReqCost) > 0) {
      items.push({
        category: "special",
        description: "Special Requirements & Equipment",
        quantity: 1,
        unitPrice: parseFloat(p3.totalSpecialReqCost),
        amount: parseFloat(p3.totalSpecialReqCost),
        details: getSpecialRequirementsDetails(p2)
      });
    }

    // 4. Mobilization Charge
    if (p3.mobilizationCharge && parseFloat(p3.mobilizationCharge) > 0) {
      items.push({
        category: "service",
        description: "Mobilization & Service Charge",
        quantity: 1,
        unitPrice: parseFloat(p3.mobilizationCharge),
        amount: parseFloat(p3.mobilizationCharge)
      });
    }

    // 5. Taxes
    if (p3.taxes && parseFloat(p3.taxes) > 0) {
      items.push({
        category: "tax",
        description: "Taxes & Government Fees",
        quantity: 1,
        unitPrice: parseFloat(p3.taxes),
        amount: parseFloat(p3.taxes)
      });
    }

    return items;
  };

  // Helper function to get menu details
  const getMenuDetails = (pBuffet, p3) => {
    const details = [];
    
    if (pBuffet.selectedPackage) {
      details.push(`Package: ${pBuffet.selectedPackage}`);
    }
    if (p3.pricePerPlate) {
      details.push(`Price per plate: ₱${parseFloat(p3.pricePerPlate).toLocaleString()}`);
    }
    if (p3.cocktailHour) {
      details.push(`Cocktail: ${p3.cocktailHour}`);
    }
    if (p3.mainEntree) {
      details.push(`Main Entree: ${p3.mainEntree}`);
    }
    
    return details;
  };

  // Helper function to get creative details
  const getCreativeDetails = (creativeCosts, p2) => {
    const details = [];
    
    Object.entries(creativeCosts).forEach(([category, cost]) => {
      if (cost > 0) {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        details.push(`${categoryName}: ₱${cost.toLocaleString()}`);
      }
    });

    // Add creative items
    const creativeFields = ['backdrop', 'flower', 'decor', 'entrance', 'staging', 'equipment', 'miscellaneous'];
    creativeFields.forEach(field => {
      if (p2[field] && p2[field].length > 0) {
        const items = Array.isArray(p2[field]) ? p2[field] : [p2[field]];
        if (items.some(item => item.trim() !== '')) {
          details.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${items.join(', ')}`);
        }
      }
    });

    return details;
  };

  // Helper function to get special requirements details
  const getSpecialRequirementsDetails = (p2) => {
    const details = [];
    
    const specialItems = {
      'emcee': 'Emcee',
      'soundSystem': 'Sound System',
      'tent': 'Tent',
      'celebratorsChair': "Celebrator's Chair",
      'celebratorsCar': "Celebrator's Car",
      'cakeSupplier': 'Cake Supplier'
    };

    Object.entries(specialItems).forEach(([field, label]) => {
      if (p2[field] && p2[field].trim() !== '') {
        details.push(`${label}: ${p2[field]}`);
      }
    });

    return details;
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
        fetchContracts();
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

  const downloadInvoice = async (invoice) => {
    try {
      const invoiceHTML = createPrintableInvoiceHTML(invoice);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.print();
    } catch (err) {
      console.error("Download invoice error:", err);
      alert("Failed to generate invoice print view");
    }
  };

  // Enhanced printable invoice HTML with full breakdown
  const createPrintableInvoiceHTML = (invoice) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .company-info {
            margin-bottom: 20px;
          }
          .invoice-details { 
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .client-info, .invoice-info {
            width: 48%;
          }
          .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
          }
          .table th, .table td { 
            border: 1px solid #ddd; 
            padding: 12px 8px; 
            text-align: left; 
          }
          .table th { 
            background-color: #f5f5f5; 
            font-weight: bold;
          }
          .category-header {
            background-color: #e8f4fd !important;
            font-weight: bold;
          }
          .item-details {
            font-size: 0.9em;
            color: #666;
            margin-top: 4px;
          }
          .total { 
            font-weight: bold; 
            font-size: 1.2em; 
            background-color: #f0f0f0;
          }
          .breakdown-section {
            margin: 30px 0;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
          }
          .breakdown-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 10px;
          }
          .breakdown-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            color: #666;
            font-size: 0.9em;
          }
          .notes {
            margin-top: 20px;
            padding: 15px;
            background-color: #fffacd;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>EVENT MANAGEMENT COMPANY</h1>
          <h2>INVOICE</h2>
          <h3>#${invoice.invoiceNumber}</h3>
        </div>
        
        <div class="invoice-details">
          <div class="client-info">
            <h4>Bill To:</h4>
            <p><strong>${invoice.client}</strong></p>
            ${invoice.clientAddress ? `<p>${invoice.clientAddress}</p>` : ''}
            ${invoice.clientMobile ? `<p>${invoice.clientMobile}</p>` : ''}
            ${invoice.clientEmail ? `<p>${invoice.clientEmail}</p>` : ''}
            ${invoice.occasion ? `<p><strong>Event:</strong> ${invoice.occasion}</p>` : ''}
            ${invoice.eventDate ? `<p><strong>Event Date:</strong> ${new Date(invoice.eventDate).toLocaleDateString()}</p>` : ''}
            ${invoice.venue ? `<p><strong>Venue:</strong> ${invoice.venue}</p>` : ''}
          </div>
          
          <div class="invoice-info">
            <h4>Invoice Details:</h4>
            <p><strong>Invoice Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p><strong>Contract #:</strong> ${invoice.contractNumber}</p>
            <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
          </div>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${generateInvoiceTableRows(invoice)}
          </tbody>
          <tfoot>
            <tr class="total">
              <td colspan="3" style="text-align: right;"><strong>Total Amount:</strong></td>
              <td><strong>₱${invoice.totalAmount.toLocaleString()}</strong></td>
            </tr>
          </tfoot>
        </table>

        ${invoice.breakdown ? `
        <div class="breakdown-section">
          <h4>Cost Breakdown Summary</h4>
          <div class="breakdown-grid">
            ${invoice.breakdown.menuCost > 0 ? `
              <div class="breakdown-item">
                <span>Food & Beverage:</span>
                <span>₱${parseFloat(invoice.breakdown.menuCost).toLocaleString()}</span>
              </div>
            ` : ''}
            ${invoice.breakdown.creativeCost > 0 ? `
              <div class="breakdown-item">
                <span>Creative Requirements:</span>
                <span>₱${parseFloat(invoice.breakdown.creativeCost).toLocaleString()}</span>
              </div>
            ` : ''}
            ${invoice.breakdown.specialReqCost > 0 ? `
              <div class="breakdown-item">
                <span>Special Requirements:</span>
                <span>₱${parseFloat(invoice.breakdown.specialReqCost).toLocaleString()}</span>
              </div>
            ` : ''}
            ${invoice.breakdown.mobilization > 0 ? `
              <div class="breakdown-item">
                <span>Service Charge:</span>
                <span>₱${parseFloat(invoice.breakdown.mobilization).toLocaleString()}</span>
              </div>
            ` : ''}
            ${invoice.breakdown.taxes > 0 ? `
              <div class="breakdown-item">
                <span>Taxes & Fees:</span>
                <span>₱${parseFloat(invoice.breakdown.taxes).toLocaleString()}</span>
              </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        <div class="notes">
          <p><strong>Payment Instructions:</strong></p>
          <p>• Please make payment before the due date to avoid late fees</p>
          <p>• Bank Transfer: Account Name: Event Management Co., Bank: BPI, Account #: 1234-5678-90</p>
          <p>• For payment confirmation, please email accounting@eventcompany.com</p>
        </div>
        
        <div class="footer">
          <p>Thank you for choosing our services!</p>
          <p>For inquiries, please contact: accounting@eventcompany.com | (02) 1234-5678</p>
        </div>
      </body>
      </html>
    `;
  };

  const generateInvoiceTableRows = (invoice) => {
    let currentCategory = '';
    let rows = '';

    invoice.items.forEach((item, index) => {
      // Add category header if category changed
      if (item.category !== currentCategory) {
        currentCategory = item.category;
        const categoryLabel = getCategoryLabel(item.category);
        rows += `
          <tr class="category-header">
            <td colspan="4"><strong>${categoryLabel}</strong></td>
          </tr>
        `;
      }

      // Add item row
      rows += `
        <tr>
          <td>
            ${item.description}
            ${item.details && item.details.length > 0 ? `
              <div class="item-details">
                ${item.details.join('<br>')}
              </div>
            ` : ''}
          </td>
          <td>${item.quantity}</td>
          <td>₱${item.unitPrice.toLocaleString()}</td>
          <td>₱${item.amount.toLocaleString()}</td>
        </tr>
      `;
    });

    return rows;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'menu': 'FOOD & BEVERAGE',
      'creative': 'CREATIVE REQUIREMENTS',
      'special': 'SPECIAL REQUIREMENTS',
      'service': 'SERVICE CHARGES',
      'tax': 'TAXES & FEES'
    };
    return labels[category] || category.toUpperCase();
  };


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

  // Render Dashboard View (same as before)
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

  // Render Accounting Review Contracts View (same as before)
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

  // Render Active Contracts View (same as before)
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

  // Enhanced Invoices View
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
                  <th>Event</th>
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
                    <td colSpan="9">No invoices found</td>
                  </tr>
                ) : (
                  invoices.map(invoice => (
                    <tr key={invoice._id}>
                      <td><strong>{invoice.invoiceNumber}</strong></td>
                      <td>{invoice.contractNumber}</td>
                      <td>{invoice.client}</td>
                      <td>{invoice.occasion || 'Event'}</td>
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
                          <button 
                            className="btn-primary small"
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            View Details
                          </button>
                          {invoice.status === 'pending' && (
                            <button 
                              className="btn-success small"
                              onClick={() => markAsPaid(invoice._id)}
                            >
                              Mark Paid
                            </button>
                          )}
                          <button 
                            className="btn-secondary small"
                            onClick={() => downloadInvoice(invoice)}
                          >
                            Download
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

  // Enhanced Invoice Details Modal with full breakdown
  const renderInvoiceModal = () => (
    selectedInvoice && (
      <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
        <div className="modal xlarge-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Invoice Details - {selectedInvoice.invoiceNumber}</h2>
            <button className="close-btn" onClick={() => setSelectedInvoice(null)}>×</button>
          </div>
          
          <div className="modal-body">
            <div className="invoice-details-container">
              {/* Client and Invoice Info */}
              <div className="invoice-header">
                <div className="client-info">
                  <h4>Bill To:</h4>
                  <p><strong>{selectedInvoice.client}</strong></p>
                  {selectedInvoice.clientAddress && <p>{selectedInvoice.clientAddress}</p>}
                  {selectedInvoice.clientMobile && <p>{selectedInvoice.clientMobile}</p>}
                  {selectedInvoice.clientEmail && <p>{selectedInvoice.clientEmail}</p>}
                </div>
                <div className="invoice-meta">
                  <p><strong>Invoice Date:</strong> {new Date(selectedInvoice.issueDate).toLocaleDateString()}</p>
                  <p><strong>Due Date:</strong> {new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                  <p><strong>Contract #:</strong> {selectedInvoice.contractNumber}</p>
                  <p><strong>Event:</strong> {selectedInvoice.occasion || 'N/A'}</p>
                  <p><strong>Event Date:</strong> {selectedInvoice.eventDate ? new Date(selectedInvoice.eventDate).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Venue:</strong> {selectedInvoice.venue || 'N/A'}</p>
                </div>
              </div>

              {/* Invoice Items Breakdown */}
              <div className="invoice-items-section">
                <h4>Invoice Breakdown</h4>
                <div className="items-table-container">
                  <table className="items-table detailed">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, index) => (
                        <React.Fragment key={index}>
                          <tr className="item-row">
                            <td className="category-cell">
                              <span className="category-badge">{getCategoryLabel(item.category)}</span>
                            </td>
                            <td className="description-cell">
                              <div>
                                <strong>{item.description}</strong>
                                {item.details && item.details.length > 0 && (
                                  <div className="item-details-list">
                                    {item.details.map((detail, idx) => (
                                      <div key={idx} className="detail-item">• {detail}</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>{item.quantity}</td>
                            <td>₱{item.unitPrice.toLocaleString()}</td>
                            <td><strong>₱{item.amount.toLocaleString()}</strong></td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="total-row">
                        <td colSpan="4" className="text-right"><strong>Total Amount:</strong></td>
                        <td><strong className="total-amount">₱{selectedInvoice.totalAmount.toLocaleString()}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Cost Breakdown Summary */}
              {selectedInvoice.breakdown && (
                <div className="breakdown-summary">
                  <h4>Cost Summary</h4>
                  <div className="breakdown-grid">
                    {selectedInvoice.breakdown.menuCost > 0 && (
                      <div className="breakdown-item">
                        <span>Food & Beverage:</span>
                        <span>₱{parseFloat(selectedInvoice.breakdown.menuCost).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedInvoice.breakdown.creativeCost > 0 && (
                      <div className="breakdown-item">
                        <span>Creative Requirements:</span>
                        <span>₱{parseFloat(selectedInvoice.breakdown.creativeCost).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedInvoice.breakdown.specialReqCost > 0 && (
                      <div className="breakdown-item">
                        <span>Special Requirements:</span>
                        <span>₱{parseFloat(selectedInvoice.breakdown.specialReqCost).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedInvoice.breakdown.mobilization > 0 && (
                      <div className="breakdown-item">
                        <span>Service Charge:</span>
                        <span>₱{parseFloat(selectedInvoice.breakdown.mobilization).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedInvoice.breakdown.taxes > 0 && (
                      <div className="breakdown-item">
                        <span>Taxes & Fees:</span>
                        <span>₱{parseFloat(selectedInvoice.breakdown.taxes).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button 
              className="btn-primary"
              onClick={() => downloadInvoice(selectedInvoice)}
            >
              Download/Print Invoice
            </button>
            {selectedInvoice.status === 'pending' && (
              <button 
                className="btn-success"
                onClick={() => {
                  markAsPaid(selectedInvoice._id);
                  setSelectedInvoice(null);
                }}
              >
                Mark as Paid
              </button>
            )}
            <button className="btn-secondary" onClick={() => setSelectedInvoice(null)}>
              Close
            </button>
          </div>
        </div>
      </div>
    )
    
  );
  // Render Contract Details Modal - UPDATED with payment option flow
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
                  onClick={() => setShowPaymentModal(true)}
                >
                  Approve Contract
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

  // NEW: Render Payment Option Modal
  const renderPaymentModal = () => (
    showPaymentModal && selectedContract && (
      <div className="modal-overlay">
        <div className="modal medium-modal">
          <div className="modal-header">
            <h3>Set Payment Terms - {selectedContract.contractNumber}</h3>
            <button className="close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
          </div>
          
          <div className="modal-body">
            <div className="payment-options">
              <h4>Select Payment Option</h4>
              
              <div className="payment-option-group">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentOption"
                    value="full"
                    checked={paymentOption === "full"}
                    onChange={(e) => setPaymentOption(e.target.value)}
                  />
                  <span className="option-label">Full Payment</span>
                </label>
                
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentOption"
                    value="downpayment"
                    checked={paymentOption === "downpayment"}
                    onChange={(e) => setPaymentOption(e.target.value)}
                  />
                  <span className="option-label">40% Downpayment</span>
                </label>
              </div>

              {paymentOption === "downpayment" && (
                <div className="payment-details">
                  <h5>Downpayment Details</h5>
                  <div className="form-group">
                    <label>Downpayment Amount (40%)</label>
                    <input
                      type="text"
                      value={paymentDetails.downpaymentAmount}
                      onChange={(e) => setPaymentDetails({
                        ...paymentDetails,
                        downpaymentAmount: e.target.value
                      })}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="form-group">
                    <label>Downpayment Due Date</label>
                    <input
                      type="date"
                      value={paymentDetails.downpaymentDueDate}
                      onChange={(e) => setPaymentDetails({
                        ...paymentDetails,
                        downpaymentDueDate: e.target.value
                      })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Full Payment Due Date</label>
                    <input
                      type="date"
                      value={paymentDetails.fullPaymentDueDate}
                      onChange={(e) => setPaymentDetails({
                        ...paymentDetails,
                        fullPaymentDueDate: e.target.value
                      })}
                    />
                  </div>
                </div>
              )}

              {paymentOption === "full" && (
                <div className="payment-details">
                  <h5>Full Payment Details</h5>
                  <div className="form-group">
                    <label>Full Payment Due Date</label>
                    <input
                      type="date"
                      value={paymentDetails.fullPaymentDueDate}
                      onChange={(e) => setPaymentDetails({
                        ...paymentDetails,
                        fullPaymentDueDate: e.target.value
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button 
              className="btn-approve"
              onClick={approveWithPayment}
              disabled={!paymentOption}
            >
              Approve with Payment Terms
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setShowPaymentModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  );

  // Render Invoice Generation Modal (same as before)
  const renderCreateInvoiceModal = () => (
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
  // ... (other modal render functions remain the same) ...

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
              Invoices ({invoices.length})
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
        {renderPaymentModal()}
        {renderInvoiceModal()}
        {renderCreateInvoiceModal()}
      </div>
    </div>
  );
}

export default FinanceDashboard;