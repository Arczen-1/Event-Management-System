import React, { useState, useEffect } from "react";
import "./SalesDashboard.css";
import ContractForm from "./ContractForm";
import Profile from "./Profile";

function SalesDashboard({ onLogout, user }) {
  const [contracts, setContracts] = useState([]);
  const [fullContracts, setFullContracts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [nextNumber, setNextNumber] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);
  const [editExisting, setEditExisting] = useState(null);
  const [showRejectionReasonModal, setShowRejectionReasonModal] = useState(false);
  const [currentRejectionReason, setCurrentRejectionReason] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [newContract, setNewContract] = useState({
    name: "",
    client: "",
    value: "",
    startDate: "",
    endDate: "",
    status: "Draft"
  });

  // Validation function to check required fields for approval (only those with asterisks)
  const validateContractForApproval = (contract) => {
    const errors = [];
    const p1 = contract.page1 || {};
    const p2 = contract.page2 || {};
    const p3 = contract.page3 || {};

    // Required fields in page1
    const requiredP1Fields = [
      'celebratorName', 'representativeName', 'representativeRelationship', 'representativeEmail', 'representativeAddress', 'representativeMobile',
      'coordinatorName', 'coordinatorMobile', 'coordinatorEmail', 'coordinatorAddress', 'eventDate', 'occasion', 'venue', 'hall', 'address',
      'arrivalOfGuests', 'ingressTime', 'cocktailTime', 'servingTime', 'totalVIP', 'totalRegular', 'totalGuests', 'themeSetup', 'colorMotif',
      'vipTableType', 'vipTableSeats', 'vipTableQuantity', 'regularTableType', 'regularTableSeats', 'regularTableQuantity',
      'vipUnderliner', 'vipNapkin', 'guestUnderliner', 'guestNapkin'
    ];
    requiredP1Fields.forEach(field => {
      if (!p1[field] || !p1[field].trim()) {
        errors.push(`Page 1 - ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
      }
    });

    // Email validations for required emails
    const validateEmail = (email) => {
      if (email.toUpperCase() === "N/A") return true;
      return email.includes("@gmail.com") || email.includes("@yahoo.com");
    };
    if (p1.representativeEmail && !validateEmail(p1.representativeEmail)) {
      errors.push("Page 1 - Representative email must end with @gmail.com or @yahoo.com");
    }
    if (p1.coordinatorEmail && !validateEmail(p1.coordinatorEmail)) {
      errors.push("Page 1 - Coordinator email must end with @gmail.com or @yahoo.com");
    }

    // Phone validations for required phones
    if (p1.representativeMobile && p1.representativeMobile.toUpperCase() !== "N/A" && !/^\d{11}$/.test(p1.representativeMobile)) {
      errors.push("Page 1 - Representative mobile must be 11 digits or N/A");
    }
    if (p1.coordinatorMobile && p1.coordinatorMobile.toUpperCase() !== "N/A" && !/^\d{11}$/.test(p1.coordinatorMobile)) {
      errors.push("Page 1 - Coordinator mobile must be 11 digits or N/A");
    }

    // Required fields in page2 (chairs)
    const requiredP2Fields = ['chairsMonoblock', 'chairsTiffany', 'chairsCrystal', 'chairsRustic', 'chairsKiddie', 'premiumChairs', 'totalChairs'];
    requiredP2Fields.forEach(field => {
      if (!p2[field] || !p2[field].trim()) {
        errors.push(`Page 2 - ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
      }
    });

    // Check chairs sum
    const sum = (parseInt(p2.chairsMonoblock) || 0) + (parseInt(p2.chairsTiffany) || 0) + (parseInt(p2.chairsCrystal) || 0) +
                (parseInt(p2.chairsRustic) || 0) + (parseInt(p2.chairsKiddie) || 0) + (parseInt(p2.premiumChairs) || 0);
    const total = parseInt(p2.totalChairs) || 0;
    if (sum !== total) {
      errors.push(`Page 2 - The total number of chairs entered (${sum}) must equal the Total Chairs (${total}).`);
    }

    // Check at least one knowUs
    const knowUsFields = ['knowUsWebsite', 'knowUsFacebook', 'knowUsInstagram', 'knowUsFlyers', 'knowUsBillboard', 'knowUsWordOfMouth',
                          'knowUsVenueReferral', 'knowUsRepeatClient', 'knowUsBridalFair', 'knowUsFoodTasting', 'knowUsCelebrityReferral', 'knowUsOthers'];
    const hasKnowUs = knowUsFields.some(field => p2[field]);
    if (!hasKnowUs) {
      errors.push("Page 2 - At least one 'How did you know our company' option must be selected");
    }

  // Required fields in page3
  const requiredP3Fields = ['pricePerPlate'];
  requiredP3Fields.forEach(field => {
    if (!p3[field] || !p3[field].trim()) {
      errors.push(`Page 3 - ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
    }
  });

    return errors;
  };

  // Load a preview of the next contract number
  useEffect(() => {
    if (showCreateForm && !editExisting) {
      fetch("http://localhost:5000/contracts/next-number")
        .then((res) => res.json())
        .then((data) => setNextNumber(data.nextNumber || ""))
        .catch(() => setNextNumber(""));
    }
  }, [showCreateForm, editExisting]);

  // Load contracts from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/contracts");
        const data = await res.json();
        if (res.ok) {
          const fullData = data.contracts || [];
          setFullContracts(fullData);
          setContracts(
            fullData.map((c) => ({
              id: c._id,
              name: (c.page1 && (c.page1.contractName || c.page1.occasion)) || "Contract",
              client: (c.page1 && c.page1.celebratorName) || "",
              value: (c.page3 && c.page3.grandTotal) || "",
              startDate: (c.page1 && c.page1.eventDate) || "",
              endDate: (c.page1 && c.page1.eventDate) || "",
              status: c.status || "Draft",
              contractNumber: c.contractNumber,
              rejectionReason: c.rejectionReason || "",
            }))
          );
        }
      } catch (e) {}
    })();
  }, []);

  const handleInputChange = (e) => {
    setNewContract({
      ...newContract,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    try {
      // Build minimal payload mapping to backend sections
      const payload = {
        department: "Sales",
        status: newContract.status,
        page1: {
          contractName: newContract.name,
          client: newContract.client,
          value: newContract.value,
          startDate: newContract.startDate,
          endDate: newContract.endDate,
        },
      };

      const res = await fetch("http://localhost:5000/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create");

      // Append to local list for immediate feedback
      setContracts([
        ...contracts,
        {
          id: data.contract._id,
          name: newContract.name,
          client: newContract.client,
          value: newContract.value,
          startDate: newContract.startDate,
          endDate: newContract.endDate,
          status: newContract.status,
          contractNumber: data.contract.contractNumber,
        },
      ]);

      // Reset form
      setNewContract({
        name: "",
        client: "",
        value: "",
        startDate: "",
        endDate: "",
        status: "Draft",
      });
      setShowCreateForm(false);
      setNextNumber("");
    } catch (err) {
      console.error(err);
      alert("Failed to create contract. Please try again.");
    }
  };

  const renderCreateForm = () => (
    <div className="create-contract-form">
      <h3>Create New Contract</h3>
      {nextNumber && (
        <div className="next-number">Next Contract No.: <strong>{nextNumber}</strong></div>
      )}
      <form onSubmit={handleCreateContract}>
        <div className="form-group">
          <label>Contract Name</label>
          <input
            type="text"
            name="name"
            value={newContract.name}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Client Name</label>
          <input
            type="text"
            name="client"
            value={newContract.client}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Contract Value</label>
          <input
            type="number"
            name="value"
            value={newContract.value}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Event Date</label>
            <input
              type="date"
              name="startDate"
              value={newContract.startDate}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={newContract.endDate}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Status</label>
          <select
            name="status"
            value={newContract.status}
            onChange={handleInputChange}
          >
            <option value="Draft">Draft</option>
            <option value="For Approval">For Approval</option>
            <option value="For Accounting Review">For Accounting Review</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-primary">Create Contract</button>
          <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const renderContractsTable = () => (
    <div className="contracts-table-container">
      <div className="table-header">
        <h3>My Contracts</h3>
        <button
          className="action-btn primary"
          onClick={() => setShowCreateForm(true)}
        >
          Create New Contract
        </button>
      </div>
      <div className="status-tabs">
        {["All", "Draft", "For Approval", "For Accounting Review", "Active", "Completed", "Rejected"].map(status => (
          <button
            key={status}
            className={`status-tab ${statusFilter === status ? 'active' : ''}`}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </button>
        ))}
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
          {contracts.length === 0 ? (
            <tr className="no-contracts">
              <td colSpan="7">No contracts created yet</td>
            </tr>
          ) : (
            contracts
              .filter(contract => statusFilter === "All" || contract.status === statusFilter)
              .map(contract => (
                <tr key={contract.id}>
                  <td className="clickable-cell" onClick={async () => {
                    try {
                      const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                      const data = await res.json();
                      if (res.ok) setSelectedContract(data.contract);
                    } catch (e) {}
                  }}>{contract.name}</td>
                  <td className="clickable-cell" onClick={async () => {
                    try {
                      const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                      const data = await res.json();
                      if (res.ok) setSelectedContract(data.contract);
                    } catch (e) {}
                  }}>{contract.client}</td>
                  <td className="clickable-cell" onClick={async () => {
                    try {
                      const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                      const data = await res.json();
                      if (res.ok) setSelectedContract(data.contract);
                    } catch (e) {}
                  }}>{contract.contractNumber || "-"}</td>
                  <td className="clickable-cell" onClick={async () => {
                    try {
                      const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                      const data = await res.json();
                      if (res.ok) setSelectedContract(data.contract);
                    } catch (e) {}
                  }}>₱{contract.value}</td>
                  <td className="clickable-cell" onClick={async () => {
                    try {
                      const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                      const data = await res.json();
                      if (res.ok) setSelectedContract(data.contract);
                    } catch (e) {}
                  }}>{contract.startDate}</td>
                  <td className="clickable-cell" onClick={async () => {
                    try {
                      const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                      const data = await res.json();
                      if (res.ok) setSelectedContract(data.contract);
                    } catch (e) {}
                  }}>
                    <span
                      className={`status ${contract.status.toLowerCase().replace(' ', '-')}`}
                      style={{
                        cursor: (contract.status === "Rejected" && contract.rejectionReason) ? 'pointer' : 'default'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (contract.status === "Rejected" && contract.rejectionReason) {
                          setCurrentRejectionReason(contract.rejectionReason);
                          setShowRejectionReasonModal(true);
                        }
                      }}
                      title={(contract.status === "Rejected" && contract.rejectionReason) ? contract.rejectionReason : ""}
                    >
                      {contract.status}
                    </span>
                  </td>
                  <td>
                    {contract.status === "Draft" && (
                      <div className="action-buttons">
                        <button
                          className="btn-primary small"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                              const data = await res.json();
                              if (res.ok) {
                                setEditExisting(data.contract);
                                setShowCreateForm(true);
                              }
                            } catch (e) {}
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-primary small"
                          disabled={(() => {
                            const fullContract = fullContracts.find(c => c._id === contract.id);
                            if (!fullContract) return true;
                            const errors = validateContractForApproval(fullContract);
                            return errors.length > 0;
                          })()}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await fetch(`http://localhost:5000/contracts/${contract.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: "For Approval" })
                              });
                              const data = await res.json();
                              if (res.ok) {
                                // Update the contract status in the local state
                                setContracts(prevContracts =>
                                  prevContracts.map(c =>
                                    c.id === contract.id
                                      ? { ...c, status: "For Approval" }
                                      : c
                                  )
                                );
                              } else {
                                alert(data.message || "Failed to send for approval");
                              }
                            } catch (error) {
                              alert("Failed to send for approval. Please try again.");
                            }
                          }}
                        >
                          Send for Approval
                        </button>
                      </div>
                    )}
                    {contract.status === "Rejected" && (
                      <button
                        className="btn-primary small"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
                            const data = await res.json();
                            if (res.ok) {
                              setEditExisting(data.contract);
                              setShowCreateForm(true);
                            }
                          } catch (e) {}
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
          )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDetailsModal = () => (
    <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Contract Details</h3>
        <div className="details-header">
          <div><span className="muted">No.:</span> <strong>{selectedContract.contractNumber}</strong></div>
          <div><span className="muted">Status:</span> <span className={`status-pill ${selectedContract.status.toLowerCase()}`}>{selectedContract.status}</span></div>
        </div>

        {(() => {
          const toTitle = (k) => k
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^./, (c) => c.toUpperCase());

          const Section = ({ title, data }) => {
            const entries = Object.entries(data || {}).filter(([_, v]) => v !== undefined && v !== null && String(v).trim() !== "");
            return (
              <div className="details-section">
                <h4>{title}</h4>
                {entries.length === 0 ? (
                  <div className="empty">No data</div>
                ) : (
                  <div className="kv-grid">
                    {entries.map(([k, v]) => (
                      <div key={k} className="kv-item">
                        <div className="kv-label">{toTitle(k)}</div>
                        <div className="kv-value">{String(v)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          };

          return (
            <>
              <Section title="Page 1" data={selectedContract.page1} />
              <Section title="Page 2" data={selectedContract.page2} />
              <Section title="Page 3" data={selectedContract.page3} />
            </>
          );
        })()}
        <div className="modal-actions">
          {(selectedContract.status === "Draft" || selectedContract.status === "Rejected") && (
            <button className="btn-primary" onClick={() => {
              setEditExisting(selectedContract);
              setSelectedContract(null);
              setShowCreateForm(true);
            }}>Edit</button>
          )}
          <button className="btn-secondary" onClick={() => setSelectedContract(null)}>Close</button>
        </div>
      </div>
    </div>
  );

  const renderRejectionReasonModal = () => (
    <div className="modal-overlay" onClick={() => setShowRejectionReasonModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Rejection Reason</h3>
          <button className="close-btn" onClick={() => setShowRejectionReasonModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <p>{currentRejectionReason}</p>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setShowRejectionReasonModal(false)}>Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="sales-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="header-left">
            <h1>Sales Dashboard</h1>
            <nav className="nav-bar">
              <button className="nav-btn" onClick={() => { setShowCreateForm(false); setEditExisting(null); setShowProfile(false); setSelectedContract(null); }}>
                Contracts
              </button>
              <button className="nav-btn" onClick={() => { setShowProfile(true); setShowCreateForm(false); setEditExisting(null); setSelectedContract(null); }}>
                Profile
              </button>
              <button className="nav-btn logout-btn" onClick={onLogout}>
                Log Out
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {showProfile ? (
          <Profile user={user} onLogout={onLogout} />
        ) : showCreateForm ? (
          <ContractForm
            onCancel={() => { setShowCreateForm(false); setEditExisting(null); }}
            onCreated={(created) => {
              setShowCreateForm(false);
              setEditExisting(null);
              // If editing, replace existing entry; otherwise append
              setContracts((prev) => {
                const idx = prev.findIndex((c) => c.id === created.id);
                if (idx !== -1) {
                  const copy = [...prev];
                  copy[idx] = created;
                  return copy;
                }
                return [...prev, created];
              });
            }}
            existing={editExisting}
            user={user}
          />
        ) : (
          renderContractsTable()
        )}
        {selectedContract && renderDetailsModal()}
        {showRejectionReasonModal && renderRejectionReasonModal()}
      </div>
    </div>
  );
}

export default SalesDashboard;
