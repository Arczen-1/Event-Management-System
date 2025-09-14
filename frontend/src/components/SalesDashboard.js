import React, { useState } from "react";
import "./SalesDashboard.css";

function SalesDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newContract, setNewContract] = useState({
    name: "",
    client: "",
    value: "",
    startDate: "",
    endDate: "",
    status: "Draft"
  });

  const handleInputChange = (e) => {
    setNewContract({
      ...newContract,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateContract = (e) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log("Creating contract:", newContract);
    
    // For now, just add to local state
    const contractWithId = {
      ...newContract,
      id: Date.now().toString()
    };
    setContracts([...contracts, contractWithId]);
    
    // Reset form
    setNewContract({
      name: "",
      client: "",
      value: "",
      startDate: "",
      endDate: "",
      status: "Draft"
    });
    setShowCreateForm(false);
  };

  const renderCreateForm = () => (
    <div className="create-contract-form">
      <h3>Create New Contract</h3>
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
            <label>Start Date</label>
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
            <option value="Pending">Pending</option>
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
      
      <div className="contracts-table">
        <table>
          <thead>
            <tr>
              <th>Contract Name</th>
              <th>Client</th>
              <th>Value</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr className="no-contracts">
                <td colSpan="6">No contracts created yet</td>
              </tr>
            ) : (
              contracts.map(contract => (
                <tr key={contract.id}>
                  <td>{contract.name}</td>
                  <td>{contract.client}</td>
                  <td>${contract.value}</td>
                  <td>{contract.startDate}</td>
                  <td>{contract.endDate}</td>
                  <td>
                    <span className={`status ${contract.status.toLowerCase()}`}>
                      {contract.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="sales-dashboard">
      <div className="dashboard-header">
        <h1>Sales Dashboard</h1>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>

      <div className="dashboard-content">
        {showCreateForm ? renderCreateForm() : renderContractsTable()}
      </div>
    </div>
  );
}

export default SalesDashboard;
