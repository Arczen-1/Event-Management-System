import React, { useState, useEffect } from "react";
import "./SalesManagerDashboard.css";

function CreativeManagerDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [creativeRequests, setCreativeRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [reviewingRequest, setReviewingRequest] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchContracts();
    fetchCreativeRequests();
  }, []);

  // === FETCH CONTRACTS ===
  const fetchContracts = async () => {
    try {
      const res = await fetch("http://localhost:5000/contracts/creative");
      const data = await res.json();
      const raw = Array.isArray(data) ? data : data.contracts || [];
      const mapped = raw.map((c) => ({
        id: c._id,
        name:
          (c.page1 && (c.page1.contractName || c.page1.occasion)) ||
          "Untitled Contract",
        client:
          (c.page1 &&
            (c.page1.celebratorName ||
              c.page1.client ||
              c.page1.clientName)) ||
          "—",
        contractNumber: c.contractNumber || "-",
        startDate:
          (c.page1 && (c.page1.eventDate || c.page1.startDate)) || "",
        endDate: (c.page1 && (c.page1.eventDate || c.page1.endDate)) || "",
        status: c.status || "Draft",
        raw: c,
      }));
      setContracts(mapped);
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setContracts([]);
    }
  };

  // === FETCH CREATIVE REQUESTS ===
  const fetchCreativeRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/creativeRequests");
      const data = await res.json();
      let arr = [];
      if (Array.isArray(data)) arr = data;
      else if (Array.isArray(data.requests)) arr = data.requests;
      else if (Array.isArray(data.creativeRequests))
        arr = data.creativeRequests;
      else if (data.request) arr = [data.request];
      setCreativeRequests(arr);
    } catch (err) {
      console.error("Error fetching creative requests:", err);
      setCreativeRequests([]);
    }
  };

  // === DELETE REQUEST ===
  const handleDeleteRequest = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;
    try {
      const res = await fetch(`http://localhost:5000/creativeRequests/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete request");
      setCreativeRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete request: " + (err.message || ""));
    }
  };

  // === APPROVE REQUEST ===
  const handleApproveRequest = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:5000/creativeRequests/${id}/approve`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve");

      setCreativeRequests((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, status: "Sent to Purchasing" } : r
        )
      );

      setShowReviewModal(false);
      setReviewingRequest(null);
      setActiveTab("sent-to-purchasing");
      alert("Creative request approved and sent to Purchasing!");
    } catch (err) {
      console.error(err);
      alert("Failed to approve request: " + err.message);
    }
  };

  // === REJECT REQUEST ===
  const handleRejectSubmit = async () => {
    if (!reviewingRequest) return;
    try {
      const res = await fetch(
        `http://localhost:5000/creativeRequests/${reviewingRequest._id}/reject`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject");

      setCreativeRequests((prev) =>
        prev.map((r) =>
          r._id === reviewingRequest._id
            ? { ...r, status: "Rejected", rejectionReason: rejectReason }
            : r
        )
      );

      setRejectReason("");
      setShowRejectModal(false);
      setReviewingRequest(null);
      alert("Creative request rejected successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to reject request: " + err.message);
    }
  };

  // === CONTRACT ROW CLICK ===
  const onContractRowClick = async (contract) => {
    try {
      const res = await fetch(`http://localhost:5000/contracts/${contract.id}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedContract(data.contract || contract.raw || null);
      } else {
        console.error("Failed to fetch contract details:", data);
      }
    } catch (err) {
      console.error("Error fetching contract details:", err);
    }
  };

  const getFilteredRequests = () => {
    switch (activeTab) {
      case "for-approval":
        return creativeRequests.filter((r) => r.status === "For Approval");
      case "sent-to-purchasing":
        return creativeRequests.filter((r) => r.status === "Sent to Purchasing");
      default:
        return creativeRequests;
    }
  };

  const countForApproval = creativeRequests.filter(
    (r) => r.status === "For Approval"
  ).length;
  const countSentToPurchasing = creativeRequests.filter(
    (r) => r.status === "Sent to Purchasing"
  ).length;

  const statusClass = (s = "") => s.toLowerCase().replace(/\s+/g, "-");
  const sectionStyle = { marginTop: "28px" };
  const filteredRequests = getFilteredRequests();

  return (
    <div className="sales-manager-dashboard">
      {/* === HEADER === */}
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Creative Manager Dashboard</h1>
          <button onClick={onLogout} className="logout-btn header-logout">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* === CONTRACTS TABLE === */}
        <div className="contracts-table-container">
          <div className="table-header">
            <h3>Contracts from Sales</h3>
          </div>
          <div className="contracts-table">
            <table>
              <thead>
                <tr>
                  <th>Contract Name</th>
                  <th>Client</th>
                  <th>Contract No.</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {contracts.length === 0 ? (
                  <tr className="no-contracts">
                    <td colSpan="6">No contracts found</td>
                  </tr>
                ) : (
                  contracts.map((c) => (
                    <tr
                      key={c.id}
                      className="clickable-row"
                      onClick={() => onContractRowClick(c)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{c.name}</td>
                      <td>{c.client}</td>
                      <td>{c.contractNumber}</td>
                      <td>{c.startDate?.slice(0, 10) || "-"}</td>
                      <td>{c.endDate?.slice(0, 10) || "-"}</td>
                      <td>
                        <span className={`status ${statusClass(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* === CREATIVE REQUESTS SECTION === */}
        <div className="contracts-table-container" style={sectionStyle}>
          <div className="table-header">
            <h3>Creative Requests Management</h3>
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Requests ({creativeRequests.length})
            </button>
            <button
              className={`tab ${activeTab === "for-approval" ? "active" : ""}`}
              onClick={() => setActiveTab("for-approval")}
            >
              For Approval ({countForApproval})
            </button>
            <button
              className={`tab ${
                activeTab === "sent-to-purchasing" ? "active" : ""
              }`}
              onClick={() => setActiveTab("sent-to-purchasing")}
            >
              Sent to Purchasing ({countSentToPurchasing})
            </button>
          </div>

          <div className="contracts-table">
            <table>
              <thead>
                <tr>
                  <th>Request Name</th>
                  <th>Contract No.</th>
                  <th>Client</th>
                  <th>Materials Needed</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr className="no-contracts">
                    <td colSpan="7">No creative requests found</td>
                  </tr>
                ) : (
                  filteredRequests.map((r, idx) => (
                    <tr key={r._id || idx}>
                      <td>{r.requestName}</td>
                      <td>{r.contractNo}</td>
                      <td>{r.client}</td>
                      <td style={{ maxWidth: 240, whiteSpace: "pre-wrap" }}>
                        {r.materials
                          ?.map((m) => `${m.name} (${m.quantity})`)
                          .join("\n")}
                      </td>
                      <td>{r.dueDate?.slice(0, 10)}</td>
                      <td>
                        <span className={`status ${statusClass(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteRequest(r._id)}
                          >
                            Delete
                          </button>
                          {r.status === "For Approval" && (
                            <button
                              className="btn-review"
                              onClick={() => {
                                setReviewingRequest(r);
                                setShowReviewModal(true);
                              }}
                            >
                              Review
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
        </div>

        {/* === CONTRACT DETAILS MODAL === */}
        {selectedContract && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedContract(null)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Contract Details</h3>
                <button
                  className="close-btn"
                  onClick={() => setSelectedContract(null)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Contract No.:</strong>{" "}
                  {selectedContract.contractNumber}
                </p>
                <p>
                  <strong>Client:</strong>{" "}
                  {selectedContract.page1?.client || "N/A"}
                </p>
                <p>
                  <strong>Event Date:</strong>{" "}
                  {selectedContract.page1?.eventDate || "N/A"}
                </p>
                <p>
                  <strong>Theme:</strong>{" "}
                  {selectedContract.page1?.themeSetup || "N/A"}
                </p>
                <p>
                  <strong>Motif:</strong>{" "}
                  {selectedContract.page1?.colorMotif || "N/A"}
                </p>
                <p>
                  <strong>Guests:</strong>{" "}
                  {selectedContract.page1?.totalGuests || "N/A"}
                </p>
              </div>
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setSelectedContract(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === REVIEW MODAL === */}
        {showReviewModal && reviewingRequest && (
          <div
            className="modal-overlay"
            onClick={() => setShowReviewModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Review Creative Request</h3>
                <button
                  className="close-btn"
                  onClick={() => setShowReviewModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Request Name:</strong> {reviewingRequest.requestName}
                </p>
                <p>
                  <strong>Contract No.:</strong> {reviewingRequest.contractNo}
                </p>
                <p>
                  <strong>Client:</strong> {reviewingRequest.client}
                </p>
                <p>
                  <strong>Due Date:</strong>{" "}
                  {reviewingRequest.dueDate?.slice(0, 10)}
                </p>
                <p>
                  <strong>Materials:</strong>
                </p>
                <pre>
                  {reviewingRequest.materials
                    ?.map((m) => `${m.name} (${m.quantity})`)
                    .join("\n")}
                </pre>
              </div>
              <div className="modal-actions">
                <button
                  className="btn-approve"
                  onClick={() => handleApproveRequest(reviewingRequest._id)}
                >
                  Approve
                </button>
                <button
                  className="btn-reject"
                  onClick={() => {
                    setShowReviewModal(false);
                    setShowRejectModal(true);
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === REJECT MODAL === */}
        {showRejectModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowRejectModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Reject Creative Request</h3>
                <button
                  className="close-btn"
                  onClick={() => setShowRejectModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body" style={{ textAlign: "left" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      fontWeight: "600",
                      color: "#333",
                      fontSize: "15px",
                    }}
                  >
                    Reason for Rejection
                  </label>
                  <textarea
                    placeholder="Type a clear reason for rejecting this request..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={5}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      fontSize: "14px",
                      resize: "none",
                      outline: "none",
                      transition: "border-color 0.2s ease",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#a40802")}
                    onBlur={(e) => (e.target.style.borderColor = "#ccc")}
                  />
                </div>
              </div>
              <div
                className="modal-actions"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "15px",
                }}
              >
                <button
                  className="btn-reject"
                  style={{
                    backgroundColor: "#a40802",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "6px",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                  onClick={handleRejectSubmit}
                  disabled={!rejectReason.trim()}
                >
                  Submit
                </button>
                <button
                  className="btn-secondary"
                  style={{
                    backgroundColor: "#6c757d",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "6px",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreativeManagerDashboard;
