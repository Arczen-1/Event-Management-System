// =======================
// LogisticsDashboard.js
// =======================

import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "./DepartmentDashboard.css";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function LogisticsDashboard({ onLogout }) {
  const [message, setMessage] = useState("");
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [page, setPage] = useState(1);
  const [activeView, setActiveView] = useState("dashboard");
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [eventToAssign, setEventToAssign] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    driver: "",
    truck: "",
    notes: "",
  });

  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    fetchContracts();
    fetchDrivers();
    fetchTrucks();
  }, []);

  useEffect(() => {
    if (contracts.length > 0) {
      generateEventsFromContracts();
    }
  }, [contracts, trucks]);

  // =========================
  // FETCH CONTRACTS
  // =========================
  const fetchContracts = async () => {
    try {
      const res = await fetch("http://localhost:5000/contracts");
      const data = await res.json();
      if (res.ok) {
        const activeContracts = (data.contracts || []).filter(
          (c) => c.status === "Active"
        );
        setContracts(activeContracts);
      }
    } catch (e) {
      console.error("Error fetching contracts:", e);
    }
  };

  // =========================
  // AUTO CALCULATION HELPERS
  // =========================

  const calculateWaiters = (packs) => {
    if (!packs) return 0;
    if (packs <= 200) return 10;
    if (packs <= 500) return 25;
    if (packs <= 1000) return 50;
    return Math.ceil(packs / 20);
  };

  const calculateVehicles = (packs) => {
    if (!packs) return 1;
    if (packs <= 300) return 1;
    if (packs <= 800) return 2;
    return 3;
  };

  const calculateStagingStatus = (eventDate) => {
    const today = new Date();
    const eventDay = new Date(eventDate);
    const diff = Math.ceil(
      (eventDay - today) / (1000 * 60 * 60 * 24)
    );

    if (diff === 2) return "Move to staging area";
    if (diff === 1) return "Load trucks";
    if (diff === 0) return "Deploy to venue";
    return "";
  };

  const calculateProgress = (contract) => {
    if (!contract.progress) return 40;
    return contract.progress;
  };

  const getStatusLabel = (progress) => {
    if (progress >= 100) return "Completed";
    if (progress >= 40) return "In Progress";
    return "Pending";
  };

  // =========================
  // CONFLICT DETECTION
  // =========================

  const detectConflicts = (events) => {
    const conflicts = {};
    events.forEach((event) => {
      const sameDayEvents = events.filter(
        (e) =>
          new Date(e.date).toDateString() ===
          new Date(event.date).toDateString()
      );

      if (sameDayEvents.length > trucks.length) {
        conflicts[event.id] = "Vehicle capacity conflict";
      }
    });
    return conflicts;
  };

  // =========================
  // GENERATE EVENTS
  // =========================

  const generateEventsFromContracts = () => {
    const contractEvents = contracts.map((contract) => {
      const packs = contract.page2?.totalPax || 0;
      const waitersNeeded = calculateWaiters(packs);
      const vehiclesNeeded = calculateVehicles(packs);
      const progress = calculateProgress(contract);
      const statusLabel = getStatusLabel(progress);

      const eventDate = contract.page1?.eventDate
        ? new Date(contract.page1.eventDate)
        : new Date();

      const stagingStatus = calculateStagingStatus(eventDate);

      return {
        id: contract._id,
        title:
          contract.page1?.contractName ||
          contract.page1?.occasion ||
          "Event",
        date: eventDate,
        venue: contract.page1?.venue || "Unknown Venue",
        client: contract.page1?.celebratorName || "",
        contractNumber: contract.contractNumber,
        packs,
        waitersNeeded,
        vehiclesNeeded,
        progress,
        statusLabel,
        stagingStatus,
        driver: "Unassigned",
        truck: "Unassigned",
      };
    });

    const conflictMap = detectConflicts(contractEvents);

    const enriched = contractEvents.map((e) => ({
      ...e,
      conflict: conflictMap[e.id] || null,
    }));

    setBookings(enriched);
  };

  // =========================
  // FETCH DRIVERS/TRUCKS
  // =========================

  const fetchDrivers = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/logistics/drivers"
      );
      const data = await res.json();
      setDrivers(data.drivers || []);
    } catch {
      setDrivers([]);
    }
  };

  const fetchTrucks = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/logistics/trucks"
      );
      const data = await res.json();
      setTrucks(data.trucks || []);
    } catch {
      setTrucks([]);
    }
  };

  // =========================
  // DASHBOARD VIEW
  // =========================

  const renderDashboardView = () => {
    const totalPacks = bookings.reduce(
      (sum, e) => sum + (e.packs || 0),
      0
    );
    const totalWaiters = bookings.reduce(
      (sum, e) => sum + (e.waitersNeeded || 0),
      0
    );
    const totalVehicles = bookings.reduce(
      (sum, e) => sum + (e.vehiclesNeeded || 0),
      0
    );
    const conflicts = bookings.filter((e) => e.conflict).length;

    return (
      <div className="dashboard-view">
        <div className="dashboard-cards">

          <div className="dashboard-card">
            <div className="card-content">
              <div className="card-value">{totalPacks}</div>
              <div className="card-label">Total Packs</div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-content">
              <div className="card-value">{totalWaiters}</div>
              <div className="card-label">Waiters Needed</div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-content">
              <div className="card-value">{totalVehicles}</div>
              <div className="card-label">Vehicles Needed</div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-content">
              <div className="card-value">{conflicts}</div>
              <div className="card-label">Conflict Alerts</div>
            </div>
          </div>

        </div>
      </div>
    );
  };



  return (
    <div className="department-dashboard">
      <div className="dashboard-sidebar">
        <div className="accreditation-header">
          <h1>LOGISTICS</h1>
          <h2>Dashboard</h2>
        </div>

        <button onClick={() => setActiveView("dashboard")}>
          Dashboard
        </button>

        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeView === "dashboard" && renderDashboardView()}
      </div>
    </div>
  );
}

export default LogisticsDashboard;
