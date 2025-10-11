import React, { useEffect, useState, useMemo } from "react";
import "./ContractForm.css";

// Venue data
const VENUES = {
  "OLD GROVE": {
    address: "Puro 5, U. Mojares Street Barangay Lodlod, Lipa City, 4217 Batangas",
    halls: { "The Barn": 300 }
  },
  "FERNWOOD GARDENS": {
    address: "Neogan, Tagaytay City",
    halls: { "Indoor Function Hall": 200, "Mozart Hall": 150, "Schubert Hall": 150, "Vivaldi Hall": 150 }
  },
  "WORLD TRADE CENTER": {
    address: "Mezzanine Level WTCMM Building, Sen. Gil J. Puyat Ave. cor. Diosdado Macapagal Blvd., Pasay City 1300",
    halls: { "Hall A": 1000, "Hall B": 1000, "Hall C": 700 }
  },
  "SMX Manila Convention Center": {
    address: "Seashell Lane, Mall of Asia Complex, Pasay City 1300, Philippines",
    halls: { "Hall 1": 1500, "Hall 2": 1000, "Hall 3": 1000, "Hall 4": 1500, "Function Room 1": 500, "Function Room 2": 500, "Function Room 3": 500, "Function Room 4": 1000, "Function Room 5": 1000 }
  },
  "THE BLUE LEAF EVENTS PAVILION": {
    address: "100 Park Avenue, McKinley Hill Village, Fort Bonifacio, Taguig, Metro Manila",
    halls: { "Banyan": 400, "Silk": 300, "Jade": 200 }
  },
  "THE BLUE LEAF COSMOPOLITAN (QUEZON CITY)": {
    address: "Robinsons Bridgetown, 80 Eulogio Rodriguez Jr. Ave, Libis, Quezon City, Metro Manila",
    halls: { "Monet": 300, "Picasso": 250, "Matisse": 250 }
  },
  "GALLERY MIRANILA (QUEZON CITY)": {
    address: "26 Mariposa, Quezon City, NCR",
    halls: { "Gallery MiraNila Hall": 150 }
  },
  "CLEO BY THE BLUE LEAF (CARMONA, CAVITE)": {
    address: "Gate 5, Congressional Road, Carmona, Cavite",
    halls: { "Hall A": 400, "Hall B": 300 }
  },
  "OTHERS": {
    address: "",
    halls: {}
  }
};

// Multi-page contract form replicating the client's three contract pages.
// Saves to backend with monthly-reset contract numbering.
function ContractForm({ onCancel, onCreated, existing, user }) {
  const formatNumber = (num) => num ? parseFloat(num).toLocaleString('en-US') : '';
  const [activePage, setActivePage] = useState(1); // 1, 2, 3, 4
  const [nextNumber, setNextNumber] = useState("");
  const [availableHalls, setAvailableHalls] = useState([]);
  const [maxPax, setMaxPax] = useState(0);
  const [errors, setErrors] = useState({});

  // Page 1 fields
  const [p1, setP1] = useState({
    celebratorName: "",
    celebratorAddress: "",
    celebratorLandline: "",
    celebratorMobile: "",
    celebratorEmail: "",
    representativeName: "",
    representativeRelationship: "",
    representativeAddress: "",
    representativeEmail: "",
    representativeMobile: "",
    representativeLandline: "",
    coordinatorName: "",
    coordinatorMobile: "",
    coordinatorLandline: "",
    coordinatorAddress: "",
    coordinatorEmail: "",
    eventDate: "",
    occasion: "",
    serviceStyle: "",
    venue: "",
    hall: "",
    ingressTime: "",
    cocktailTime: "",
    address: "",
    arrivalOfGuests: "",
    servingTime: "",
    totalGuests: "",
    totalVIP: "",
    totalRegular: "",
    kiddiePlated: "",
    kiddiePacked: "",
    crewPlated: "",
    crewPacked: "",
    themeSetup: "",
    colorMotif: "",
    vipTableType: "",
    regularTableType: "",
    vipTableSeats: "",
    regularTableSeats: "",
    vipTableQuantity: "",
    regularTableQuantity: "",
    vipUnderliner: "",
    vipTopper: "",
    vipNapkin: "",
    guestUnderliner: "",
    guestTopper: "",
    guestNapkin: "",
    setupRemarks: "",
  });

  // Page 2 fields
  const [p2, setP2] = useState({
    chairsMonoblock: "0",
    chairsTiffany: "0",
    chairsCrystal: "0",
    chairsRustic: "0",
    chairsKiddie: "0",
    premiumChairs: "0",
    totalChairs: "",
    chairsRemarks: "",
    flowerBackdrop: "",
    flowerGuestCenterpiece: "",
    flowerVipCenterpiece: "",
    flowerCakeTable: "",
    flowerRemarks: "",
    cakeNameCode: "",
    cakeFlavor: "",
    cakeSupplier: "",
    cakeSpecifications: "",
    celebratorsCar: "",
    emcee: "",
    soundSystem: "",
    tent: "",
    celebratorsChair: "",
    knowUsWebsite: false,
    knowUsFacebook: false,
    knowUsInstagram: false,
    knowUsFlyers: false,
    knowUsBillboard: false,
    knowUsWordOfMouth: false,
    knowUsVenueReferral: false,
    knowUsRepeatClient: false,
    knowUsBridalFair: false,
    knowUsFoodTasting: false,
    knowUsCelebrityReferral: false,
    knowUsOthers: false,
  });

  // Page 3 fields (Buffet)
  const [pBuffet, setPBuffet] = useState({
    selectedPackage: "",
    cocktailSelections: [],
  });

  // Page 4 fields (Menu/Pricing)
  const [p3, setP3] = useState({
    pricePerPlate: "0",
    cocktailHour: "",
    appetizer: "",
    soup: "",
    bread: "",
    salad: "",
    mainEntree: "",
    dessert: "",
    cakeName: "",
    kidsMeal: "",
    crewMeal: "",
    drinksCocktail: "",
    drinksMeal: "",
    roastedPig: "",
    roastedCalf: "",
    totalMenuCost: "0",
    totalSpecialReqCost: "0",
    mobilizationCharge: "0",
    taxes: "",
    serviceCharge: "",
    grandTotal: "0",
    fortyPercentDueOn: "",
    fortyPercentAmount: "",
    fortyPercentReceivedBy: "",
    fortyPercentDateReceived: "",
    fullPaymentDueOn: "",
    fullPaymentAmount: "",
    fullPaymentReceivedBy: "",
    fullPaymentDateReceived: "",
    remarks: "",
  });

  const totalPages = useMemo(() => p1.serviceStyle === "Buffet" ? 5 : 3, [p1.serviceStyle]);

  // Initialize for create vs edit
  useEffect(() => {
    if (existing) {
      setP1(existing.page1 || {});
      setP2(existing.page2 || {});
      setPBuffet({ selectedPackage: "", cocktailSelections: [], ...existing.pageBuffet });
      setP3(existing.page3 || {});
      setNextNumber(existing.contractNumber || "");
    } else {
      fetch("http://localhost:5000/contracts/next-number")
        .then((r) => r.json())
        .then((d) => setNextNumber(d.nextNumber || ""))
        .catch(() => setNextNumber(""));
    }
  }, [existing]);

  // Pre-fill coordinator fields with user profile for new contracts
  useEffect(() => {
    if (!existing && user) {
      fetch(`http://localhost:5000/profile/${user.username}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.user) {
            setP1((prev) => ({
              ...prev,
              coordinatorName: d.user.fullName || "",
              coordinatorMobile: d.user.mobile || "",
              coordinatorLandline: d.user.landline || "",
              coordinatorAddress: d.user.address || "",
              coordinatorEmail: d.user.email || "",
            }));
          }
        })
        .catch(() => {});
    }
  }, [existing, user]);

  // Auto-compute ingress time (10 hours before arrival of guests)
  useEffect(() => {
    if (p1.arrivalOfGuests && isTimeFieldValid(p1.arrivalOfGuests)) {
      // Parse time string HH:MM AM/PM
      const timeParts = p1.arrivalOfGuests.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1], 10);
        const minutes = parseInt(timeParts[2], 10);
        const ampm = timeParts[3].toUpperCase();
        if (ampm === "PM" && hours !== 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;
        // Subtract 10 hours
        hours -= 10;
        if (hours < 0) hours += 24;
        // Format back to HH:MM AM/PM
        const newAmpm = hours >= 12 ? "PM" : "AM";
        let displayHours = hours % 12;
        if (displayHours === 0) displayHours = 12;
        const ingressTime = `${displayHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${newAmpm}`;
        setP1(prev => ({ ...prev, ingressTime }));
      }
    }
  }, [p1.arrivalOfGuests]);



  // Auto-compute total chairs
  useEffect(() => {
    const totalGuests = parseInt(p1.totalGuests) || 0;
    const total = totalGuests + 10;
    setP2(prev => ({ ...prev, totalChairs: total.toString() }));
  }, [p1.totalGuests]);

  // Validate chair sum equals total chairs
  useEffect(() => {
    const sum = (parseInt(p2.chairsMonoblock) || 0) +
                (parseInt(p2.chairsTiffany) || 0) +
                (parseInt(p2.chairsCrystal) || 0) +
                (parseInt(p2.chairsRustic) || 0) +
                (parseInt(p2.chairsKiddie) || 0) +
                (parseInt(p2.premiumChairs) || 0);
    const total = parseInt(p2.totalChairs) || 0;
    if (sum !== total) {
      setErrors((prev) => ({
        ...prev,
        chairsSum: `The total number of chairs entered (${sum}) must equal the Total Chairs (${total}).`,
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.chairsSum;
        return newErrors;
      });
    }
  }, [p2.chairsMonoblock, p2.chairsTiffany, p2.chairsCrystal, p2.chairsRustic, p2.chairsKiddie, p2.premiumChairs, p2.totalChairs]);

  // Auto-set VIP seats based on table type
  useEffect(() => {
    let seats = '';
    if (p1.vipTableType === 'Round Table') seats = '8';
    else if (p1.vipTableType === 'Big Round Table') seats = '10';
    else if (p1.vipTableType === 'Rectangle Table') seats = '6';
    else if (p1.vipTableType === 'Long Rectangle Table') seats = '8';
    setP1(prev => ({ ...prev, vipTableSeats: seats }));
  }, [p1.vipTableType]);

  // Auto-set Regular seats based on table type
  useEffect(() => {
    let seats = '';
    if (p1.regularTableType === 'Round Table') seats = '8';
    else if (p1.regularTableType === 'Big Round Table') seats = '10';
    else if (p1.regularTableType === 'Rectangle Table') seats = '6';
    else if (p1.regularTableType === 'Long Rectangle Table') seats = '8';
    setP1(prev => ({ ...prev, regularTableSeats: seats }));
  }, [p1.regularTableType]);

  // Auto-compute VIP table quantity
  useEffect(() => {
    if (!p1.vipTableType || !p1.totalVIP) {
      setP1(prev => ({ ...prev, vipTableQuantity: '0' }));
      return;
    }
    const totalVIPNum = parseInt(p1.totalVIP) || 0;
    const seatsNum = parseInt(p1.vipTableSeats) || 1;
    const quantity = Math.ceil(totalVIPNum / seatsNum);
    setP1(prev => ({ ...prev, vipTableQuantity: quantity.toString() }));
  }, [p1.totalVIP, p1.vipTableSeats, p1.vipTableType]);

  // Auto-compute Regular table quantity
  useEffect(() => {
    if (!p1.regularTableType || !p1.totalRegular) {
      setP1(prev => ({ ...prev, regularTableQuantity: '0' }));
      return;
    }
    const totalRegularNum = (parseInt(p1.totalRegular) || 0) + 10;
    const seatsNum = parseInt(p1.regularTableSeats) || 1;
    const quantity = Math.ceil(totalRegularNum / seatsNum);
    setP1(prev => ({ ...prev, regularTableQuantity: quantity.toString() }));
  }, [p1.totalRegular, p1.regularTableSeats, p1.regularTableType]);

  // Auto-set cocktail time to arrival of guests
  useEffect(() => {
    setP1(prev => ({ ...prev, cocktailTime: p1.arrivalOfGuests }));
  }, [p1.arrivalOfGuests]);

  // Initialize availableHalls and maxPax based on venue and hall
  useEffect(() => {
    if (p1.venue) {
      const venueData = VENUES[p1.venue];
      if (venueData) {
        setAvailableHalls(Object.keys(venueData.halls));
        if (p1.hall && venueData.halls[p1.hall]) {
          setMaxPax(venueData.halls[p1.hall]);
        } else {
          setMaxPax(0);
        }
      }
    } else {
      setAvailableHalls([]);
      setMaxPax(0);
    }
  }, [p1.venue, p1.hall]);

  // Check hall capacity when total guests or hall changes
  useEffect(() => {
    if (p1.venue && p1.hall && VENUES[p1.venue]) {
      const pax = VENUES[p1.venue].halls[p1.hall] || 0;
      const totalGuestsNum = parseInt(p1.totalGuests) || 0;
      if (totalGuestsNum > pax) {
        setErrors((prev) => ({
          ...prev,
          totalGuests: `The selected hall cannot accommodate the total number of guests (${totalGuestsNum}). Maximum pax is ${pax}.`,
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.totalGuests;
          return newErrors;
        });
      }
    }
  }, [p1.totalGuests, p1.hall]);

  // Validate event date: must be at least 6 months from now
  useEffect(() => {
    if (p1.eventDate) {
      const eventDate = new Date(p1.eventDate);
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      if (eventDate < sixMonthsFromNow) {
        setErrors((prev) => ({
          ...prev,
          eventDate: "The event date should be at least 6 months from now.",
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.eventDate;
          return newErrors;
        });
      }
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.eventDate;
        return newErrors;
      });
    }
  }, [p1.eventDate]);

  // Auto-set full payment due date to 1 month before event date
  useEffect(() => {
    if (p1.eventDate) {
      const eventDate = new Date(p1.eventDate);
      const fullPaymentDate = new Date(eventDate);
      fullPaymentDate.setMonth(fullPaymentDate.getMonth() - 1);
      const formatted = fullPaymentDate.toISOString().split('T')[0];
      setP3((prev) => ({ ...prev, fullPaymentDueOn: formatted }));
    }
  }, [p1.eventDate]);

  // Auto-compute total menu cost as price per plate * total guests
  useEffect(() => {
    const price = parseFloat(p3.pricePerPlate) || 0;
    const guests = parseInt(p1.totalGuests) || 0;
    const total = price * guests;
    setP3((prev) => ({ ...prev, totalMenuCost: total.toString() }));
  }, [p3.pricePerPlate, p1.totalGuests]);

  // Auto-compute service charge as 10% of totalMenuCost + totalSpecialReqCost + mobilizationCharge
  useEffect(() => {
    const menu = parseFloat(p3.totalMenuCost) || 0;
    const special = parseFloat(p3.totalSpecialReqCost) || 0;
    const mob = parseFloat(p3.mobilizationCharge) || 0;
    const service = (menu + special + mob) * 0.1;
    setP3((prev) => ({ ...prev, serviceCharge: service.toString() }));
  }, [p3.totalMenuCost, p3.totalSpecialReqCost, p3.mobilizationCharge]);

  // Auto-compute taxes as 12% of totalMenuCost + totalSpecialReqCost + mobilizationCharge
  useEffect(() => {
    const menu = parseFloat(p3.totalMenuCost) || 0;
    const special = parseFloat(p3.totalSpecialReqCost) || 0;
    const mob = parseFloat(p3.mobilizationCharge) || 0;
    const tax = (menu + special + mob) * 0.12;
    setP3((prev) => ({ ...prev, taxes: tax.toString() }));
  }, [p3.totalMenuCost, p3.totalSpecialReqCost, p3.mobilizationCharge]);

  // Auto-compute grand total
  useEffect(() => {
    const menu = parseFloat(p3.totalMenuCost) || 0;
    const special = parseFloat(p3.totalSpecialReqCost) || 0;
    const mob = parseFloat(p3.mobilizationCharge) || 0;
    const service = parseFloat(p3.serviceCharge) || 0;
    const tax = parseFloat(p3.taxes) || 0;
    const grand = (menu + special + mob + service + tax).toFixed(2);
    setP3((prev) => ({ ...prev, grandTotal: grand }));
  }, [p3.totalMenuCost, p3.totalSpecialReqCost, p3.mobilizationCharge, p3.serviceCharge, p3.taxes]);

  // Auto-compute 40% amount as 40% of grand total
  useEffect(() => {
    const grand = parseFloat(p3.grandTotal) || 0;
    const amount = (grand * 0.4).toFixed(2);
    setP3((prev) => ({ ...prev, fortyPercentAmount: amount }));
  }, [p3.grandTotal]);

  // Auto-compute full payment amount as 60% of grand total
  useEffect(() => {
    const grand = parseFloat(p3.grandTotal) || 0;
    const amount = (grand * 0.6).toFixed(2);
    setP3((prev) => ({ ...prev, fullPaymentAmount: amount }));
  }, [p3.grandTotal]);

  // Validation functions
  const convertToUppercase = (value) => {
    return value.toUpperCase();
  };

  const validateEmail = (email) => {
    if (email.toUpperCase() === "N/A") return true;
    return email.includes("@gmail.com") || email.includes("@yahoo.com");
  };

  const validateFields = () => {
    const newErrors = {};

    if (p1.celebratorEmail && !validateEmail(p1.celebratorEmail)) {
      newErrors.celebratorEmail = "Email must end with @gmail.com or @yahoo.com";
    }
    if (p1.representativeEmail && !validateEmail(p1.representativeEmail)) {
      newErrors.representativeEmail = "Email must end with @gmail.com or @yahoo.com";
    }
    if (p1.coordinatorEmail && !validateEmail(p1.coordinatorEmail)) {
      newErrors.coordinatorEmail = "Email must end with @gmail.com or @yahoo.com";
    }

    if (p1.celebratorMobile && !/^\d{11}$/.test(p1.celebratorMobile)) {
      newErrors.celebratorMobile = "Mobile number must be 11 digits";
    }
    if (p1.representativeMobile && !/^\d{11}$/.test(p1.representativeMobile)) {
      newErrors.representativeMobile = "Mobile number must be 11 digits";
    }
    if (p1.coordinatorMobile && !/^\d{11}$/.test(p1.coordinatorMobile)) {
      newErrors.coordinatorMobile = "Mobile number must be 11 digits";
    }

    if (p1.celebratorLandline && !/^\d{7}$/.test(p1.celebratorLandline)) {
      newErrors.celebratorLandline = "Landline number must be 7 digits";
    }
    if (p1.representativeLandline && !/^\d{7}$/.test(p1.representativeLandline)) {
      newErrors.representativeLandline = "Landline number must be 7 digits";
    }
    if (p1.coordinatorLandline && !/^\d{7}$/.test(p1.coordinatorLandline)) {
      newErrors.coordinatorLandline = "Landline number must be 7 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateTimeField = (value) => {
    // Allow time format (HH:MM AM/PM) or "N/A"
    const time12Regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s?(AM|PM|am|pm)$/;
    const time24Regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const naRegex = /^N\/A$/i;
    
    if (value === "" || time12Regex.test(value) || time24Regex.test(value) || naRegex.test(value)) {
      return value.toUpperCase();
    }
    return value; // Return as-is if invalid (will show validation error)
  };

  const isTimeFieldValid = (value) => {
    if (value === "") return true; // Empty is allowed
    const time12Regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s?(AM|PM|am|pm)$/;
    const time24Regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const naRegex = /^N\/A$/i;
    return time12Regex.test(value) || time24Regex.test(value) || naRegex.test(value);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[0-9\-\(\)\s]+$/;
    return phoneRegex.test(phone);
  };

  const isFormValid = () => {
    // Check required fields in page1 (only those with asterisks)
    const requiredP1Fields = [
      'celebratorName',
      'representativeName',
      'representativeRelationship',
      'representativeEmail',
      'representativeAddress',
      'representativeMobile',
      'coordinatorName',
      'coordinatorMobile',
      'coordinatorEmail',
      'coordinatorAddress',
      'eventDate',
      'occasion',
      'serviceStyle',
      'venue',
      'hall',
      'address',
      'arrivalOfGuests',
      'ingressTime',
      'cocktailTime',
      'servingTime',
      'totalVIP',
      'totalRegular',
      'totalGuests',
      'themeSetup',
      'colorMotif',
      'vipTableType',
      'vipTableSeats',
      'vipTableQuantity',
      'regularTableType',
      'regularTableSeats',
      'regularTableQuantity',
      'vipUnderliner',
      'vipNapkin',
      'guestUnderliner',
      'guestNapkin',
    ];
    for (const field of requiredP1Fields) {
      if (!p1[field] || !p1[field].trim()) return false;
    }

    // Check required fields in page2 (chairs with asterisks)
    const requiredP2Fields = [
      'chairsMonoblock', 'chairsTiffany', 'chairsCrystal', 'chairsRustic', 'chairsKiddie', 'premiumChairs', 'totalChairs'
    ];
    for (const field of requiredP2Fields) {
      if (!p2[field] || !p2[field].trim()) return false;
    }

    // Check required fields in buffet page if Buffet
    if (p1.serviceStyle === "Buffet") {
      if (!pBuffet.selectedPackage) return false;
    }

    // Check required fields in page3 (only essential ones)
    const requiredP3Fields = [
      'pricePerPlate'
    ];
    for (const field of requiredP3Fields) {
      if (!p3[field] || !p3[field].trim()) return false;
    }

    return true;
  };

  const validateForm = () => {
    const newErrors = {};

    // Check required fields in page1
    const requiredP1Fields = [
      'celebratorName',
      'representativeName',
      'representativeRelationship',
      'representativeEmail',
      'representativeAddress',
      'representativeMobile',
      'coordinatorName',
      'coordinatorMobile',
      'coordinatorEmail',
      'coordinatorAddress',
      'eventDate',
      'occasion',
      'serviceStyle',
      'venue',
      'hall',
      'address',
      'arrivalOfGuests',
      'ingressTime',
      'cocktailTime',
      'servingTime',
      'totalVIP',
      'totalRegular',
      'totalGuests',
      'themeSetup',
      'colorMotif',
      'vipTableType',
      'vipTableSeats',
      'vipTableQuantity',
      'regularTableType',
      'regularTableSeats',
      'regularTableQuantity',
      'vipUnderliner',
      'vipNapkin',
      'guestUnderliner',
      'guestNapkin',
    ];
    for (const field of requiredP1Fields) {
      if (!p1[field] || !p1[field].trim()) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
      }
    }

    // Check required fields in page3
    const requiredP3Fields = [
      'pricePerPlate', 'totalMenuCost', 'totalSpecialReqCost', 'mobilizationCharge', 'taxes', 'serviceCharge', 'fortyPercentAmount', 'fullPaymentDueOn', 'fullPaymentAmount'
    ];
    for (const field of requiredP3Fields) {
      if (!p3[field] || !p3[field].trim()) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
      }
    }

    // Email validations
    if (p1.celebratorEmail && !validateEmail(p1.celebratorEmail)) {
      newErrors.celebratorEmail = "Email must end with @gmail.com or @yahoo.com";
    }
    if (p1.representativeEmail && !validateEmail(p1.representativeEmail)) {
      newErrors.representativeEmail = "Email must end with @gmail.com or @yahoo.com";
    }
    if (p1.coordinatorEmail && !validateEmail(p1.coordinatorEmail)) {
      newErrors.coordinatorEmail = "Email must end with @gmail.com or @yahoo.com";
    }

    // Phone validations
    if (p1.celebratorMobile && p1.celebratorMobile.toUpperCase() !== "N/A" && !/^\d{11}$/.test(p1.celebratorMobile)) {
      newErrors.celebratorMobile = "Mobile number must be 11 digits or N/A";
    }
    if (p1.celebratorLandline && p1.celebratorLandline.toUpperCase() !== "N/A" && !/^\d{7}$/.test(p1.celebratorLandline)) {
      newErrors.celebratorLandline = "Landline number must be 7 digits or N/A";
    }
    if (p1.representativeMobile && p1.representativeMobile.toUpperCase() !== "N/A" && !/^\d{11}$/.test(p1.representativeMobile)) {
      newErrors.representativeMobile = "Mobile number must be 11 digits or N/A";
    }
    if (p1.representativeLandline && p1.representativeLandline.toUpperCase() !== "N/A" && !/^\d{7}$/.test(p1.representativeLandline)) {
      newErrors.representativeLandline = "Landline number must be 7 digits or N/A";
    }
    if (p1.coordinatorMobile && p1.coordinatorMobile.toUpperCase() !== "N/A" && !/^\d{11}$/.test(p1.coordinatorMobile)) {
      newErrors.coordinatorMobile = "Mobile number must be 11 digits or N/A";
    }
    if (p1.coordinatorLandline && p1.coordinatorLandline.toUpperCase() !== "N/A" && !/^\d{7}$/.test(p1.coordinatorLandline)) {
      newErrors.coordinatorLandline = "Landline number must be 7 digits or N/A";
    }

    // Buffet validations
    if (p1.serviceStyle === "Buffet") {
      if (!pBuffet.selectedPackage) {
        newErrors.selectedPackage = "Please select a buffet package.";
      }
      if (pBuffet.cocktailSelections.length === 0) {
        newErrors.cocktailSelections = "Please select at least one cocktail hour option.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAutoSave = async () => {
    if (!existing) return; // Only auto-save for existing contracts

    try {
      const res = await fetch(`http://localhost:5000/contracts/${existing._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page1: p1, page2: p2, page3: p3 }),
      });
      if (!res.ok) {
        console.error("Auto-save failed");
      }
    } catch (error) {
      console.error("Auto-save error:", error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      if (existing) {
      const res = await fetch(`http://localhost:5000/contracts/${existing._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page1: p1, page2: p2, pageBuffet: pBuffet, page3: p3, status: "Draft" }),
      });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save contract");
        if (onCreated) {
          onCreated({
            id: data.contract._id,
            contractNumber: data.contract.contractNumber,
            name: p1.occasion || "Contract",
            client: p1.celebratorName || "",
            value: p3.grandTotal || "",
            startDate: p1.eventDate || "",
            endDate: p1.eventDate || "",
            status: "Draft",
          });
        }
        return true;
      } else {
        const payload = { department: "Sales", status: "Draft", page1: p1, page2: p2, pageBuffet: pBuffet, page3: p3 };
        const res = await fetch("http://localhost:5000/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save contract");
        if (onCreated) {
          onCreated({
            id: data.contract._id,
            contractNumber: data.contract.contractNumber,
            name: p1.occasion || "Contract",
            client: p1.celebratorName || "",
            value: p3.grandTotal || "",
            startDate: p1.eventDate || "",
            endDate: p1.eventDate || "",
            status: "Draft",
          });
        }
        return true;
      }
    } catch (err) {
      alert("Failed to save contract. Please try again.");
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      alert("Please fix validation errors");
      return;
    }

    try {
      if (existing) {
        const res = await fetch(`http://localhost:5000/contracts/${existing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page1: p1, page2: p2, pageBuffet: pBuffet, page3: p3, status: "For Approval" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update contract");
        if (onCreated) {
          onCreated({
            id: data.contract._id,
            contractNumber: data.contract.contractNumber,
            name: p1.occasion || "Contract",
            client: p1.celebratorName || "",
            value: p3.grandTotal || "",
            startDate: p1.eventDate || "",
            endDate: p1.eventDate || "",
            status: data.contract.status || "For Approval",
          });
        }
      } else {
        const payload = { department: "Sales", status: "For Approval", page1: p1, page2: p2, pageBuffet: pBuffet, page3: p3 };
        const res = await fetch("http://localhost:5000/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save contract");
        if (onCreated) {
          onCreated({
            id: data.contract._id,
            contractNumber: data.contract.contractNumber,
            name: p1.contractName || p1.occasion || "Contract",
            client: p1.celebratorName || "",
            value: p3.grandTotal || "",
            startDate: p1.eventDate || "",
            endDate: p1.eventDate || "",
            status: "For Approval",
          });
        }
      }
    } catch (err) {
      alert("Failed to submit contract. Please try again.");
    }
  };

  const next = () => {
    if (existing) handleAutoSave();
    setActivePage((p) => Math.min(totalPages, p + 1));
  };
  const back = () => {
    if (existing) handleAutoSave();
    setActivePage((p) => Math.max(1, p - 1));
  };

  // When page changes (Next/Back), scroll to top for better UX
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activePage]);

  const renderPage1 = () => (
    <div className="page">
      <div className="form-row">
        <div className="form-group">
          <label>Contract No.</label>
          <input type="text" value={nextNumber} readOnly />
        </div>
      </div>

      <h4>Celebrator</h4>
      <div className="form-row two">
        <div className="form-group"><label>
  Celebrator/Corporate Name 
  <span className="required-asterisk">*</span>
</label><input value={p1.celebratorName} onChange={(e)=>setP1({...p1, celebratorName:convertToUppercase(e.target.value)})} onBlur={handleAutoSave} /></div>
        <div className="form-group"><label>Email Address</label><input value={p1.celebratorEmail} onChange={(e)=>setP1({...p1, celebratorEmail:e.target.value})} className={errors.celebratorEmail ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.celebratorEmail}</div></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>Address</label><input value={p1.celebratorAddress} onChange={(e)=>setP1({...p1, celebratorAddress:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>Landline No.</label><input value={p1.celebratorLandline} onChange={(e)=>setP1({...p1, celebratorLandline:e.target.value})} className={errors.celebratorLandline ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.celebratorLandline}</div></div>
        <div className="form-group"><label>Mobile No.</label><input value={p1.celebratorMobile} onChange={(e)=>setP1({...p1, celebratorMobile:e.target.value})} className={errors.celebratorMobile ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.celebratorMobile}</div></div>
      </div>

      <h4>Representative</h4>
      <div className="form-row two">
        <div className="form-group"><label>
  Name 
  <span className="required-asterisk">*</span>
</label><input value={p1.representativeName} onChange={(e)=>setP1({...p1, representativeName:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>
  Relationship 
  <span className="required-asterisk">*</span>
</label><input value={p1.representativeRelationship} onChange={(e)=>setP1({...p1, representativeRelationship:convertToUppercase(e.target.value)})} /></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>
  Email Address 
  <span className="required-asterisk">*</span>
</label><input value={p1.representativeEmail} onChange={(e)=>setP1({...p1, representativeEmail:e.target.value})} className={errors.representativeEmail ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.representativeEmail}</div></div>
        <div className="form-group"><label>
  Address 
  <span className="required-asterisk">*</span>
</label><input value={p1.representativeAddress} onChange={(e)=>setP1({...p1, representativeAddress:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>Landline No.</label><input value={p1.representativeLandline} onChange={(e)=>setP1({...p1, representativeLandline:e.target.value})} className={errors.representativeLandline ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.representativeLandline}</div></div>
        </div>
      <div className="form-row two">
        <div className="form-group"><label>
  Mobile No. 
  <span className="required-asterisk">*</span>
</label><input value={p1.representativeMobile} onChange={(e)=>setP1({...p1, representativeMobile:e.target.value})} className={errors.representativeMobile ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.representativeMobile}</div></div>
      </div>

      <h4>Coordinator </h4>
      <div className="form-row three">
        <div className="form-group"><label>
  Coordinator Name 
  <span className="required-asterisk">*</span>
</label><input value={p1.coordinatorName} onChange={(e)=>setP1({...p1, coordinatorName:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>
  Mobile No. 
  <span className="required-asterisk">*</span>
</label><input value={p1.coordinatorMobile} onChange={(e)=>setP1({...p1, coordinatorMobile:e.target.value})} className={errors.coordinatorMobile ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.coordinatorMobile}</div></div>
        <div className="form-group"><label>Landline No.</label><input value={p1.coordinatorLandline} onChange={(e)=>setP1({...p1, coordinatorLandline:e.target.value})} className={errors.coordinatorLandline ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.coordinatorLandline}</div></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>
  Email Address 
  <span className="required-asterisk">*</span>
</label><input value={p1.coordinatorEmail} onChange={(e)=>setP1({...p1, coordinatorEmail:e.target.value})} className={errors.coordinatorEmail ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.coordinatorEmail}</div></div>
        <div className="form-group"><label>
  Address 
  <span className="required-asterisk">*</span>
</label><input value={p1.coordinatorAddress} onChange={(e)=>setP1({...p1, coordinatorAddress:convertToUppercase(e.target.value)})} /></div>
      </div>
      
      <h4>Event Details</h4>
      <div className="form-row three">
        <div className="form-group"><label>
  Date of Event
  <span className="required-asterisk">*</span>
</label><input type="date" value={p1.eventDate} onChange={(e)=>setP1({...p1, eventDate:e.target.value})} onBlur={handleAutoSave} className={errors.eventDate ? 'invalid-input' : ''} /><div className="validation-error">{errors.eventDate}</div></div>
        <div className="form-group">
          <label>
  Occasion
  <span className="required-asterisk">*</span>
</label>
          <select value={p1.occasion} onChange={(e)=>setP1({...p1, occasion:e.target.value})}>
            <option value="">Select Occasion</option>
            <option value="BIRTHDAY">Birthday</option>
            <option value="DEBUT">Debut</option>
            <option value="SPECIAL OCCASION">Special Occasion</option>
            <option value="CORPORATE">Corporate</option>
            <option value="WEDDINGS">Weddings</option>
          </select>
        </div>
        <div className="form-group">
          <label>
  Service Style
  <span className="required-asterisk">*</span>
</label>
          <select value={p1.serviceStyle} onChange={(e)=>setP1({...p1, serviceStyle:e.target.value})}>
            <option value="">Select Service Style</option>
            <option value="Buffet">Buffet</option>
            <option value="Signature Plated">Signature Plated</option>
          </select>
        </div>
      </div>
    <div className="form-row four">
      <div className="form-group">
        <label>
  Venue
  <span className="required-asterisk">*</span>
</label>
        <select
          value={p1.venue}
          onChange={(e) => {
            const venue = e.target.value;
            const venueData = VENUES[venue] || { address: "", halls: {} };
            setP1((prev) => ({
              ...prev,
              venue,
              address: venueData.address,
              hall: "",
            }));
            setAvailableHalls(Object.keys(venueData.halls));
            setMaxPax(0);
          }}
        >
          <option value="">Select Venue</option>
          {Object.keys(VENUES).map((venue) => (
            <option key={venue} value={venue}>
              {venue}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>
  Hall
  <span className="required-asterisk">*</span>
</label>
        {p1.venue === "OTHERS" ? (
          <input
            value={p1.hall}
            onChange={(e) => setP1({ ...p1, hall: e.target.value.toUpperCase() })}
          />
        ) : (
          <select
            value={p1.hall}
            onChange={(e) => {
              const hall = e.target.value;
              setP1((prev) => ({ ...prev, hall }));
              if (p1.venue && VENUES[p1.venue]) {
                const pax = VENUES[p1.venue].halls[hall] || 0;
                setMaxPax(pax);
                // Remove alert and rely on error message display instead
                // const totalGuestsNum = parseInt(p1.totalGuests) || 0;
                // if (totalGuestsNum > pax) {
                //   alert(`Warning: The selected hall cannot accommodate the total number of guests (${totalGuestsNum}). Maximum pax is ${pax}.`);
                // }
              }
            }}
          >
            <option value="">Select Hall</option>
            {availableHalls.map((hall) => (
              <option key={hall} value={hall}>
                {hall} ({VENUES[p1.venue].halls[hall]} pax)
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="form-group"><label>
  Address
  <span className="required-asterisk">*</span>
</label><input value={p1.address} onChange={(e)=>setP1({...p1, address:convertToUppercase(e.target.value)})} /></div>
      <div className="form-group">
        <label>
  Arrival of Guests
  <span className="required-asterisk">*</span>
</label>
        <input
          value={p1.arrivalOfGuests}
          onChange={(e) => setP1({...p1, arrivalOfGuests: validateTimeField(e.target.value)})}
          placeholder="HH:MM AM/PM or N/A"
          className={!isTimeFieldValid(p1.arrivalOfGuests) ? "invalid-input" : ""}
        />
        {!isTimeFieldValid(p1.arrivalOfGuests) && (
          <span className="validation-error">Please enter time in HH:MM AM/PM format or N/A</span>
        )}
      </div>
    </div>
    <div className="form-row three">
      <div className="form-group">
        <label>
  Ingress Time 
  <span className="required-asterisk">*</span>
</label>
        <input
          value={p1.ingressTime}
          onChange={(e) => setP1({ ...p1, ingressTime: validateTimeField(e.target.value) })}
          placeholder="HH:MM AM/PM or N/A"
          className={!isTimeFieldValid(p1.ingressTime) ? "invalid-input" : ""}
        />
        {!isTimeFieldValid(p1.ingressTime) && (
          <span className="validation-error">Please enter time in HH:MM AM/PM format or N/A</span>
        )}
      </div>
      <div className="form-group">
        <label>
  Cocktail Time 
  <span className="required-asterisk">*</span>
</label>
        <input
          value={p1.cocktailTime}
          readOnly
          placeholder="HH:MM AM/PM or N/A"
        />
      </div>
      <div className="form-group">
        <label>
  Serving Time 
  <span className="required-asterisk">*</span>
</label>
        <input
          value={p1.servingTime}
          onChange={(e) => setP1({ ...p1, servingTime: validateTimeField(e.target.value) })}
          placeholder="HH:MM AM/PM or N/A"
          className={!isTimeFieldValid(p1.servingTime) ? "invalid-input" : ""}
        />
        {!isTimeFieldValid(p1.servingTime) && (
          <span className="validation-error">Please enter time in HH:MM AM/PM format or N/A</span>
        )}
      </div>
    </div>
      <div className="form-row three">
        <div className="form-group"><label>
  VIP 
  <span className="required-asterisk">*</span>
</label><input value={p1.totalVIP} onChange={(e) => {
          const vipValue = e.target.value;
          setP1((prev) => {
            const newTotalVIP = vipValue;
            const newTotalRegular = prev.totalRegular;
            let newTotalGuests = prev.totalGuests;
            if (newTotalVIP && newTotalRegular) {
              const vipNum = parseInt(newTotalVIP) || 0;
              const regularNum = parseInt(newTotalRegular) || 0;
              newTotalGuests = (vipNum + regularNum).toString();
            }
            return { ...prev, totalVIP: newTotalVIP, totalGuests: newTotalGuests };
          });
        }} /></div>
        <div className="form-group"><label>
  Regular 
  <span className="required-asterisk">*</span>
</label><input value={p1.totalRegular} onChange={(e) => {
          const regularValue = e.target.value;
          setP1((prev) => {
            const newTotalRegular = regularValue;
            const newTotalVIP = prev.totalVIP;
            let newTotalGuests = prev.totalGuests;
            if (newTotalVIP && newTotalRegular) {
              const vipNum = parseInt(newTotalVIP) || 0;
              const regularNum = parseInt(newTotalRegular) || 0;
              newTotalGuests = (vipNum + regularNum).toString();
            }
            return { ...prev, totalRegular: newTotalRegular, totalGuests: newTotalGuests };
          });
        }} /></div>
        <div className="form-group">
          <label>
  Total No. of Guests 
  <span className="required-asterisk">*</span>
</label>
          <input value={p1.totalGuests} readOnly className={errors.totalGuests ? 'invalid-input' : ''} />
          {errors.totalGuests && <div className="validation-error">{errors.totalGuests}</div>}
        </div>
      </div>
      <div className="form-row four">
        <div className="form-group"><label>Kiddie Meal Plated</label><input value={p1.kiddiePlated} onChange={(e)=>setP1({...p1, kiddiePlated:e.target.value})} /></div>
        <div className="form-group"><label>Kiddie Meal Packed</label><input value={p1.kiddiePacked} onChange={(e)=>setP1({...p1, kiddiePacked:e.target.value})} /></div>
        <div className="form-group"><label>Crew Meal Plated</label><input value={p1.crewPlated} onChange={(e)=>setP1({...p1, crewPlated:e.target.value})} /></div>
        <div className="form-group"><label>Crew Meal Packed</label><input value={p1.crewPacked} onChange={(e)=>setP1({...p1, crewPacked:e.target.value})} /></div>
      </div>

      <h4>Set Up</h4>
      <div className="form-row two">
        <div className="form-group"><label>
  Theme Set-up 
  <span className="required-asterisk">*</span>
</label><input value={p1.themeSetup} onChange={(e)=>setP1({...p1, themeSetup:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>
  Color Motif 
  <span className="required-asterisk">*</span>
</label><input value={p1.colorMotif} onChange={(e)=>setP1({...p1, colorMotif:convertToUppercase(e.target.value)})} /></div>
      </div>
      <div className="form-row four">
        <div className="form-group">
          <label>
  VIP Table Type 
  <span className="required-asterisk">*</span>
</label>
          <select value={p1.vipTableType} onChange={(e)=>setP1({...p1, vipTableType:e.target.value})}>
            <option value="">Select Type</option>
            <option value="Round Table">Round Table</option>
            <option value="Rectangle Table">Rectangle Table</option>
            <option value="Big Round Table">Big Round Table</option>
            <option value="Long Rectangle Table">Long Rectangle Table</option>
          </select>
        </div>
        <div className="form-group">
          <label>
  VIP Seats per Table 
  <span className="required-asterisk">*</span>
</label>
          <input value={p1.vipTableSeats ? `${p1.vipTableSeats} Seater` : ''} readOnly />
        </div>
        <div className="form-group">
          <label>
  VIP Table Quantity 
  <span className="required-asterisk">*</span>
</label>
          <input type="number" value={p1.vipTableQuantity} onChange={(e)=>setP1({...p1, vipTableQuantity:e.target.value})} />
        </div>
        <div className="form-group">
          <label>
  Regular Table Type 
  <span className="required-asterisk">*</span>
</label>
          <select value={p1.regularTableType} onChange={(e)=>setP1({...p1, regularTableType:e.target.value})}>
            <option value="">Select Type</option>
            <option value="Round Table">Round Table</option>
            <option value="Rectangle Table">Rectangle Table</option>
            <option value="Big Round Table">Big Round Table</option>
            <option value="Long Rectangle Table">Long Rectangle Table</option>
          </select>
        </div>
      </div>
      <div className="form-row two">
        <div className="form-group">
          <label>
  Regular Seats per Table 
  <span className="required-asterisk">*</span>
</label>
          <input value={p1.regularTableSeats ? `${p1.regularTableSeats} Seater` : ''} readOnly />
        </div>
        <div className="form-group">
          <label>
  Regular Table Quantity 
  <span className="required-asterisk">*</span>
</label>
          <input type="number" value={p1.regularTableQuantity} onChange={(e)=>setP1({...p1, regularTableQuantity:e.target.value})} />
        </div>
      </div>

      <div className="form-row three">
        <div className="form-group"><label>
  VIP Underliner 
  <span className="required-asterisk">*</span>
</label><input value={p1.vipUnderliner} onChange={(e)=>setP1({...p1, vipUnderliner:e.target.value})} /></div>
        <div className="form-group"><label>VIP Topper</label><input value={p1.vipTopper} onChange={(e)=>setP1({...p1, vipTopper:e.target.value})} /></div>
        <div className="form-group"><label>
  VIP Napkin 
  <span className="required-asterisk">*</span>
</label><input value={p1.vipNapkin} onChange={(e)=>setP1({...p1, vipNapkin:e.target.value})} /></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>
  Guest Underliner 
  <span className="required-asterisk">*</span>
</label><input value={p1.guestUnderliner} onChange={(e)=>setP1({...p1, guestUnderliner:e.target.value})} /></div>
        <div className="form-group"><label>Guest Topper</label><input value={p1.guestTopper} onChange={(e)=>setP1({...p1, guestTopper:e.target.value})} /></div>
        <div className="form-group"><label>
  Guest Napkin 
  <span className="required-asterisk">*</span>
</label><input value={p1.guestNapkin} onChange={(e)=>setP1({...p1, guestNapkin:e.target.value})} /></div>
      </div>
      <div className="form-group"><label>Remarks</label><textarea value={p1.setupRemarks} onChange={(e)=>setP1({...p1, setupRemarks:e.target.value})} /></div>
    </div>
  );

  const renderPage2 = () => (
    <div className="page">
      <h4>Chairs</h4>
      <div className="form-row five">
        <div className="form-group"><label>Monoblock <span className="required-asterisk">*</span></label><input value={p2.chairsMonoblock} onChange={(e)=>setP2({...p2, chairsMonoblock:e.target.value})} /></div>
        <div className="form-group"><label>Rustic <span className="required-asterisk">*</span></label><input value={p2.chairsRustic} onChange={(e)=>setP2({...p2, chairsRustic:e.target.value})} /></div>
        <div className="form-group"><label>Tiffany <span className="required-asterisk">*</span></label><input value={p2.chairsTiffany} onChange={(e)=>setP2({...p2, chairsTiffany:e.target.value})} /></div>
        <div className="form-group"><label>Premium <span className="required-asterisk">*</span></label><input value={p2.premiumChairs} onChange={(e)=>setP2({...p2, premiumChairs:e.target.value})} /></div>
        <div className="form-group"><label>Crystal <span className="required-asterisk">*</span></label><input value={p2.chairsCrystal} onChange={(e)=>setP2({...p2, chairsCrystal:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Kiddie <span className="required-asterisk">*</span></label><input value={p2.chairsKiddie} onChange={(e)=>setP2({...p2, chairsKiddie:e.target.value})} /></div>
        <div className="form-group"><label>Total Chairs <span className="required-asterisk">*</span></label><input value={p2.totalChairs} readOnly /></div>
      </div>
      {errors.chairsSum && <div className="validation-error">{errors.chairsSum}</div>}
      <div className="form-group"><label>Remarks</label><textarea value={p2.chairsRemarks} onChange={(e)=>setP2({...p2, chairsRemarks:convertToUppercase(e.target.value)})} /></div>

      <h4>Flower Arrangement</h4>
      <div className="form-row two">
        <div className="form-group"><label>Backdrop</label><input value={p2.flowerBackdrop} onChange={(e)=>setP2({...p2, flowerBackdrop:e.target.value})} /></div>
        <div className="form-group"><label>VIP Centerpiece</label><input value={p2.flowerVipCenterpiece} onChange={(e)=>setP2({...p2, flowerVipCenterpiece:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Guest Centerpiece</label><input value={p2.flowerGuestCenterpiece} onChange={(e)=>setP2({...p2, flowerGuestCenterpiece:e.target.value})} /></div>
        <div className="form-group"><label>Cake Table</label><input value={p2.flowerCakeTable} onChange={(e)=>setP2({...p2, flowerCakeTable:e.target.value})} /></div>
      </div>
      <div className="form-group"><label>Remarks</label><textarea value={p2.flowerRemarks} onChange={(e)=>setP2({...p2, flowerRemarks:e.target.value})} /></div>

      <h4>Other Special Requirements</h4>
      <div className="form-row two">
        <div className="form-group"><label>Cake Name/Code</label><input value={p2.cakeNameCode} onChange={(e)=>setP2({...p2, cakeNameCode:e.target.value})} /></div>
        <div className="form-group"><label>Flavor</label><input value={p2.cakeFlavor} onChange={(e)=>setP2({...p2, cakeFlavor:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Supplier</label><input value={p2.cakeSupplier} onChange={(e)=>setP2({...p2, cakeSupplier:e.target.value})} /></div>
        <div className="form-group"><label>Cake Specifications</label><input value={p2.cakeSpecifications} onChange={(e)=>setP2({...p2, cakeSpecifications:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Celebrator's Car</label><input value={p2.celebratorsCar} onChange={(e)=>setP2({...p2, celebratorsCar:e.target.value})} /></div>
        <div className="form-group"><label>Emcee</label><input value={p2.emcee} onChange={(e)=>setP2({...p2, emcee:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Sound System</label><input value={p2.soundSystem} onChange={(e)=>setP2({...p2, soundSystem:e.target.value})} /></div>
        <div className="form-group"><label>Tent</label><input value={p2.tent} onChange={(e)=>setP2({...p2, tent:e.target.value})} /></div>
      </div>
      <div className="form-group"><label>Celebrator's Chair</label><input value={p2.celebratorsChair} onChange={(e)=>setP2({...p2, celebratorsChair:e.target.value})} /></div>
    
      <h4>How did you know our company? <span className="required-asterisk">*</span></h4>
      <div className="checkbox-grid">
        {[
          ["knowUsWebsite","Website"],
          ["knowUsFacebook","Facebook"],
          ["knowUsInstagram","Instagram"],
          ["knowUsFlyers","Flyers"],
          ["knowUsBillboard","Billboard Ad"],
          ["knowUsWordOfMouth","Word of Mouth"],
          ["knowUsVenueReferral","Venue Referral"],
          ["knowUsRepeatClient","Repeat Client"],
          ["knowUsBridalFair","Bridal Fair / Exhibit"],
          ["knowUsFoodTasting","Food Tasting"],
          ["knowUsCelebrityReferral","Celebrity Referral"],
          ["knowUsOthers","Others"],
        ].map(([key, label]) => (
          <label key={key} className="checkbox-item">
            <input type="checkbox" checked={p2[key]} onChange={(e)=>setP2({...p2, [key]: e.target.checked})} /> {label}
          </label>
        ))}
      </div>
    </div>
  );

  const renderPage3 = () => {
  if (p1.serviceStyle !== "Buffet") return null;

  const handlePackageSelect = (packageName) => {
    setPBuffet(prev => ({ ...prev, selectedPackage: packageName }));
  };

  const packages = [
    {
      name: "Buffet Package 1",
      option: "BUFFET PACKAGE 1",
      pricing: [
        { pax: "300 pax", price: "2,145.00" },
        { pax: "250 pax", price: "2,200.00" },
        { pax: "200 pax", price: "2,275.00" },
        { pax: "150 pax", price: "2,390.00" },
        { pax: "100 pax", price: "2,800.00" }
      ],
      menu: [
        "Two Cocktail Hours",
        "One Soup",
        {
          title: "Main Entree",
          choiceOf: "Choice of:",
          items: [
            "Beef or Pork",
            "Fish or Seafood",
            "Chicken",
            "Pasta or Noodles or Vegetables or Side Dish"
          ]
        },
        "Rice",
        "One Dessert",
        "Two Drinks"
      ]
    },
    {
      name: "Buffet Package 2",
      option: "BUFFET PACKAGE 2",
      pricing: [
        { pax: "300 pax", price: "2,245.00" },
        { pax: "250 pax", price: "2,295.00" },
        { pax: "200 pax", price: "2,370.00" },
        { pax: "150 pax", price: "2,475.00" },
        { pax: "100 pax", price: "2,890.00" }
      ],
      menu: [
        "Two Cocktail Hours",
        "One Soup",
        {
          title: "Main Entree",
          choiceOf: "Choice of:",
          items: [
            "Beef or Pork",
            "Fish or Seafood",
            "Chicken",
            "Pasta or Noodles",
            "Vegetables or Side Dish"
          ]
        },
        "Rice",
        "Two Desserts",
        "Two Drinks"
      ]
    },
    {
      name: "Buffet Package 3",
      option: "BUFFET PACKAGE 3",
      pricing: [
        { pax: "300 pax", price: "2,380.00" },
        { pax: "250 pax", price: "2,435.00" },
        { pax: "200 pax", price: "2,510.00" },
        { pax: "150 pax", price: "2,610.00" },
        { pax: "100 pax", price: "3,030.00" }
      ],
      menu: [
        "Two Cocktail Hours",
        "One Soup",
        {
          title: "Main Entree",
          choiceOf: "Choice of:",
          items: [
            "Beef",
            "Pork",
            "Fish or Seafood",
            "Chicken",
            "Pasta or Noodles",
            "Vegetables or Side Dish"
          ]
        },
        "Rice",
        "Two Desserts",
        "Two Drinks"
      ]
    }
  ];

  const amenities = [
    "An elevated platform for the couple/celebrant",
    "A wide array of linens to match your color palette",
    "Tiffany chairs or rustic folding chairs for style and elegance (to check availability upon confirmation)",
    "Elegantly dressed up dining tables with table numbers",
    "Table setting and physical arrangement meticulously done by professionals",
    "Buffet with food labels that is set to impress",
    "Exquisitely dress-up tables for gifts, cake, registration and giveaways",
    "A bottle of Sparkling Wine for the bridal toast to spice up the celebration",
    "Debut Amenities (18 roses, 18 candles, and a Bouquet for the Debutant)",
    "Cordial and professional waiters to serve the food"
  ];

  return (
    <div className="page buffet-page">
      <div className="buffet-container">
        
        {/* Package Cards */}
        <div className="buffet-packages-wrapper">
          {packages.map((pkg, idx) => (
            <div
              key={idx}
              className={`buffet-package-card ${pBuffet.selectedPackage === pkg.name ? 'selected' : ''}`}
              onClick={() => handlePackageSelect(pkg.name)}
            >
              {/* Header */}
              <div className="buffet-package-header">
                <h2 className="buffet-option-title">{pkg.option}</h2>
              </div>

              {/* Content */}
              <div className="buffet-package-content">
                {/* Price per Pax */}
                <div className="buffet-section">
                  <h3 className="buffet-section-title">price per pax</h3>
                  <div className="buffet-pricing-list">
                    {pkg.pricing.map((item, i) => (
                      <div key={i} className="buffet-price-item">
                        <strong>₱ {item.price}</strong> per pax
                      </div>
                    ))}
                  </div>
                </div>

                {/* Minimum of */}
                <div className="buffet-section">
                  <h3 className="buffet-section-title">minimum of</h3>
                  <div className="buffet-pricing-list">
                    {pkg.pricing.map((item, i) => (
                      <div key={i} className="buffet-price-item">
                        {item.pax}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Menu Inclusions */}
                <div className="buffet-section">
                  <h3 className="buffet-section-title">Menu inclusions:</h3>
                  <div className="buffet-menu-list">
                    {pkg.menu.map((item, i) => {
                      if (typeof item === 'object' && item.title) {
                        return (
                          <div key={i} className="buffet-menu-item">
                            <div className="buffet-menu-subheader">{item.title}</div>
                            <div className="buffet-menu-choice">{item.choiceOf}</div>
                            <ul className="buffet-menu-items">
                              {item.items.map((subItem, j) => (
                                <li key={j}>{subItem}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                      return (
                        <div key={i} className="buffet-menu-item">{item}</div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="buffet-package-footer">
                <p className="buffet-vat-notice">
                  Plus 10% Service Charge<br />
                  Exclusive of 12% VAT
                </p>
                <label className="buffet-select-label" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="radio"
                    name="package"
                    checked={pBuffet.selectedPackage === pkg.name}
                    onChange={() => handlePackageSelect(pkg.name)}
                    className="buffet-radio"
                  />
                  <span className="buffet-select-text">
                    {pBuffet.selectedPackage === pkg.name ? '✓ Selected' : `Select ${pkg.option}`}
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Amenities Section */}
        <div className="buffet-amenities-card">
          <div className="buffet-amenities-header">
            <h2 className="buffet-option-title">PACKAGE AMENITIES</h2>
          </div>

          <div className="buffet-amenities-content">
            <div className="buffet-amenities-grid">
              {amenities.map((amenity, idx) => (
                <div key={idx} className="buffet-amenity-item">
                  <span className="buffet-bullet">•</span>
                  <p className="buffet-amenity-text">{amenity}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Error */}
      {errors.selectedPackage && (
        <div className="buffet-validation-error">
          <strong> {errors.selectedPackage}</strong>
        </div>
      )}
    </div>
  );
};

  const renderPage4 = () => {
    if (p1.serviceStyle !== "Buffet") return null;

    const handleCocktailChange = (option) => {
      setPBuffet(prev => {
        const selections = prev.cocktailSelections.includes(option)
          ? prev.cocktailSelections.filter(s => s !== option)
          : prev.cocktailSelections.length < 2 ? [...prev.cocktailSelections, option] : prev.cocktailSelections;
        return { ...prev, cocktailSelections: selections };
      });
    };

    return (
      <div className="page">
        <h4>Cocktail Hour (Select up to 2)</h4>
        <div className="cocktail-grid">
          {[
            "Money Bag with Pork, Shrimp & Leeks",
            "Wrap Pork Sisig/Wrap Ala Portofino",
            "Pork Belly with Chili Caramel Sauce",
            "Cone of Caesar Salad with Bacon Bits and Anchovy Croutons",
            "Palabok Spring Rolls with Dried Smoked Fish and Salted Egg"
          ].map(option => (
            <label key={option} className="cocktail-item">
              <input
                type="checkbox"
                checked={pBuffet.cocktailSelections.includes(option)}
                onChange={() => handleCocktailChange(option)}
                disabled={!pBuffet.cocktailSelections.includes(option) && pBuffet.cocktailSelections.length >= 2}
              />
              {option}
            </label>
          ))}
        </div>
        <p>Selected: {pBuffet.cocktailSelections.length}/2</p>
      </div>
    );
  };

  const renderPage5 = () => (
    <div className="page">
      <div className="form-group"><label>Price Per Plate <span className="required-asterisk">*</span></label><input value={p3.pricePerPlate} onChange={(e)=>setP3({...p3, pricePerPlate:e.target.value})} /></div>

      <h4>Menu Details</h4>
      <div className="form-group">
        <label>Cocktail Hour</label>
        <textarea 
          value={p3.cocktailHour} 
          onChange={(e)=>setP3({...p3, cocktailHour:convertToUppercase(e.target.value)})} 
          rows={3}
          placeholder="Enter cocktail hour details..."
        />
      </div>
      <div className="form-group">
        <label>Appetizer</label>
        <textarea 
          value={p3.appetizer} 
          onChange={(e)=>setP3({...p3, appetizer:convertToUppercase(e.target.value)})} 
          rows={3}
          placeholder="Enter appetizer details..."
        />
      </div>
      <div className="form-group">
        <label>Soup</label>
        <textarea 
          value={p3.soup} 
          onChange={(e)=>setP3({...p3, soup:convertToUppercase(e.target.value)})} 
          rows={3}
          placeholder="Enter soup details..."
        />
      </div>
      <div className="form-group">
        <label>Bread</label>
        <textarea 
          value={p3.bread} 
          onChange={(e)=>setP3({...p3, bread:convertToUppercase(e.target.value)})} 
          rows={3}
          placeholder="Enter bread details..."
        />
      </div>
      <div className="form-group">
        <label>Salad</label>
        <textarea 
          value={p3.salad} 
          onChange={(e)=>setP3({...p3, salad:convertToUppercase(e.target.value)})} 
          rows={3}
          placeholder="Enter salad details..."
        />
      </div>
      <div className="form-group">
        <label>Main Entrée</label>
        <textarea 
          value={p3.mainEntree} 
          onChange={(e)=>setP3({...p3, mainEntree:convertToUppercase(e.target.value)})} 
          rows={9}
          placeholder="Enter main entrée details..."
        />
      </div>
      <div className="form-group">
        <label>Dessert</label>
        <textarea 
          value={p3.dessert} 
          onChange={(e)=>setP3({...p3, dessert:convertToUppercase(e.target.value)})} 
          rows={3}
          placeholder="Enter dessert details..."
        />
      </div>
      <div className="form-group">
        <label>Cake Name</label>
        <textarea 
          value={p3.cakeName} 
          onChange={(e)=>setP3({...p3, cakeName:convertToUppercase(e.target.value)})} 
          rows={3}
          placeholder="Enter cake name and details..."
        />
      </div>
      <div className="form-group">
        <label>Kids Meal</label>
        <textarea 
          value={p3.kidsMeal} 
          onChange={(e)=>setP3({...p3, kidsMeal:convertToUppercase(e.target.value)})} 
          rows={3}
          placeholder="Enter kids meal details..."
        />
      </div>
      <div className="form-group">
        <label>Crew Meal</label>
        <textarea 
          value={p3.crewMeal} 
          onChange={(e)=>setP3({...p3, crewMeal:convertToUppercase(e.target.value)})} 
          rows={3}
          placeholder="Enter crew meal details..."
        />
      </div>
      <div className="form-group">
        <label>Drinks at Cocktail</label>
        <textarea 
          value={p3.drinksCocktail} 
          onChange={(e)=>setP3({...p3, drinksCocktail:convertToUppercase(e.target.value)})} 
          rows={3}
          placeholder="Enter drinks at cocktail details..."
        />
      </div>
      <div className="form-group">
        <label>Drinks at Meal</label>
        <textarea 
          value={p3.drinksMeal} 
          onChange={(e)=>setP3({...p3, drinksMeal:convertToUppercase(e.target.value)})} 
          rows={3}
          placeholder="Enter drinks at meal details..."
        />
      </div>
      <div className="form-row two">
        <div className="form-group">
          <label>Roasted Pig</label>
          <textarea 
            value={p3.roastedPig} 
            onChange={(e)=>setP3({...p3, roastedPig:convertToUppercase(e.target.value)})} 
            rows={2}
            placeholder="Enter roasted pig details..."
          />
        </div>
        <div className="form-group">
          <label>Roasted Calf</label>
          <textarea 
            value={p3.roastedCalf} 
            onChange={(e)=>setP3({...p3, roastedCalf:convertToUppercase(e.target.value)})} 
            rows={2}
            placeholder="Enter roasted calf details..."
          />
        </div>
      </div>

      <h4>Total Cash Layout</h4>
      <div className="form-group">
        <label>Total Menu Cost <span className="required-asterisk">*</span></label>
        <input value={formatNumber(p3.totalMenuCost)} readOnly />
      </div>
      <div className="form-group">
        <label>Total Special Requirements Cost <span className="required-asterisk">*</span></label>
        <input value={p3.totalSpecialReqCost} onChange={(e)=>setP3({...p3, totalSpecialReqCost:e.target.value})} />
      </div>
      <div className="form-group">
        <label>Mobilization Charge <span className="required-asterisk">*</span></label>
        <input value={p3.mobilizationCharge} onChange={(e)=>setP3({...p3, mobilizationCharge:e.target.value})} />
      </div>
      <div className="form-group">
        <label>TAX (12% VAT) <span className="required-asterisk">*</span></label>
        <input value={formatNumber(p3.taxes)} readOnly />
      </div>
      <div className="form-group">
        <label>Service Charge (10%) <span className="required-asterisk">*</span></label>
        <input value={formatNumber(p3.serviceCharge)} readOnly />
      </div>
      <div className="form-group">
        <label>Grand Total <span className="required-asterisk">*</span></label>
        <input value={formatNumber(p3.grandTotal)} readOnly />
      </div>

      <h4>Payment Details</h4>
      
      <h5>Downpayment (40%)</h5>
      <div className="form-row two">
        <div className="form-group"><label>Downpayment Due On</label><input type="date" value={p3.fortyPercentDueOn} onChange={(e)=>setP3({...p3, fortyPercentDueOn:e.target.value})} /></div>
        <div className="form-group"><label>Downpayment Amount <span className="required-asterisk">*</span></label><input value={formatNumber(p3.fortyPercentAmount)} readOnly /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Downpayment Received by</label><input value={p3.fortyPercentReceivedBy} onChange={(e)=>setP3({...p3, fortyPercentReceivedBy:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>Downpayment Date Received</label><input type="date" value={p3.fortyPercentDateReceived} onChange={(e)=>setP3({...p3, fortyPercentDateReceived:e.target.value})} /></div>
      </div>

      <h5>Full Payment</h5>
      <div className="form-row two">
        <div className="form-group"><label>Remaining Balance Due On <span className="required-asterisk">*</span></label><input type="date" value={p3.fullPaymentDueOn} onChange={(e)=>setP3({...p3, fullPaymentDueOn:e.target.value})} /></div>
        <div className="form-group"><label>Remaining Balance Amount <span className="required-asterisk">*</span></label><input value={formatNumber(p3.fullPaymentAmount)} readOnly /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Remaining Balance Received By</label><input value={p3.fullPaymentReceivedBy} onChange={(e)=>setP3({...p3, fullPaymentReceivedBy:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>Remaining Balance Date Received <span className="required-asterisk">*</span></label><input type="date" value={p3.fullPaymentDateReceived} onChange={(e)=>setP3({...p3, fullPaymentDateReceived:e.target.value})} /></div>
      </div>

      <div className="form-group"><label>Remarks</label><textarea value={p3.remarks} onChange={(e)=>setP3({...p3, remarks:e.target.value})} /></div>
    </div>
  );

  return (
    <div className="contract-form">
      <div className="form-header">
        <h3>Contract {existing ? "(Edit)" : "(New)"}</h3>
        {nextNumber && <div className="number">No.: {nextNumber}</div>}
      </div>

      <form onKeyDown={(e) => { 
        // Allow Enter key in textarea fields, prevent it in other form elements
        if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") { 
          e.preventDefault(); 
        } 
      }}>
        {activePage === 1 && renderPage1()}
        {activePage === 2 && renderPage2()}
        {activePage === 3 && (totalPages === 3 ? renderPage5() : renderPage3())}
        {activePage === 4 && (totalPages === 5 ? renderPage4() : renderPage5())}
        {activePage === 5 && renderPage5()}

      <div className="form-actions">
        <button type="button" className="btn-danger" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn-secondary" onClick={async () => {
          // Save form as draft before going back
          const success = await handleSave(new Event('submit', { cancelable: true }));
          if (success) onCancel();
        }}>Back to Dashboard</button>

        <div className="pager">
          <button type="button" className="pager-btn" onClick={back} disabled={activePage === 1}>← Back</button>
          <span>Page {activePage} of {totalPages}</span>
          {activePage < totalPages ? (
            <button type="button" className="pager-btn" onClick={next}>Next →</button>
          ) : (
            <>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSubmit}
                disabled={!isFormValid()}
              >
                Send for Approval
              </button>
              {!isFormValid() && <div className="validation-error">Please fill all required fields marked with *.</div>}
            </>
          )}
        </div>
      </div>
      </form>
    </div>
  );
}

export default ContractForm;


