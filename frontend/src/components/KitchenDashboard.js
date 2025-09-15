import React, { useState } from "react";
import "./DepartmentDashboard.css";

function KitchenDashboard({ onLogout }) {
  const [page, setPage] = useState(1);
  return (
    <div className="department-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Kitchen Dashboard</h1>
          <button onClick={onLogout} className="logout-btn header-logout">Logout</button>
        </div>
      </div>
      <div className="dashboard-content">
        <div className="contracts-table-container">
          <div className="table-header">
            <h3>Contracts</h3>
            <div className="pager">
              <button className="pager-btn" onClick={() => setPage(Math.max(1, page - 1))}>←</button>
              <span className="page-indicator">Page {page}</span>
              <button className="pager-btn" onClick={() => setPage(page + 1)}>→</button>
            </div>
          </div>
          <div className="contracts-table">
            <table>
              <thead>
                <tr>
                  <th>Contract Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="no-contracts">
                  <td colSpan="2">No contracts available</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KitchenDashboard;



