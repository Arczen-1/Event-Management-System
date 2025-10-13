import React, { useState, useEffect } from "react";
import "./SalesManagerDashboard.css";

function CreativeManagerDashboard({ onLogout }) {
  const [creativeRequests, setCreativeRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // all, for-approval, sent-to-purchasing
  const [reviewingRequest, setReviewingRequest] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchCreativeRequests();
  }, []);

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

      // Update local state instantly
      setCreativeRequests((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, status: "Sent to Purchasing" } : r
        )
      );

      // Close modal and switch tab
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

      // Update instantly
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

  // === FILTER LOGIC ===
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

  // === DYNAMIC COUNTS (LIVE UPDATES) ===
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

      {/* === MAIN CONTENT === */}
      <div className="dashboard-content">
        <div className="contracts-table-container" style={sectionStyle}>
          <div className="table-header">
            <h3>Creative Requests Management</h3>
          </div>

          {/* === MENU BAR (TABS) === */}
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

          {/* === CREATIVE REQUESTS TABLE === */}
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
                      <td>{r.requestName || ""}</td>
                      <td>{r.contractNo || "-"}</td>
                      <td>{r.client || ""}</td>
                      <td style={{ maxWidth: 240, whiteSpace: "pre-wrap" }}>
                        {r.materials
                          ?.map((m) => `${m.name} (${m.quantity})`)
                          .join("\n") || ""}
                      </td>
                      <td>
                        {r.dueDate ? String(r.dueDate).slice(0, 10) : ""}
                      </td>
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
              <div className="modal-body">
                <label>Reason for Rejection</label>
                <textarea
                  placeholder="Enter reason..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="modal-actions">
                <button
                  className="btn-reject"
                  onClick={handleRejectSubmit}
                  disabled={!rejectReason.trim()}
                >
                  Submit
                </button>
                <button
                  className="btn-secondary"
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
