import React, { useState, useEffect } from "react";
import "./DepartmentDashboard.css";
import logo from './logo.png'; 

function AccountingDashboard({ onLogout, user }) {
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState(null);
  const [paymentOption, setPaymentOption] = useState("");
  const [paymentDetails, setPaymentDetails] = useState({
    downpaymentAmount: "",
    downpaymentDueDate: "",
    fullPaymentDueDate: "",
    downpaymentReceivedBy: "",
    fullPaymentReceivedBy: ""
  });
  const [paymentVerification, setPaymentVerification] = useState({
    paymentMode: "",
    referenceNumber: "",
    paymentDate: new Date().toISOString().split('T')[0],
    amount: "",
    notes: "",
    proofOfPayment: null
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

  // Add these helper functions after your state declarations

// Calculate downpayment amount (40%)
// Fixed calculation functions
const calculateDownpaymentAmount = () => {
  if (!selectedContract) return 0;
  const grandTotal = parseFloat(selectedContract.page3?.grandTotal) || 0;
  return Math.round(grandTotal * 0.4 * 100) / 100; // Round to 2 decimal places
};

const calculateFinalPaymentAmount = () => {
  if (!selectedContract) return 0;
  const grandTotal = parseFloat(selectedContract.page3?.grandTotal) || 0;
  const downpayment = calculateDownpaymentAmount();
  return Math.round((grandTotal - downpayment) * 100) / 100;
};

const calculateDownpaymentDueDate = () => {
  if (!selectedContract?.page1?.eventDate) return '';
  
  // Parse the date more carefully
  const eventDate = new Date(selectedContract.page1.eventDate);
  
  // Check if date is valid
  if (isNaN(eventDate.getTime())) {
    console.error('Invalid event date:', selectedContract.page1.eventDate);
    return '';
  }
  
  const dueDate = new Date(eventDate);
  dueDate.setMonth(dueDate.getMonth() - 1);
  return dueDate.toISOString().split('T')[0];
};

const calculateFinalPaymentDueDate = () => {
  if (!selectedContract?.page1?.eventDate) return '';
  return selectedContract.page1.eventDate;
};

const approveWithPayment = async () => {
  if (!paymentOption) {
    alert("Please select a payment option");
    return;
  }

  try {
    const grandTotal = parseFloat(selectedContract.page3?.grandTotal) || 0;

    const paymentSchedule = {
      paymentOption,
      grandTotal,
    };

    // Set payment schedule based on selected option
    if (paymentOption === "downpayment") {
      paymentSchedule.downpaymentAmount = calculateDownpaymentAmount();
      paymentSchedule.downpaymentDueDate = calculateDownpaymentDueDate();
      paymentSchedule.finalPaymentAmount = calculateFinalPaymentAmount();
      paymentSchedule.finalPaymentDueDate = calculateFinalPaymentDueDate();
    } else {
      paymentSchedule.fullPaymentAmount = grandTotal;
      paymentSchedule.fullPaymentDueDate = calculateFinalPaymentDueDate();
    }

    // If contract is already Active, just update payment terms
    // If contract is For Accounting Review, approve it and set payment terms
    const updateData = selectedContract.status === "Active" 
      ? { paymentSchedule } // Just update payment terms for active contracts
      : { 
          paymentSchedule, 
          status: "Active" // Approve and set payment terms for review contracts
        };

    const res = await fetch(
      `http://localhost:5000/contracts/${selectedContract._id}/accounting-approve`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      }
    );

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || "Failed to save payment terms");
      return;
    }

    const updatedContract = await res.json();

    // Update local state
    setSelectedContract(updatedContract);

    // If contract was just approved (not already active), generate invoice
    if (selectedContract.status === "For Accounting Review") {
      await generateInvoice(updatedContract);
      setMessage("Contract approved with payment terms and invoice generated");
    } else {
      setMessage("Payment terms updated successfully");
    }

    setTimeout(() => setMessage(""), 3000);

    // Refresh contracts list
    await fetchContracts();
    
    // Close the payment modal
    setShowPaymentModal(false);
    setPaymentOption("");
  } catch (err) {
    console.error("Approve contract error:", err);
    alert("Failed to process payment terms");
  }
};


// NEW FUNCTION: Auto-generate invoice after approval
const generateInvoiceAfterApproval = async (contract) => {
  try {
    const res = await fetch("http://localhost:5000/finance/invoices/generate-number");
    if (res.ok) {
      const data = await res.json();
      
      const paymentSchedule = contract.paymentSchedule;
      let invoiceType = paymentSchedule.paymentOption;
      let dueDate = '';
      let totalAmount = 0;

      // Determine invoice type and amounts
      if (invoiceType === 'downpayment') {
        invoiceType = 'downpayment';
        dueDate = paymentSchedule.downpaymentDueDate;
        totalAmount = paymentSchedule.downpaymentAmount;
      } else {
        invoiceType = 'full';
        dueDate = paymentSchedule.fullPaymentDueDate;
        totalAmount = paymentSchedule.fullPaymentAmount;
      }

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
        dueDate: dueDate,
        items: generateInvoiceBreakdown(contract),
        totalAmount: totalAmount,
        status: "pending",
        invoiceType: invoiceType,
        paymentSchedule: paymentSchedule,
        breakdown: {
          menuCost: parseFloat(contract.page3?.totalMenuCost) || 0,
          creativeCost: parseFloat(contract.page2?.totalCreativeRequirementCost) || 0,
          specialReqCost: parseFloat(contract.page3?.totalSpecialReqCost) || 0,
          mobilization: parseFloat(contract.page3?.mobilizationCharge) || 0,
          taxes: parseFloat(contract.page3?.taxes) || 0
        }
      };

      // Create the invoice automatically
      const invoiceRes = await fetch("http://localhost:5000/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData)
      });

      if (invoiceRes.ok) {
        console.log("Invoice auto-generated successfully");
        await fetchInvoices(); // Refresh invoices list
      } else {
        console.error("Failed to auto-generate invoice");
      }
    }
  } catch (err) {
    console.error("Auto-generate invoice error:", err);
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
  console.log("Generating invoice for contract:", contract);
  
  try {
    const res = await fetch("http://localhost:5000/finance/invoices/generate-number");
    if (res.ok) {
      const data = await res.json();
      
      const paymentSchedule = contract.paymentSchedule;
      let invoiceType = paymentSchedule.paymentOption;
      let dueDate = '';
      let totalAmount = 0;

      console.log("Payment schedule:", paymentSchedule);

      // Determine invoice type and amounts
      if (invoiceType === 'downpayment') {
        // Check if downpayment invoice already exists
        const existingDownpaymentInvoice = invoices.find(inv => 
          inv.contractId === contract._id && inv.invoiceType === 'downpayment'
        );
        
        if (existingDownpaymentInvoice) {
          // Generate final payment invoice
          invoiceType = 'final';
          dueDate = paymentSchedule.finalPaymentDueDate || calculateFinalPaymentDueDate();
          totalAmount = paymentSchedule.finalPaymentAmount || calculateFinalPaymentAmount();
        } else {
          // Generate downpayment invoice
          dueDate = paymentSchedule.downpaymentDueDate || calculateDownpaymentDueDate();
          totalAmount = paymentSchedule.downpaymentAmount || calculateDownpaymentAmount();
        }
      } else {
        // Full payment invoice
        dueDate = paymentSchedule.fullPaymentDueDate || calculateFinalPaymentDueDate();
        totalAmount = paymentSchedule.fullPaymentAmount || parseFloat(contract.page3?.grandTotal) || 0;
      }

      // Validate the amounts
      if (!totalAmount || totalAmount <= 0) {
        alert("Invalid payment amount calculated. Please check the contract details.");
        return;
      }

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
        dueDate: dueDate,
        items: generateInvoiceBreakdown(contract, invoiceType),
        totalAmount: totalAmount,
        status: "pending",
        invoiceType: invoiceType,
        paymentSchedule: paymentSchedule,
        breakdown: {
          menuCost: parseFloat(contract.page3?.totalMenuCost) || 0,
          creativeCost: parseFloat(contract.page2?.totalCreativeRequirementCost) || 0,
          specialReqCost: parseFloat(contract.page3?.totalSpecialReqCost) || 0,
          mobilization: parseFloat(contract.page3?.mobilizationCharge) || 0,
          taxes: parseFloat(contract.page3?.taxes) || 0
        }
      };

      console.log("Invoice data to be created:", invoiceData);
      
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
      body: JSON.stringify(newInvoice),
    });

    if (res.ok) {
      const savedInvoice = await res.json();

      // If this contract was still under Accounting Review,
      // NOW mark it Active AFTER the invoice is successfully created
      if (
        selectedContract &&
        selectedContract.status === "For Accounting Review"
      ) {
        await approveContract(selectedContract._id);
      }

      setShowInvoiceModal(false);
      await fetchInvoices();
      await fetchContracts();

      setMessage("Invoice created successfully");
      setTimeout(() => setMessage(""), 3000);
    } else {
      const data = await res.json();
      alert(data.message || "Failed to create invoice");
    }
  } catch (err) {
    console.error("Create invoice error:", err);
    alert("Failed to create invoice");
  }
};


  // Payment Verification Functions
  const openPaymentVerification = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentVerification({
      paymentMode: "",
      referenceNumber: "",
      paymentDate: new Date().toISOString().split('T')[0],
      amount: invoice.totalAmount || "",
      notes: "",
      proofOfPayment: null
    });
    setShowPaymentDetailsModal(true);
  };

  const handlePaymentModeChange = (e) => {
    setPaymentVerification({
      ...paymentVerification,
      paymentMode: e.target.value
    });
  };

  const handleReferenceNumberChange = (e) => {
    setPaymentVerification({
      ...paymentVerification,
      referenceNumber: e.target.value
    });
  };

  const handlePaymentDateChange = (e) => {
    setPaymentVerification({
      ...paymentVerification,
      paymentDate: e.target.value
    });
  };

  const handleAmountChange = (e) => {
    setPaymentVerification({
      ...paymentVerification,
      amount: e.target.value
    });
  };

  const handleNotesChange = (e) => {
    setPaymentVerification({
      ...paymentVerification,
      notes: e.target.value
    });
  };

 const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid file (JPEG, PNG, JPG, or PDF)");
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setPaymentVerification({
      ...paymentVerification,
      proofOfPayment: file
    });
  }
};

const markAsPaid = async () => {
  if (!paymentVerification.paymentMode) {
    alert("Please select payment mode");
    return;
  }

  if (!paymentVerification.referenceNumber) {
    alert("Please enter reference number");
    return;
  }

  if (!paymentVerification.proofOfPayment) {
    alert("Please upload proof of payment");
    return;
  }

  try {
    // Create FormData to handle file upload
    const formData = new FormData();
    formData.append('paymentMode', paymentVerification.paymentMode);
    formData.append('referenceNumber', paymentVerification.referenceNumber);
    formData.append('paymentDate', paymentVerification.paymentDate);
    formData.append('amount', paymentVerification.amount);
    formData.append('notes', paymentVerification.notes);
    formData.append('verifiedBy', user?.name || 'Finance User');
    
    // Append the file - this is the key part that was missing proper handling
    formData.append('proofOfPayment', paymentVerification.proofOfPayment);

    const res = await fetch(`http://localhost:5000/finance/invoices/${selectedInvoice._id}/mark-paid`, {
      method: "PUT",
      body: formData
      // Note: Don't set Content-Type header when using FormData
      // The browser will set it automatically with the correct boundary
    });

    if (res.ok) {
      setMessage("Invoice marked as paid successfully");
      setTimeout(() => setMessage(""), 3000);
      fetchInvoices();
      setShowPaymentDetailsModal(false);
      setSelectedInvoice(null);
      
      // Reset payment verification state
      setPaymentVerification({
        paymentMode: "",
        referenceNumber: "",
        paymentDate: new Date().toISOString().split('T')[0],
        amount: "",
        notes: "",
        proofOfPayment: null
      });
    } else {
      const data = await res.json();
      alert(data.message || "Failed to mark invoice as paid");
    }
  } catch (err) {
    console.error("Mark as paid error:", err);
    alert("Failed to mark invoice as paid");
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
        <img src=./logo.png alt="Logo" className="logo" />
          <h1>JUAN CARLOS THE CATERER</h1>
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

        ${invoice.invoiceType === 'downpayment' ? `
          <div class="payment-terms">
            <h4>Payment Terms</h4>
            <p><strong>This invoice is for 40% downpayment</strong></p>
            <p>Total Contract Value: ₱${(invoice.paymentSchedule?.grandTotal || 0).toLocaleString()}</p>
            <p>Downpayment (40%): ₱${(invoice.totalAmount || 0).toLocaleString()}</p>
            <p>Remaining Balance (60%): ₱${((invoice.paymentSchedule?.grandTotal || 0) - (invoice.totalAmount || 0)).toLocaleString()}</p>
            <p><strong>Final payment due on: ${new Date(invoice.paymentSchedule?.finalPaymentDueDate || '').toLocaleDateString()}</strong></p>
          </div>
          ` : `
          <div class="payment-terms">
            <p><strong>Full Payment Invoice</strong></p>
          </div>
`}
        
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
    // Ensure item has a category
    const itemCategory = item.category || 'other';
    
    // Add category header if category changed
    if (itemCategory !== currentCategory) {
      currentCategory = itemCategory;
      const categoryLabel = getCategoryLabel(itemCategory);
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

const deleteInvoice = async (invoiceId) => {
  if (!window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/finance/invoices/${invoiceId}`, {
      method: "DELETE"
    });

    if (res.ok) {
      setMessage("Invoice deleted successfully");
      setTimeout(() => setMessage(""), 3000);
      fetchInvoices();
    } else {
      const data = await res.json();
      alert(data.message || "Failed to delete invoice");
    }
  } catch (err) {
    console.error("Delete invoice error:", err);
    alert("Failed to delete invoice");
  }
};

 // Fix the getCategoryLabel function
const getCategoryLabel = (category) => {
  if (!category) return 'OTHER CHARGES';
  
  const labels = {
    'menu': 'FOOD & BEVERAGE',
    'creative': 'CREATIVE REQUIREMENTS',
    'special': 'SPECIAL REQUIREMENTS',
    'service': 'SERVICE CHARGES',
    'tax': 'TAXES & FEES',
    'equipment': 'EQUIPMENT RENTAL',
    'venue': 'VENUE SERVICES'
  };
  
  return labels[category] || category.toUpperCase();
};

// Also update the generateInvoiceBreakdown function to ensure all items have categories
const generateInvoiceBreakdown = (contract) => {
  const items = [];
  const p1 = contract.page1 || {};
  const p2 = contract.page2 || {};
  const p3 = contract.page3 || {};
  const pBuffet = contract.pageBuffet || {};

  // 1. FOOD & BEVERAGE - Detailed breakdown
  if (p3.totalMenuCost && parseFloat(p3.totalMenuCost) > 0) {
    // Main food package
    items.push({
      category: "menu",
      description: "Food & Beverage Package",
      quantity: parseInt(p1.totalGuests) || 1,
      unitPrice: parseFloat(p3.pricePerPlate) || 0,
      amount: parseFloat(p3.totalMenuCost),
      details: [
        `Package: ${pBuffet.selectedPackage || 'Standard Package'}`,
        `Number of Guests: ${p1.totalGuests || 0}`,
        `Price per plate: ₱${parseFloat(p3.pricePerPlate || 0).toLocaleString()}`,
        p3.cocktailHour ? `Cocktail Hour: ${p3.cocktailHour}` : null,
        p3.mainEntree ? `Main Entree: ${p3.mainEntree}` : null
      ].filter(Boolean)
    });

    // Additional food items
    if (p3.foodStations && parseFloat(p3.foodStations) > 0) {
      items.push({
        category: "menu",
        description: "Additional Food Stations",
        quantity: 1,
        unitPrice: parseFloat(p3.foodStations),
        amount: parseFloat(p3.foodStations)
      });
    }
  }

  // 2. CREATIVE REQUIREMENTS - Individual creative items
  const creativeCosts = p2.creativeCosts || {};
  
  // Backdrop
  if (creativeCosts.backdrop && creativeCosts.backdrop > 0) {
    items.push({
      category: "creative",
      description: "Backdrop Design & Setup",
      quantity: 1,
      unitPrice: creativeCosts.backdrop,
      amount: creativeCosts.backdrop,
      details: p2.backdrop ? [`Design: ${Array.isArray(p2.backdrop) ? p2.backdrop.join(', ') : p2.backdrop}`] : []
    });
  }

  // Floral Arrangements
  if (creativeCosts.flower && creativeCosts.flower > 0) {
    items.push({
      category: "creative",
      description: "Floral Arrangements & Centerpieces",
      quantity: 1,
      unitPrice: creativeCosts.flower,
      amount: creativeCosts.flower,
      details: p2.flower ? [`Arrangements: ${Array.isArray(p2.flower) ? p2.flower.join(', ') : p2.flower}`] : []
    });
  }

  // Decorations
  if (creativeCosts.decor && creativeCosts.decor > 0) {
    items.push({
      category: "creative",
      description: "Venue Decorations",
      quantity: 1,
      unitPrice: creativeCosts.decor,
      amount: creativeCosts.decor,
      details: p2.decor ? [`Items: ${Array.isArray(p2.decor) ? p2.decor.join(', ') : p2.decor}`] : []
    });
  }

  // Entrance Design
  if (creativeCosts.entrance && creativeCosts.entrance > 0) {
    items.push({
      category: "creative",
      description: "Entrance & Welcome Setup",
      quantity: 1,
      unitPrice: creativeCosts.entrance,
      amount: creativeCosts.entrance,
      details: p2.entrance ? [`Setup: ${Array.isArray(p2.entrance) ? p2.entrance.join(', ') : p2.entrance}`] : []
    });
  }

  // Stage Design
  if (creativeCosts.staging && creativeCosts.staging > 0) {
    items.push({
      category: "creative",
      description: "Stage Design & Setup",
      quantity: 1,
      unitPrice: creativeCosts.staging,
      amount: creativeCosts.staging,
      details: p2.staging ? [`Design: ${Array.isArray(p2.staging) ? p2.staging.join(', ') : p2.staging}`] : []
    });
  }

  // Equipment Rental
  if (creativeCosts.equipment && creativeCosts.equipment > 0) {
    items.push({
      category: "creative",
      description: "Audio/Visual Equipment Rental",
      quantity: 1,
      unitPrice: creativeCosts.equipment,
      amount: creativeCosts.equipment,
      details: p2.equipment ? [`Equipment: ${Array.isArray(p2.equipment) ? p2.equipment.join(', ') : p2.equipment}`] : []
    });
  }

  // Miscellaneous Creative
  if (creativeCosts.miscellaneous && creativeCosts.miscellaneous > 0) {
    items.push({
      category: "creative",
      description: "Miscellaneous Creative Items",
      quantity: 1,
      unitPrice: creativeCosts.miscellaneous,
      amount: creativeCosts.miscellaneous,
      details: p2.miscellaneous ? [`Items: ${Array.isArray(p2.miscellaneous) ? p2.miscellaneous.join(', ') : p2.miscellaneous}`] : []
    });
  }

  // 3. SPECIAL REQUIREMENTS
  if (p2.emcee && p2.emcee.trim() !== '') {
    items.push({
      category: "special",
      description: "Professional Emcee Services",
      quantity: 1,
      unitPrice: 5000,
      amount: 5000,
      details: [`Emcee: ${p2.emcee}`]
    });
  }

  if (p2.soundSystem && p2.soundSystem.trim() !== '') {
    items.push({
      category: "special",
      description: "Sound System & Audio Equipment",
      quantity: 1,
      unitPrice: 3000,
      amount: 3000,
      details: [`Specifications: ${p2.soundSystem}`]
    });
  }

  if (p2.tent && p2.tent.trim() !== '') {
    items.push({
      category: "special",
      description: "Tent Rental & Setup",
      quantity: 1,
      unitPrice: 8000,
      amount: 8000,
      details: [`Tent Type: ${p2.tent}`]
    });
  }

  if (p2.celebratorsChair && p2.celebratorsChair.trim() !== '') {
    items.push({
      category: "special",
      description: "Special Chair for Celebrator",
      quantity: 1,
      unitPrice: 2000,
      amount: 2000,
      details: [`Chair Type: ${p2.celebratorsChair}`]
    });
  }

  if (p2.celebratorsCar && p2.celebratorsCar.trim() !== '') {
    items.push({
      category: "special",
      description: "Celebrator's Car Service",
      quantity: 1,
      unitPrice: 5000,
      amount: 5000,
      details: [`Car Type: ${p2.celebratorsCar}`]
    });
  }

  if (p2.cakeSupplier && p2.cakeSupplier.trim() !== '') {
    items.push({
      category: "special",
      description: "Custom Cake Service",
      quantity: 1,
      unitPrice: 4000,
      amount: 4000,
      details: [`Supplier: ${p2.cakeSupplier}`]
    });
  }

  // 4. TABLES & CHAIRS
  const vipTables = parseInt(p1.vipTableQuantity) || 0;
  const regularTables = parseInt(p1.regularTableQuantity) || 0;
  
  if (vipTables > 0) {
    items.push({
      category: "equipment",
      description: `VIP Tables Setup (${p1.vipTableType || 'Standard'})`,
      quantity: vipTables,
      unitPrice: 800,
      amount: vipTables * 800,
      details: [
        `Chair Type: ${p1.vipChairs || 'Standard'}`,
        `Tables: ${vipTables}`,
        `Guests per table: ${p1.vipTableGuests || 8}`
      ]
    });
  }

  if (regularTables > 0) {
    items.push({
      category: "equipment",
      description: `Regular Tables Setup (${p1.regularTableType || 'Standard'})`,
      quantity: regularTables,
      unitPrice: 500,
      amount: regularTables * 500,
      details: [
        `Chair Type: ${p1.regularChairs || 'Standard'}`,
        `Tables: ${regularTables}`,
        `Guests per table: ${p1.regularTableGuests || 10}`
      ]
    });
  }

  // 5. SERVICE CHARGES
  if (p3.mobilizationCharge && parseFloat(p3.mobilizationCharge) > 0) {
    items.push({
      category: "service",
      description: "Professional Service & Mobilization Fee",
      quantity: 1,
      unitPrice: parseFloat(p3.mobilizationCharge),
      amount: parseFloat(p3.mobilizationCharge),
      details: ["Includes setup, coordination, and professional staffing"]
    });
  }

  // 6. TAXES & GOVERNMENT FEES
  if (p3.taxes && parseFloat(p3.taxes) > 0) {
    items.push({
      category: "tax",
      description: "Taxes & Government Fees",
      quantity: 1,
      unitPrice: parseFloat(p3.taxes),
      amount: parseFloat(p3.taxes),
      details: ["VAT and other applicable government charges"]
    });
  }

  // 7. VENUE-RELATED ITEMS
  if (p1.venue && p1.venue.trim() !== '' && p1.venue !== 'TBD') {
    items.push({
      category: "venue",
      description: "Venue Coordination & Setup",
      quantity: 1,
      unitPrice: 3000,
      amount: 3000,
      details: [`Venue: ${p1.venue}`]
    });
  }

  return items;
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
                            className="btn-primary small"
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
                <th>Payment Terms</th>
                <th>Invoice Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeContracts.length === 0 ? (
                <tr className="no-contracts">
                  <td colSpan="8">No active contracts found</td>
                </tr>
              ) : (
                activeContracts.map(contract => {
                  // Find existing invoice for this contract
                  const contractInvoice = invoices.find(inv => inv.contractId === contract._id);
                  const hasDownpaymentInvoice = invoices.some(
                    (inv) => inv.contractId === contract._id && inv.invoiceType === "downpayment"
                  );
                  const hasFinalInvoice = invoices.some(
                    (inv) =>
                      inv.contractId === contract._id &&
                      (inv.invoiceType === "final" || inv.invoiceType === "full")
                  );

                  return (
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
                        {contract.paymentSchedule ? (
                          <span className="status active">
                            {contract.paymentSchedule.paymentOption === 'downpayment' ? '40% Downpayment' : 'Full Payment'}
                          </span>
                        ) : (
                          <span className="status warning">
                            Terms Not Set
                          </span>
                        )}
                      </td>
                      <td>
                        {contractInvoice ? (
                          <span className={`status ${contractInvoice.status}`}>
                            {contractInvoice.status.toUpperCase()} - {contractInvoice.invoiceNumber}
                          </span>
                        ) : (
                          <span className="status warning">
                            No Invoice
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-primary small"
                            onClick={() => setSelectedContract(contract)}
                          >
                            View
                          </button>
                          
                          {/* SHOW PRINT BUTTON IF INVOICE EXISTS */}
                          {contractInvoice && (
                            <button
                              className="btn-primary small"
                              onClick={() => downloadInvoice(contractInvoice)}
                            >
                              Print Invoice
                            </button>
                          )}
                          
                          {/* SHOW SET PAYMENT TERMS ONLY IF NO PAYMENT SCHEDULE */}
                          {!contract.paymentSchedule && (
                            <button
                              className="btn-warning small"
                              onClick={() => {
                                setSelectedContract(contract);
                                setShowPaymentModal(true);
                              }}
                            >
                              Set Payment Terms
                            </button>
                          )}
                          
                          {/* SHOW CREATE / NEXT INVOICE BASED ON PAYMENT TERMS */}
                          {contract.paymentSchedule && (
                            <>
                              {/* Full payment: only if no invoice yet */}
                              {contract.paymentSchedule.paymentOption === "full" && !contractInvoice && (
                                <button
                                  className="btn-primary small"
                                  onClick={() => generateInvoice(contract)}
                                >
                                  Create Invoice
                                </button>
                              )}

                              {/* Downpayment: allow DP first, then Final */}
                              {contract.paymentSchedule.paymentOption === "downpayment" &&
                                (!hasDownpaymentInvoice || (hasDownpaymentInvoice && !hasFinalInvoice)) && (
                                  <button
                                    className="btn-primary small"
                                    onClick={() => generateInvoice(contract)}
                                  >
                                    {hasDownpaymentInvoice ? "Create Final Invoice" : "Create DP Invoice"}
                                  </button>
                                )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                              className="btn-primary small"
                              onClick={() => openPaymentVerification(invoice)}
                            >
                              Mark Paid
                            </button>
                          )}
                          <button 
                            className="btn-primary small"
                            onClick={() => downloadInvoice(invoice)}
                          >
                            Download
                          </button>
                          <button 
                            className="btn-primary small"
                            onClick={() => deleteInvoice(invoice._id)}
                          >
                            Delete
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
      <div className="modal xlarge-modal invoice-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invoice Details - {selectedInvoice.invoiceNumber}</h2>
          <button className="close-btn" onClick={() => setSelectedInvoice(null)}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="invoice-details-container">
            {/* Client and Invoice Info */}
            <div className="invoice-header-grid">
              <div className="client-info-section">
                <h4>Bill To:</h4>
                <div className="client-details">
                  <p className="client-name"><strong>{selectedInvoice.client || 'N/A'}</strong></p>
                  {selectedInvoice.clientAddress && <p className="client-address">{selectedInvoice.clientAddress}</p>}
                  {selectedInvoice.clientMobile && <p className="client-contact">{selectedInvoice.clientMobile}</p>}
                  {selectedInvoice.clientEmail && <p className="client-email">{selectedInvoice.clientEmail}</p>}
                </div>
              </div>
              
              <div className="invoice-meta-section">
                <h4>Invoice Details:</h4>
                <div className="invoice-meta-grid">
                  <div className="meta-item">
                    <span className="meta-label">Invoice Date:</span>
                    <span className="meta-value">{selectedInvoice.issueDate ? new Date(selectedInvoice.issueDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Due Date:</span>
                    <span className={`meta-value ${new Date(selectedInvoice.dueDate) < new Date() && selectedInvoice.status === 'pending' ? 'overdue' : ''}`}>
                      {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Contract #:</span>
                    <span className="meta-value">{selectedInvoice.contractNumber || 'N/A'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Event:</span>
                    <span className="meta-value">{selectedInvoice.occasion || 'N/A'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Event Date:</span>
                    <span className="meta-value">{selectedInvoice.eventDate ? new Date(selectedInvoice.eventDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Venue:</span>
                    <span className="meta-value">{selectedInvoice.venue || 'N/A'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Status:</span>
                    <span className={`status-badge ${selectedInvoice.status}`}>
                      {selectedInvoice.status}
                      {new Date(selectedInvoice.dueDate) < new Date() && selectedInvoice.status === 'pending' && ' (Overdue)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Items Breakdown */}
            <div className="invoice-items-section">
              <h4>Invoice Breakdown</h4>
              <div className="items-table-container">
                <table className="items-table detailed">
                  <thead>
                    <tr>
                      <th width="15%">Category</th>
                      <th width="45%">Description</th>
                      <th width="10%">Qty</th>
                      <th width="15%">Unit Price</th>
                      <th width="15%">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item, index) => {
                        const safeItem = {
                          category: item.category || 'other',
                          description: item.description || 'Item',
                          quantity: item.quantity || 1,
                          unitPrice: item.unitPrice || 0,
                          amount: item.amount || 0,
                          details: item.details || []
                        };
                        
                        return (
                          <React.Fragment key={index}>
                            {/* Category Header Row */}
                            {(index === 0 || selectedInvoice.items[index - 1].category !== safeItem.category) && (
                              <tr className="category-header-row">
                                <td colSpan="5" className="category-header">
                                  <div className="category-title">
                                    {getCategoryLabel(safeItem.category)}
                                  </div>
                                </td>
                              </tr>
                            )}
                            
                            {/* Item Row */}
                            <tr className="item-row">
                              <td className="category-cell">
                                <span className="category-badge">
                                  {getCategoryLabel(safeItem.category)}
                                </span>
                              </td>
                              <td className="description-cell">
                                <div className="item-description">
                                  <div className="item-title">{safeItem.description}</div>
                                  {safeItem.details && safeItem.details.length > 0 && (
                                    <div className="item-details-list">
                                      {safeItem.details.map((detail, idx) => (
                                        detail && (
                                          <div key={idx} className="detail-item">• {detail}</div>
                                        )
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="quantity-cell">{safeItem.quantity}</td>
                              <td className="unit-price-cell">₱{safeItem.unitPrice.toLocaleString()}</td>
                              <td className="amount-cell">
                                <strong>₱{safeItem.amount.toLocaleString()}</strong>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-items">No items found in this invoice</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td colSpan="4" className="total-label">
                        <strong>Total Amount:</strong>
                      </td>
                      <td className="total-amount">
                        <strong className="total-value">
                          ₱{(selectedInvoice.totalAmount || 0).toLocaleString()}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Cost Breakdown Summary */}
            {selectedInvoice.breakdown && (
              <div className="breakdown-summary-section">
                <h4>Cost Summary</h4>
                <div className="breakdown-grid">
                  {selectedInvoice.breakdown.menuCost > 0 && (
                    <div className="breakdown-item">
                      <span className="breakdown-label">Food & Beverage:</span>
                      <span className="breakdown-value">₱{parseFloat(selectedInvoice.breakdown.menuCost || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedInvoice.breakdown.creativeCost > 0 && (
                    <div className="breakdown-item">
                      <span className="breakdown-label">Creative Requirements:</span>
                      <span className="breakdown-value">₱{parseFloat(selectedInvoice.breakdown.creativeCost || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedInvoice.breakdown.specialReqCost > 0 && (
                    <div className="breakdown-item">
                      <span className="breakdown-label">Special Requirements:</span>
                      <span className="breakdown-value">₱{parseFloat(selectedInvoice.breakdown.specialReqCost || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedInvoice.breakdown.mobilization > 0 && (
                    <div className="breakdown-item">
                      <span className="breakdown-label">Service Charge:</span>
                      <span className="breakdown-value">₱{parseFloat(selectedInvoice.breakdown.mobilization || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedInvoice.breakdown.taxes > 0 && (
                    <div className="breakdown-item">
                      <span className="breakdown-label">Taxes & Fees:</span>
                      <span className="breakdown-value">₱{parseFloat(selectedInvoice.breakdown.taxes || 0).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Schedule */}
            {selectedContract?.page3 && (
              <div className="payment-details-section">
                <h4>Payment Schedule</h4>
                <div className="payment-schedule">
                  {selectedContract.page3.fortyPercentAmount && (
                    <div className="payment-item">
                      <div className="payment-info">
                        <span className="payment-label">Downpayment (40%)</span>
                        <span className="payment-due-date">
                          Due: {selectedContract.page3.fortyPercentDueOn || 'Upon signing'}
                        </span>
                      </div>
                      <span className="payment-amount">
                        ₱{parseFloat(selectedContract.page3.fortyPercentAmount).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedContract.page3.fullPaymentAmount && (
                    <div className="payment-item">
                      <div className="payment-info">
                        <span className="payment-label">Final Payment</span>
                        <span className="payment-due-date">
                          Due: {selectedContract.page3.fullPaymentDueOn || 'Before event'}
                        </span>
                      </div>
                      <span className="payment-amount">
                        ₱{parseFloat(selectedContract.page3.fullPaymentAmount).toLocaleString()}
                      </span>
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
              className="btn-primary"
              onClick={() => {
                markAsPaid(selectedInvoice._id);
                setSelectedInvoice(null);
              }}
            >
              Mark as Paid
            </button>
          )}
          <button 
            className="btn-primary"
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this invoice?")) {
                deleteInvoice(selectedInvoice._id);
                setSelectedInvoice(null);
              }
            }}
          >
            Delete Invoice
          </button>
          <button className="btn-primary" onClick={() => setSelectedInvoice(null)}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
);
  // Render Contract Details Modal - UPDATED with payment option flow
  // Render Contract Details Modal - FIXED workflow
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
            </div>

            <div className="detail-section">
              <h4>Payment Schedule</h4>
              {selectedContract.paymentSchedule ? (
                <div className="payment-schedule-display">
                  <div className="detail-row">
                    <strong>Payment Option:</strong> 
                    {selectedContract.paymentSchedule.paymentOption === 'downpayment' ? '40% Downpayment' : 'Full Payment'}
                  </div>
                  {selectedContract.paymentSchedule.paymentOption === 'downpayment' ? (
                    <>
                      <div className="detail-row">
                        <strong>Downpayment (40%):</strong> ₱{selectedContract.paymentSchedule.downpaymentAmount?.toLocaleString()}
                      </div>
                      <div className="detail-row">
                        <strong>Downpayment Due:</strong> {new Date(selectedContract.paymentSchedule.downpaymentDueDate).toLocaleDateString()}
                      </div>
                      <div className="detail-row">
                        <strong>Final Payment (60%):</strong> ₱{selectedContract.paymentSchedule.finalPaymentAmount?.toLocaleString()}
                      </div>
                      <div className="detail-row">
                        <strong>Final Payment Due:</strong> {new Date(selectedContract.paymentSchedule.finalPaymentDueDate).toLocaleDateString()}
                      </div>
                    </>
                  ) : (
                    <div className="detail-row">
                      <strong>Full Payment Due:</strong> {new Date(selectedContract.paymentSchedule.fullPaymentDueDate).toLocaleDateString()}
                    </div>
                  )}
                  <div className="detail-row">
                    <strong>Total Contract Value:</strong> ₱{selectedContract.paymentSchedule.grandTotal?.toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="detail-row">
                  <strong>Payment Terms:</strong> <span style={{color: 'red'}}>Not Set</span>
                </div>
              )}
            </div>

            {/* Add Invoice Information Section */}
            <div className="detail-section">
              <h4>Invoice Information</h4>
              {(() => {
                const contractInvoice = invoices.find(inv => inv.contractId === selectedContract._id);
                // Check if this contract already has downpayment / final invoices
                const hasDownpaymentInvoice = invoices.some(
                  inv => inv.contractId === selectedContract._id && inv.invoiceType === "downpayment"
                );
                const hasFinalInvoice = invoices.some(
                  inv =>
                    inv.contractId === selectedContract._id &&
                    (inv.invoiceType === "final" || inv.invoiceType === "full")
                );

                return contractInvoice ? (
                  <div className="invoice-info">
                    <div className="detail-row">
                      <strong>Invoice Number:</strong> {contractInvoice.invoiceNumber}
                    </div>
                    <div className="detail-row">
                      <strong>Invoice Type:</strong> {contractInvoice.invoiceType === 'downpayment' ? '40% Downpayment' : 'Full Payment'}
                    </div>
                    <div className="detail-row">
                      <strong>Invoice Amount:</strong> ₱{contractInvoice.totalAmount?.toLocaleString()}
                    </div>
                    <div className="detail-row">
                      <strong>Invoice Status:</strong> 
                      <span className={`status ${contractInvoice.status}`}>
                        {contractInvoice.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <strong>Due Date:</strong> {new Date(contractInvoice.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <div className="detail-row">
                    <strong>Invoice:</strong> <span style={{color: 'orange'}}>No invoice generated</span>
                  </div>
                );
              })()}
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
                Set Payment Terms & Approve
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
          
          {/* FOR ACTIVE CONTRACTS - ONLY SHOW PRINT/VIEW OPTIONS */}
          {selectedContract.status === "Active" && (
            <div className="invoice-actions">
              {(() => {
                const contractInvoice = invoices.find(inv => inv.contractId === selectedContract._id);
                return contractInvoice ? (
                  <>
                    <button 
                      className="btn-primary"
                      onClick={() => setSelectedInvoice(contractInvoice)}
                    >
                      View Invoice Details
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => downloadInvoice(contractInvoice)}
                    >
                      Print Invoice
                    </button>
                  </>
                ) : (
                  <div className="no-invoice-actions">
                    {selectedContract.paymentSchedule && (
                      <button 
                        className="btn-primary"
                        onClick={() => generateInvoice(selectedContract)}
                      >
                        Generate Invoice Now
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
          
          {/* SHOW SET PAYMENT TERMS BUTTON FOR ACTIVE CONTRACTS WITHOUT PAYMENT TERMS */}
          {selectedContract.status === "Active" && !selectedContract.paymentSchedule && (
            <button 
              className="btn-warning"
              onClick={() => setShowPaymentModal(true)}
            >
              Set Payment Terms
            </button>
          )}
          
          <button className="btn-primary" onClick={() => setSelectedContract(null)}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
);

const renderPaymentModal = () => (
  showPaymentModal && selectedContract && (
    <div className="modal-overlay">
      <div className="modal medium-modal">
        <div className="modal-header">
          <h3>Set Payment Terms - {selectedContract.contractNumber}</h3>
          <button className="close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="contract-summary">
            <h4>Contract Summary</h4>
            <div className="summary-details">
              <p><strong>Client:</strong> {selectedContract.page1?.celebratorName || "N/A"}</p>
              <p><strong>Event:</strong> {selectedContract.page1?.occasion || "N/A"}</p>
              <p><strong>Event Date:</strong> {selectedContract.page1?.eventDate || "N/A"}</p>
              <p><strong>Total Contract Value:</strong> ₱{parseFloat(selectedContract.page3?.grandTotal || 0).toLocaleString()}</p>
            </div>
          </div>

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
                <span className="option-label">
                  <strong>Full Payment</strong>
                  <span className="option-description">Client pays 100% upfront</span>
                </span>
              </label>
              
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentOption"
                  value="downpayment"
                  checked={paymentOption === "downpayment"}
                  onChange={(e) => setPaymentOption(e.target.value)}
                />
                <span className="option-label">
                  <strong>40% Downpayment</strong>
                  <span className="option-description">40% downpayment, 60% final payment</span>
                </span>
              </label>
            </div>

            {paymentOption && (
              <div className="payment-details-preview">
                <h5>Payment Schedule Preview</h5>
                <div className="payment-schedule-preview">
                  {paymentOption === "downpayment" ? (
                    <>
                      <div className="payment-item-preview">
                        <div className="payment-info">
                          <span className="payment-label">Downpayment (40%)</span>
                          <span className="payment-due-date">
                            Due: {new Date(calculateDownpaymentDueDate()).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="payment-amount">
                          ₱{calculateDownpaymentAmount().toLocaleString()}
                        </span>
                      </div>
                      <div className="payment-item-preview">
                        <div className="payment-info">
                          <span className="payment-label">Final Payment (60%)</span>
                          <span className="payment-due-date">
                            Due: {new Date(calculateFinalPaymentDueDate()).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="payment-amount">
                          ₱{calculateFinalPaymentAmount().toLocaleString()}
                        </span>
                      </div>
                      <div className="payment-total">
                        <strong>Total: ₱{parseFloat(selectedContract.page3?.grandTotal || 0).toLocaleString()}</strong>
                      </div>
                    </>
                  ) : (
                    <div className="payment-item-preview">
                      <div className="payment-info">
                        <span className="payment-label">Full Payment (100%)</span>
                        <span className="payment-due-date">
                          Due: {new Date(calculateFinalPaymentDueDate()).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="payment-amount">
                        ₱{parseFloat(selectedContract.page3?.grandTotal || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
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
            {selectedContract.status === "Active" ? "Update Payment Terms" : "Approve Contract with Payment Terms"}
          </button>
          
          {selectedContract.status === "For Accounting Review" && (
            <button 
              className="btn-reject"
              onClick={() => {
                const reason = prompt("Please enter reason for rejection:");
                if (reason) {
                  rejectContract(selectedContract._id, reason);
                  setShowPaymentModal(false);
                }
              }}
            >
              Reject Contract
            </button>
          )}
          
          <button 
            className="btn-primary"
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
  showInvoiceModal && newInvoice && selectedContract && (
    <div className="modal-overlay">
      <div className="modal large-modal">
        <div className="modal-header">
          <h3>Invoice Preview - {newInvoice.invoiceNumber}</h3>
          <button className="close-btn" onClick={() => setShowInvoiceModal(false)}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="invoice-preview">
            <div className="preview-header">
              <h4>Invoice Details</h4>
              <div className="invoice-type-badge">
                {newInvoice.invoiceType === 'downpayment' ? '40% DOWNPAYMENT' : 
                 newInvoice.invoiceType === 'final' ? 'FINAL PAYMENT' : 'FULL PAYMENT'}
              </div>
            </div>
            
            <div className="preview-details">
              <div className="preview-row">
                <strong>Client:</strong> {newInvoice.client}
              </div>
              <div className="preview-row">
                <strong>Contract #:</strong> {newInvoice.contractNumber}
              </div>
              <div className="preview-row">
                <strong>Event:</strong> {newInvoice.occasion}
              </div>
              <div className="preview-row">
                <strong>Due Date:</strong> {new Date(newInvoice.dueDate).toLocaleDateString()}
              </div>
              <div className="preview-row">
                <strong>Total Amount:</strong> ₱{newInvoice.totalAmount.toLocaleString()}
              </div>
              
              {newInvoice.invoiceType === 'downpayment' && (
                <div className="preview-row">
                  <strong>Remaining Balance:</strong> ₱{(
                    parseFloat(selectedContract.page3?.grandTotal) - newInvoice.totalAmount
                  ).toLocaleString()}
                </div>
              )}
            </div>

            <div className="preview-items">
              <h5>Invoice Items:</h5>
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {newInvoice.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.description}</td>
                      <td>₱{item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Total:</strong></td>
                    <td><strong>₱{newInvoice.totalAmount.toLocaleString()}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={createInvoice}>
            Create Invoice
          </button>
          <button className="btn-primary" onClick={() => setShowInvoiceModal(false)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
);
  // ... (other modal render functions remain the same) ...

 const renderPaymentDetailsModal = () => (
  showPaymentDetailsModal && selectedInvoice && (
    <div className="modal-overlay">
      <div className="modal medium-modal">
        <div className="modal-header">
          <h3>Verify Payment - {selectedInvoice.invoiceNumber}</h3>
          <button className="close-btn" onClick={() => setShowPaymentDetailsModal(false)}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="payment-verification-form">
            <div className="invoice-summary">
              <h4>Invoice Summary</h4>
              <div className="summary-details">
                <p><strong>Client:</strong> {selectedInvoice.client}</p>
                <p><strong>Amount Due:</strong> ₱{selectedInvoice.totalAmount?.toLocaleString()}</p>
                <p><strong>Due Date:</strong> {new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="form-section">
              <h4>Payment Details</h4>
              
              <div className="form-group">
                <label>Payment Mode *</label>
                <select 
                  value={paymentVerification.paymentMode}
                  onChange={handlePaymentModeChange}
                  className="form-select"
                >
                  <option value="">Select Payment Mode</option>
                  <option value="gcash">GCash</option>
                  <option value="maya">Maya</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                </select>
              </div>

              <div className="form-group">
                <label>Reference Number *</label>
                <input
                  type="text"
                  value={paymentVerification.referenceNumber}
                  onChange={handleReferenceNumberChange}
                  placeholder="Enter reference number"
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Payment Date *</label>
                  <input
                    type="date"
                    value={paymentVerification.paymentDate}
                    onChange={handlePaymentDateChange}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Amount Paid *</label>
                  <input
                    type="number"
                    value={paymentVerification.amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={paymentVerification.notes}
                  onChange={handleNotesChange}
                  placeholder="Additional payment notes..."
                  className="form-textarea"
                  rows="3"
                />
              </div>

              {/* ADD THIS FILE UPLOAD SECTION */}
              <div className="form-group">
                <label>Proof of Payment *</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="proofOfPayment"
                    onChange={handleFileUpload}
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="file-input"
                    style={{ display: 'none' }} // Hide the default input
                  />
                  <label 
                    htmlFor="proofOfPayment" 
                    className="file-upload-label"
                  >
                    <div className="file-upload-content">
                      <span className="upload-icon">📁</span>
                      <span className="upload-text">
                        {paymentVerification.proofOfPayment 
                          ? `File selected: ${paymentVerification.proofOfPayment.name}`
                          : 'Click to upload proof of payment'
                        }
                      </span>
                      <span className="upload-subtext">
                        Supported formats: JPG, PNG, PDF (Max 5MB)
                      </span>
                    </div>
                  </label>
                  
                  {paymentVerification.proofOfPayment && (
                    <div className="file-preview">
                      <span className="file-info">
                        📎 {paymentVerification.proofOfPayment.name} 
                        ({(paymentVerification.proofOfPayment.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                      <button 
                        type="button"
                        className="remove-file-btn"
                        onClick={() => {
                          setPaymentVerification({
                            ...paymentVerification,
                            proofOfPayment: null
                          });
                          // Reset the file input
                          document.getElementById('proofOfPayment').value = '';
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="verification-summary">
              <h4>Verification Summary</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Payment Mode:</span>
                  <span className="summary-value">
                    {paymentVerification.paymentMode ? 
                      paymentVerification.paymentMode.charAt(0).toUpperCase() + 
                      paymentVerification.paymentMode.slice(1).replace('-', ' ') 
                      : 'Not selected'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Reference No:</span>
                  <span className="summary-value">
                    {paymentVerification.referenceNumber || 'Not provided'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Amount:</span>
                  <span className="summary-value">
                    ₱{paymentVerification.amount?.toLocaleString() || '0.00'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Proof Uploaded:</span>
                  <span className="summary-value">
                    {paymentVerification.proofOfPayment ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            className="btn-primary"
            onClick={markAsPaid}
            disabled={!paymentVerification.paymentMode || 
                     !paymentVerification.referenceNumber || 
                     !paymentVerification.proofOfPayment}
          >
            Confirm Payment
          </button>
          <button 
            className="btn-primary"
            onClick={() => setShowPaymentDetailsModal(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
);

  // Update the return statement to include the new modal
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
        {renderPaymentDetailsModal()} {/* Add the new modal */}
      </div>
    </div>
  );
}


export default AccountingDashboard;