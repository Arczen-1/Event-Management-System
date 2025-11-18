import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "./DepartmentDashboard.css";

// Fix for Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function LogisticsDashboard({ onLogout }) {
  const [message, setMessage] = useState("");
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [page, setPage] = useState(1);
  const [activeView, setActiveView] = useState("dashboard");
  const [bookings, setBookings] = useState([]);
  const [startLocation, setStartLocation] = useState("Juan Carlo the Caterer, Lot 12 & 13, Greystone Commercial, 19 Congressional Ave Ext 1128 Quezon City National Capital Region");
  const [endLocation, setEndLocation] = useState("");
  const [routeInfo, setRouteInfo] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [eventToAssign, setEventToAssign] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    driver: "",
    truck: "",
    notes: ""
  });
  const [venueLocations, setVenueLocations] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const routeControlRef = useRef(null);

  // ===== INITIAL LOAD =====
  useEffect(() => {
    fetchContracts();
    fetchDrivers();
    fetchTrucks();
  }, []);

  useEffect(() => {
    if (contracts.length > 0) {
      const locations = [...new Set(contracts
        .filter(contract => contract.page1?.venue)
        .map(contract => contract.page1.venue)
      )].map(venue => ({ name: venue, address: venue }));
      setVenueLocations(locations);
      
      // Generate events from contracts
      generateEventsFromContracts();
    }
  }, [contracts]);

  useEffect(() => {
    if (activeView === "map") {
      setTimeout(() => initMap(), 300);
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === "map" && mapInstance.current) {
      setTimeout(() => mapInstance.current.invalidateSize(), 500);
    }
  }, [activeView]);

  // ===== FETCH CONTRACTS =====
  const fetchContracts = async () => {
    try {
      const res = await fetch("http://localhost:5000/contracts");
      const data = await res.json();
      if (res.ok) {
        const activeContracts = (data.contracts || [])
          .filter(c => c.status === "Active")
          .map(c => ({
            ...c,
            name: (c.page1 && (c.page1.contractName || c.page1.occasion)) || "Contract",
            celebratorName: (c.page1 && c.page1.celebratorName) || "",
            contractNumber: c.contractNumber || "-"
          }));
        setContracts(activeContracts);
      }
    } catch (e) {
      console.error("Error fetching contracts:", e);
    }
  };

  // ===== GENERATE EVENTS FROM CONTRACTS =====
  const generateEventsFromContracts = () => {
    console.log("Generating events from contracts:", contracts.length);
    
    const contractEvents = contracts.map(contract => {
      let eventDate;
      try {
        eventDate = contract.page1?.eventDate ? new Date(contract.page1.eventDate) : new Date();
        // If date is invalid, use today's date
        if (isNaN(eventDate.getTime())) {
          eventDate = new Date();
        }
      } catch (error) {
        console.error("Error parsing date for contract:", contract.contractNumber, error);
        eventDate = new Date();
      }

      const event = {
        id: contract._id || `contract-${contract.contractNumber}`,
        title: contract.name || "Unnamed Event",
        date: eventDate,
        venue: contract.page1?.venue || "Unknown Venue",
        client: contract.page1?.celebratorName || "Unknown Client",
        truck: "Unassigned",
        driver: "Unassigned",
        color: "#1a73e8",
        description: `Event at ${contract.page1?.venue || "venue"} for ${contract.page1?.celebratorName || "client"}`,
        contractNumber: contract.contractNumber || "N/A",
        eventTime: contract.page1?.arrivalOfGuests || "All Day",
        status: contract.status || "Active"
      };
      
      console.log("Created event:", event);
      return event;
    });
    
    setBookings(contractEvents);
    console.log("Total events generated:", contractEvents.length);
  };

  // ===== FETCH DRIVERS =====
  const fetchDrivers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/logistics/drivers");
      const data = await res.json();
      if (res.ok) {
        setDrivers(data.drivers || []);
      } else {
        setDrivers([
          { id: 1, name: "John Smith", license: "DL12345", status: "available" },
          { id: 2, name: "Mike Johnson", license: "DL67890", status: "available" },
          { id: 3, name: "David Wilson", license: "DL11223", status: "available" }
        ]);
      }
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setDrivers([
        { id: 1, name: "John Smith", license: "DL12345", status: "available" },
        { id: 2, name: "Mike Johnson", license: "DL67890", status: "available" },
        { id: 3, name: "David Wilson", license: "DL11223", status: "available" }
      ]);
    }
  };

  // ===== FETCH TRUCKS =====
  const fetchTrucks = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/logistics/trucks");
      const data = await res.json();
      if (res.ok) {
        setTrucks(data.trucks || []);
      } else {
        setTrucks([
          { id: 1, name: "Truck A", plate: "ABC123", capacity: "Large", status: "available" },
          { id: 2, name: "Truck B", plate: "DEF456", capacity: "Medium", status: "available" },
          { id: 3, name: "Van C", plate: "GHI789", capacity: "Small", status: "available" }
        ]);
      }
    } catch (err) {
      console.error("Error fetching trucks:", err);
      setTrucks([
        { id: 1, name: "Truck A", plate: "ABC123", capacity: "Large", status: "available" },
        { id: 2, name: "Truck B", plate: "DEF456", capacity: "Medium", status: "available" },
        { id: 3, name: "Van C", plate: "GHI789", capacity: "Small", status: "available" }
      ]);
    }
  };

  // ===== CALENDAR FUNCTIONS =====
  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDay = (day) => {
    return bookings.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === currentMonth.getMonth() && 
             eventDate.getFullYear() === currentMonth.getFullYear();
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday = new Date().getDate() === day && 
                     new Date().getMonth() === currentMonth.getMonth() && 
                     new Date().getFullYear() === currentMonth.getFullYear();

      days.push(
        <div key={day} className={`calendar-day ${isToday ? 'today' : ''}`}>
          <div className="day-number">{day}</div>
          <div className="day-events">
            {dayEvents.slice(0, 2).map((event, index) => (
              <div 
                key={index} 
                className="calendar-event-badge"
                style={{ backgroundColor: event.color }}
                onClick={() => setSelectedEvent(event)}
                title={`${event.title} - ${event.client}`}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="more-events">+{dayEvents.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  // ===== MAP INITIALIZATION =====
  const initMap = () => {
    if (!mapRef.current) return;
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    mapInstance.current = L.map(mapRef.current).setView([14.6576, 121.0430], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapInstance.current);

    // Add marker for Juan Carlo starting point
    geocode(startLocation)
      .then(([lat, lon]) => {
        const startMarker = L.marker([lat, lon]).addTo(mapInstance.current);
        startMarker.bindPopup(`
          <div style="min-width: 200px;">
            <strong>Juan Carlo the Caterer</strong><br/>
            <em>Starting Point</em><br/>
            Lot 12 & 13, Greystone Commercial<br/>
            19 Congressional Ave Ext<br/>
            Quezon City
          </div>
        `).openPopup();
      })
      .catch(() => {
        console.warn("Could not geocode Juan Carlo location");
      });

    // Add markers for all venue locations from contracts
    venueLocations.forEach((location) => {
      if (!location.name || location.name === "Unknown Venue") return;
      
      geocode(location.name)
        .then(([lat, lon]) => {
          const marker = L.marker([lat, lon]).addTo(mapInstance.current);
          marker.bindPopup(`
            <div style="min-width: 200px;">
              <strong>📍 ${location.name}</strong><br/>
              <em>Event Venue</em><br/>
              <button onclick="window.selectVenueFromMap('${location.name}')" 
                style="margin-top: 8px; padding: 4px 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Plan Route from Juan Carlo
              </button>
            </div>
          `);
        })
        .catch(() => {
          console.warn(`Could not geocode venue: ${location.name}`);
        });
    });

    // Add global function for venue selection
    window.selectVenueFromMap = (venueName) => {
      setEndLocation(venueName);
      showRoute();
    };
  };

  // ===== GEOCODE FUNCTION =====
  const geocode = async (q) => {
    if (!q || q.trim() === "") throw new Error("⚠️ Please enter a valid address.");

    const cleanedQuery = q
      .replace(/\s+/g, " ")
      .replace(/[.,]/g, "")
      .trim();
    const query = `${cleanedQuery}, Philippines`;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          query
        )}`,
        { headers: { "User-Agent": "EventManagementSystem/1.0" } }
      );
      const data = await res.json();
      if (data && data.length > 0)
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    } catch (err) {
      console.warn("Nominatim failed:", err);
    }

    if (q.includes("Juan Carlo") || q.includes("Congressional")) {
      return [14.6576, 121.0430];
    }

    throw new Error(`⚠️ Location not found or invalid address: ${q}`);
  };

  // ===== ROUTE FINDER =====
  const showRoute = async () => {
    if (!startLocation || !endLocation) {
      alert("Please select a destination venue.");
      return;
    }

    try {
      const start = await geocode(startLocation);
      const end = await geocode(endLocation);

      if (!mapInstance.current) initMap();

      if (routeControlRef.current) {
        mapInstance.current.removeControl(routeControlRef.current);
      }

      const control = L.Routing.control({
        waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
        routeWhileDragging: false,
        lineOptions: { 
          styles: [{ 
            color: "#007bff", 
            weight: 6,
            opacity: 0.8
          }] 
        },
        showAlternatives: false,
        fitSelectedRoutes: true,
      })
        .on("routesfound", (e) => {
          const route = e.routes[0];
          const dist = (route.summary.totalDistance / 1000).toFixed(2);
          const time = (route.summary.totalTime / 60).toFixed(1);
          setRouteInfo({ 
            distance: `${dist} km`, 
            duration: `${time} minutes`
          });
        })
        .on("routingerror", (err) => {
          console.error("Routing error:", err);
          alert("Could not calculate route. Please check the addresses.");
        })
        .addTo(mapInstance.current);

      routeControlRef.current = control;
      
    } catch (err) {
      alert(err.message);
    }
  };

  // ===== CLEAR ROUTE =====
  const clearRoute = () => {
    if (routeControlRef.current && mapInstance.current) {
      mapInstance.current.removeControl(routeControlRef.current);
      routeControlRef.current = null;
      setRouteInfo(null);
      setEndLocation("");
      initMap();
    }
  };

  // ===== ASSIGN DRIVER AND TRUCK =====
  const openAssignmentModal = (event) => {
    setEventToAssign(event);
    setAssignmentData({
      driver: event.driver || "",
      truck: event.truck || "",
      notes: ""
    });
    setAssignmentModalOpen(true);
  };

  const saveAssignment = async () => {
    if (!eventToAssign) return;

    try {
      const assignment = {
        eventId: eventToAssign.id,
        contractNumber: eventToAssign.contractNumber,
        driver: assignmentData.driver,
        truck: assignmentData.truck,
        notes: assignmentData.notes,
        assignedBy: "Logistics Manager",
        assignedAt: new Date().toISOString()
      };

      const res = await fetch("http://localhost:5000/api/logistics/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignment)
      });

      if (res.ok) {
        setBookings(prev => prev.map(event => 
          event.id === eventToAssign.id 
            ? { ...event, driver: assignmentData.driver, truck: assignmentData.truck }
            : event
        ));
        
        setMessage("Assignment saved successfully!");
        setAssignmentModalOpen(false);
        setEventToAssign(null);
        alert("Driver and truck assigned successfully!");
      } else {
        alert("Error saving assignment");
      }
    } catch (err) {
      console.error("Error saving assignment:", err);
      alert("Error saving assignment");
    }
  };

  // ===== PRINT EVENT DETAILS =====
  const printEventDetails = (event) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Event Details - ${event.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .details { margin: 20px 0; }
            .detail-row { margin: 10px 0; }
            .section { margin: 20px 0; border-top: 1px solid #ccc; padding-top: 10px; }
            .route-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Event Logistics Details</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="details">
            <div class="detail-row"><strong>Event:</strong> ${event.title}</div>
            <div class="detail-row"><strong>Client:</strong> ${event.client}</div>
            <div class="detail-row"><strong>Contract Number:</strong> ${event.contractNumber || 'N/A'}</div>
            <div class="detail-row"><strong>Date:</strong> ${event.date?.toLocaleDateString() || 'N/A'}</div>
            <div class="detail-row"><strong>Time:</strong> ${event.eventTime || 'N/A'}</div>
            <div class="detail-row"><strong>Venue:</strong> ${event.venue}</div>
          </div>
          <div class="section">
            <h3>Logistics Assignment</h3>
            <div class="detail-row"><strong>Driver:</strong> ${event.driver}</div>
            <div class="detail-row"><strong>Truck:</strong> ${event.truck}</div>
          </div>
          <div class="section">
            <h3>Route Information</h3>
            <div class="detail-row"><strong>Starting Point:</strong> Juan Carlo the Caterer, Quezon City</div>
            <div class="detail-row"><strong>Destination:</strong> ${event.venue}</div>
            ${routeInfo ? `
              <div class="route-info">
                <div class="detail-row"><strong>Estimated Distance:</strong> ${routeInfo.distance}</div>
                <div class="detail-row"><strong>Estimated Duration:</strong> ${routeInfo.duration}</div>
              </div>
            ` : '<div class="detail-row"><em>Route not calculated yet</em></div>'}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // ===== RENDER FUNCTIONS =====
  const renderDashboardView = () => {
    const pendingAssignments = bookings.filter(b => b.driver === "Unassigned" || b.truck === "Unassigned").length;
    const todayEvents = bookings.filter(b => {
      if (!b.date) return false;
      const today = new Date().toDateString();
      const eventDate = new Date(b.date).toDateString();
      return eventDate === today;
    }).length;

    return (
      <div className="dashboard-view">
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <div className="card-icon"></div>
            <div className="card-content">
              <div className="card-value">{contracts.length}</div>
              <div className="card-label">Active Contracts</div>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="card-icon"></div>
            <div className="card-content">
              <div className="card-value">{bookings.length}</div>
              <div className="card-label">Scheduled Events</div>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="card-icon"></div>
            <div className="card-content">
              <div className="card-value">{pendingAssignments}</div>
              <div className="card-label">Pending Assignments</div>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="card-icon"></div>
            <div className="card-content">
              <div className="card-value">{todayEvents}</div>
              <div className="card-label">Today's Events</div>
            </div>
          </div>
        </div>

        <div className="contracts-table-container">
          <div className="table-header">
            <h3>Recent Contracts</h3>
            <button className="text-link" onClick={() => setActiveView("contracts")}>
              View All →
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Contract Name</th>
                <th>Client</th>
                <th>Event Date</th>
                <th>Venue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.slice(0, 5).map((contract) => (
                <tr key={contract._id}>
                  <td>{contract.name}</td>
                  <td>{contract.celebratorName}</td>
                  <td>{contract.page1?.eventDate || 'N/A'}</td>
                  <td>{contract.page1?.venue || 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-review" onClick={() => setSelectedContract(contract)}>
                        View
                      </button>
                      <button className="btn-primary small" onClick={() => {
                        setEndLocation(contract.page1?.venue || "");
                        setActiveView("map");
                      }}>
                        Show Route
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContractsTable = () => {
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedContracts = contracts.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="contracts-table-container">
        <div className="table-header">
          <h3>Active Contracts</h3>
          <div className="pager">
            <button className="pager-btn" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
              ←
            </button>
            <span className="page-indicator">
              Page {page} of {Math.ceil(contracts.length / itemsPerPage)}
            </span>
            <button className="pager-btn" onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(contracts.length / itemsPerPage)}>
              →
            </button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Contract Name</th>
              <th>Client</th>
              <th>Contract No.</th>
              <th>Event Date</th>
              <th>Venue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedContracts.length === 0 ? (
              <tr><td colSpan="6">No active contracts available</td></tr>
            ) : (
              paginatedContracts.map((contract) => (
                <tr key={contract._id}>
                  <td>{contract.name}</td>
                  <td>{contract.celebratorName}</td>
                  <td>{contract.contractNumber}</td>
                  <td>{contract.page1?.eventDate || 'N/A'}</td>
                  <td>{contract.page1?.venue || 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-review" onClick={() => setSelectedContract(contract)}>
                        View Details
                      </button>
                      <button className="btn-primary small" onClick={() => {
                        setEndLocation(contract.page1?.venue || "");
                        setActiveView("map");
                      }}>
                        Show Route
                      </button>
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

  const renderCalendarView = () => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <h3>Event Calendar</h3>
          <div className="calendar-actions">
            <button className="btn-secondary" onClick={() => setCurrentMonth(new Date())}>
              Today
            </button>
            <button className="btn-secondary" onClick={() => generateEventsFromContracts()}>
              Refresh Events
            </button>
          </div>
        </div>
        
        {/* Custom Calendar */}
        <div className="custom-calendar">
          <div className="calendar-controls">
            <button className="nav-btn" onClick={() => navigateMonth(-1)}>
              ← Previous
            </button>
            <h4>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h4>
            <button className="nav-btn" onClick={() => navigateMonth(1)}>
              Next →
            </button>
          </div>
          
          <div className="calendar-grid">
            <div className="calendar-header-row">
              <div className="calendar-header-cell">Sun</div>
              <div className="calendar-header-cell">Mon</div>
              <div className="calendar-header-cell">Tue</div>
              <div className="calendar-header-cell">Wed</div>
              <div className="calendar-header-cell">Thu</div>
              <div className="calendar-header-cell">Fri</div>
              <div className="calendar-header-cell">Sat</div>
            </div>
            <div className="calendar-days">
              {renderCalendar()}
            </div>
          </div>
        </div>
        
        {/* Contract Events List */}
        <div className="events-list">
          <div className="events-header">
            <h4>Contract Events ({bookings.length})</h4>
            <div className="events-stats">
              <span className="stat">Upcoming: {bookings.filter(b => new Date(b.date) >= new Date()).length}</span>
              <span className="stat">Past: {bookings.filter(b => new Date(b.date) < new Date()).length}</span>
            </div>
          </div>
          
          {bookings.length === 0 ? (
            <div className="no-events">
              <p>No contract events found.</p>
              <p>Events will appear here once you have active contracts with event dates.</p>
              <button className="btn-primary" onClick={fetchContracts}>
                Refresh Contracts
              </button>
            </div>
          ) : (
            <div className="events-grid">
              {bookings.map((event, i) => (
                <div key={event.id || i} className="calendar-event-card">
                  <div className="event-header">
                    <div className="event-color" style={{ backgroundColor: event.color }}></div>
                    <h4>{event.title}</h4>
                    <span className={`event-status ${event.status?.toLowerCase()}`}>
                      {event.status}
                    </span>
                  </div>
                  <div className="event-details">
                    <div className="detail-row">
                      <strong>Date:</strong> {event.date?.toLocaleDateString() || 'N/A'}
                    </div>
                    <div className="detail-row">
                      <strong>Time:</strong> {event.eventTime || 'All Day'}
                    </div>
                    <div className="detail-row">
                      <strong>Venue:</strong> {event.venue}
                    </div>
                    <div className="detail-row">
                      <strong>Client:</strong> {event.client}
                    </div>
                    <div className="detail-row">
                      <strong>Contract:</strong> {event.contractNumber}
                    </div>
                    <div className="detail-row assignment">
                      <strong>Driver:</strong> 
                      <span className={event.driver === "Unassigned" ? "unassigned" : "assigned"}>
                        {event.driver}
                      </span>
                    </div>
                    <div className="detail-row assignment">
                      <strong>Truck:</strong> 
                      <span className={event.truck === "Unassigned" ? "unassigned" : "assigned"}>
                        {event.truck}
                      </span>
                    </div>
                  </div>
                  <div className="event-actions">
                    <button className="btn-primary small" onClick={() => setSelectedEvent(event)}>
                      View
                    </button>
                    <button className="btn-edit small" onClick={() => openAssignmentModal(event)}>
                      Assign
                    </button>
                    <button className="btn-secondary small" onClick={() => printEventDetails(event)}>
                      Print
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMapView = () => (
    <div className="map-container">
      <h3>Venue Map & Route Planner</h3>
      <div className="route-inputs">
        <input
          type="text"
          placeholder="Enter starting point"
          value={startLocation}
          readOnly
          className="route-input"
        />
        <select 
          value={endLocation} 
          onChange={(e) => setEndLocation(e.target.value)}
          className="route-input"
        >
          <option value="">Select event venue...</option>
          {venueLocations.map((location, index) => (
            <option key={index} value={location.name}>
              {location.name}
            </option>
          ))}
        </select>
        <button
          onClick={showRoute}
          className="btn-primary"
          disabled={!endLocation}
        >
          Show Route
        </button>
      </div>
      
      {routeInfo && (
        <div className="route-info">
          <strong>Distance:</strong> {routeInfo.distance} |{" "}
          <strong>Duration:</strong> {routeInfo.duration}
        </div>
      )}
      
      <div
        ref={mapRef}
        className="logistics-map"
        style={{
          width: "100%",
          height: "600px",
          borderRadius: "10px",
          background: "#ccc",
          marginTop: "10px"
        }}
      ></div>
    </div>
  );

  const renderEventModal = () =>
    selectedEvent && (
      <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Event Details</h3>
            <button className="close-btn" onClick={() => setSelectedEvent(null)}>×</button>
          </div>
          <div className="modal-body">
            <div className="detail-section">
              <h4>Event Information</h4>
              <p><strong>Event:</strong> {selectedEvent.title}</p>
              <p><strong>Client:</strong> {selectedEvent.client}</p>
              <p><strong>Contract Number:</strong> {selectedEvent.contractNumber}</p>
              <p><strong>Date:</strong> {selectedEvent.date?.toLocaleDateString() || 'Unknown'}</p>
              <p><strong>Time:</strong> {selectedEvent.eventTime || 'All Day'}</p>
              <p><strong>Venue:</strong> {selectedEvent.venue}</p>
            </div>
            <div className="detail-section">
              <h4>Logistics</h4>
              <p><strong>Driver:</strong> {selectedEvent.driver}</p>
              <p><strong>Truck:</strong> {selectedEvent.truck}</p>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-primary" onClick={() => {
              setEndLocation(selectedEvent.venue || "");
              setActiveView("map");
              setSelectedEvent(null);
            }}>
              Show Route
            </button>
            <button className="btn-edit" onClick={() => {
              openAssignmentModal(selectedEvent);
              setSelectedEvent(null);
            }}>
              Assign Driver/Truck
            </button>
            <button className="btn-secondary" onClick={() => setSelectedEvent(null)}>
              Close
            </button>
          </div>
        </div>
      </div>
    );

  const renderAssignmentModal = () =>
    assignmentModalOpen && (
      <div className="modal-overlay" onClick={() => setAssignmentModalOpen(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Assign Driver & Truck</h3>
            <button className="close-btn" onClick={() => setAssignmentModalOpen(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="modal-input-group">
              <label>Event</label>
              <input type="text" value={eventToAssign?.title || ''} readOnly />
            </div>
            <div className="modal-input-group">
              <label>Contract Number</label>
              <input type="text" value={eventToAssign?.contractNumber || ''} readOnly />
            </div>
            <div className="modal-input-group">
              <label>Date</label>
              <input type="text" value={eventToAssign?.date?.toLocaleDateString() || 'N/A'} readOnly />
            </div>
            <div className="modal-input-group">
              <label>Venue</label>
              <input type="text" value={eventToAssign?.venue || ''} readOnly />
            </div>
            <div className="modal-input-group">
              <label>Driver *</label>
              <select 
                value={assignmentData.driver} 
                onChange={(e) => setAssignmentData(prev => ({ ...prev, driver: e.target.value }))}
              >
                <option value="">Select Driver</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.name}>
                    {driver.name} ({driver.license})
                  </option>
                ))}
              </select>
            </div>
                      <div className="modal-input-group">
            <label>Notes</label>
            <textarea 
              value={assignmentData.notes} 
              onChange={(e) => setAssignmentData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes for the driver..."
              rows="3"
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={saveAssignment} disabled={!assignmentData.driver || !assignmentData.truck}>
            Save Assignment
          </button>
          <button className="btn-secondary" onClick={() => setAssignmentModalOpen(false)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const renderDetailsModal = () =>
    selectedContract && (
      <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Contract Details</h3>
            <button className="close-btn" onClick={() => setSelectedContract(null)}>×</button>
          </div>
          <div className="modal-body">
            <div className="detail-section">
              <h4>Contract Information</h4>
              <p><strong>Contract Number:</strong> {selectedContract.contractNumber}</p>
              <p><strong>Client:</strong> {selectedContract.page1?.celebratorName}</p>
              <p><strong>Event:</strong> {selectedContract.name}</p>
            </div>
            <div className="detail-section">
              <h4>Event Details</h4>
              <p><strong>Venue:</strong> {selectedContract.page1?.venue}</p>
              <p><strong>Date:</strong> {selectedContract.page1?.eventDate}</p>
              <p><strong>Time:</strong> {selectedContract.page1?.arrivalOfGuests}</p>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-primary" onClick={() => {
              setEndLocation(selectedContract.page1?.venue || "");
              setActiveView("map");
              setSelectedContract(null);
            }}>
              Show Route
            </button>
            <button className="btn-secondary" onClick={() => setSelectedContract(null)}>
              Close
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="department-dashboard">
      {/* Left Sidebar */}
      <div className="dashboard-sidebar">
        <div className="accreditation-header">
          <h1>LOGISTICS</h1>
          <h2>Dashboard</h2>
        </div>
        
        <div className="header-nav">
          <div className="nav-section">
            <div className="section-title">Navigation</div>
            <button className={`nav-btn ${activeView === "dashboard" ? "active" : ""}`} onClick={() => setActiveView("dashboard")}>
              Dashboard
            </button>
          </div>
          
          <div className="nav-section">
            <div className="section-title">Event Management</div>
            <button className={`nav-btn ${activeView === "contracts" ? "active" : ""}`} onClick={() => setActiveView("contracts")}>
              Active Contracts
            </button>
            <button className={`nav-btn ${activeView === "calendar" ? "active" : ""}`} onClick={() => setActiveView("calendar")}>
              Event Calendar ({bookings.length})
            </button>
          </div>
          
          <div className="nav-section">
            <div className="section-title">Route Planning</div>
            <button className={`nav-btn ${activeView === "map" ? "active" : ""}`} onClick={() => setActiveView("map")}>
              Map & Routes
            </button>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeView === "dashboard" && renderDashboardView()}
        {activeView === "contracts" && renderContractsTable()}
        {activeView === "calendar" && renderCalendarView()}
        {activeView === "map" && renderMapView()}
      </div>

      {selectedContract && renderDetailsModal()}
      {selectedEvent && renderEventModal()}
      {renderAssignmentModal()}
    </div>
  );
}

export default LogisticsDashboard;