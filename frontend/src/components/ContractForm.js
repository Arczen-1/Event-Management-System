import React, { useEffect, useState } from "react";
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
  const [activePage, setActivePage] = useState(1); // 1, 2, 3
  const [nextNumber, setNextNumber] = useState("");
  const [availableHalls, setAvailableHalls] = useState([]);
  const [maxPax, setMaxPax] = useState(0);
  const [errors, setErrors] = useState({});

  // Page 1 fields
  const [p1, setP1] = useState({
    date: "",
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
    totalTables: "",
    totalChairs: "",
    vipUnderliner: "",
    vipTopper: "",
    vipNapkin: "",
    guestUnderliner: "",
    guestTopper: "",
    guestNapkin: "",
    setupRemarks: "",
    buffetStandard: "",
    buffetUpgraded: "",
    buffetPremium: "",
    buffetBarrel: "",
    buffetOval: "",
    buffetRemarks: "",
  });

  // Page 2 fields
  const [p2, setP2] = useState({
    chairsMonoblock: "",
    chairsTiffany: "",
    chairsCrystal: "",
    chairsRustic: "",
    chairsKiddie: "",
    premiumChairs: "",
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

  // Page 3 fields
  const [p3, setP3] = useState({
    pricePerPlate: "",
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
    totalMenuCost: "",
    totalSpecialReqCost: "",
    outOfServiceAreaCharge: "",
    mobilizationCharge: "",
    taxes: "",
    grandTotal: "",
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

  // Initialize for create vs edit
  useEffect(() => {
    if (existing) {
      setP1(existing.page1 || {});
      setP2(existing.page2 || {});
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

  // Auto-compute ingress time (10 hours before serving time)
  useEffect(() => {
    if (p1.servingTime && isTimeFieldValid(p1.servingTime)) {
      // Parse time string HH:MM AM/PM
      const timeParts = p1.servingTime.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
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
  }, [p1.servingTime]);

  // Auto-compute total tables
  useEffect(() => {
    const vipTables = parseInt(p1.vipTableQuantity) || 0;
    const regularTables = parseInt(p1.regularTableQuantity) || 0;
    const total = vipTables + regularTables + 1; // +1 for 10 guests
    setP1(prev => ({ ...prev, totalTables: total.toString() }));
  }, [p1.vipTableQuantity, p1.regularTableQuantity]);

  // Auto-compute total chairs
  useEffect(() => {
    const totalGuests = parseInt(p1.totalGuests) || 0;
    const total = totalGuests + 10;
    setP1(prev => ({ ...prev, totalChairs: total.toString() }));
  }, [p1.totalGuests]);

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

  // Auto-set VIP Seats per Table based on VIP Table Type
  useEffect(() => {
    let seats = "";
    if (p1.vipTableType === "Round Table") seats = "8";
    else if (p1.vipTableType === "Big Round Table") seats = "10";
    else if (p1.vipTableType === "Rectangle Table") seats = "6";
    else if (p1.vipTableType === "Long Rectangle Table") seats = "8";
    setP1(prev => ({ ...prev, vipTableSeats: seats }));
  }, [p1.vipTableType]);

  // Auto-compute VIP Table Quantity based on totalVIP and VIP Seats per Table
  useEffect(() => {
    const totalVIPNum = parseInt(p1.totalVIP) || 0;
    const seatsNum = parseInt(p1.vipTableSeats) || 0;
    if (seatsNum > 0) {
      const quantity = Math.ceil(totalVIPNum / seatsNum);
      setP1(prev => ({ ...prev, vipTableQuantity: quantity.toString() }));
    }
  }, [p1.totalVIP, p1.vipTableSeats]);

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
    // Check conditional requirements for representative
    const isNA = (value) => value && value.trim().toUpperCase() === 'N/A';
    const celebratorContactsNA = isNA(p1.celebratorEmail) || isNA(p1.celebratorAddress) || isNA(p1.celebratorMobile);
    if (celebratorContactsNA) {
      if (!p1.representativeName || !p1.representativeName.trim()) return false;
      if (!p1.representativeRelationship || !p1.representativeRelationship.trim()) return false;
      if (!p1.representativeEmail || p1.representativeEmail.trim().toUpperCase() === 'N/A') return false;
      if (!p1.representativeAddress || p1.representativeAddress.trim().toUpperCase() === 'N/A') return false;
      if (!p1.representativeMobile || p1.representativeMobile.trim().toUpperCase() === 'N/A') return false;
    }

    // Check all string fields in page1 are filled (excluding computed fields)
    const requiredP1Fields = [
      'date', 'celebratorName', 'celebratorAddress', 'celebratorLandline', 'celebratorMobile', 'celebratorEmail',
      'coordinatorName', 'coordinatorMobile', 'coordinatorLandline', 'coordinatorAddress', 'coordinatorEmail',
      'eventDate', 'occasion', 'venue', 'hall', 'ingressTime', 'cocktailTime', 'address', 'arrivalOfGuests', 'servingTime',
      'totalVIP', 'totalRegular', 'kiddiePlated', 'kiddiePacked', 'crewPlated', 'crewPacked',
      'themeSetup', 'colorMotif', 'vipTableType', 'regularTableType', 'vipTableSeats', 'regularTableSeats', 'vipTableQuantity', 'regularTableQuantity',
      'vipUnderliner', 'vipTopper', 'vipNapkin', 'guestUnderliner', 'guestTopper', 'guestNapkin', 'setupRemarks',
      'buffetStandard', 'buffetUpgraded', 'buffetPremium', 'buffetBarrel', 'buffetOval', 'buffetRemarks'
    ];
    for (const field of requiredP1Fields) {
      if (!p1[field] || !p1[field].trim()) return false;
    }

    // Additional check: celebrator name cannot be N/A
    if (p1.celebratorName && p1.celebratorName.trim().toUpperCase() === 'N/A') return false;

    // Email validations
    if (!validateEmail(p1.celebratorEmail)) return false;
    if (!validateEmail(p1.representativeEmail)) return false;
    if (!validateEmail(p1.coordinatorEmail)) return false;

    // Phone validations
    if (p1.celebratorMobile.toUpperCase() !== "N/A" && !/^\d{11}$/.test(p1.celebratorMobile)) return false;
    if (p1.celebratorLandline.toUpperCase() !== "N/A" && !/^\d{7}$/.test(p1.celebratorLandline)) return false;
    if (p1.representativeMobile.toUpperCase() !== "N/A" && !/^\d{11}$/.test(p1.representativeMobile)) return false;
    if (p1.representativeLandline.toUpperCase() !== "N/A" && !/^\d{7}$/.test(p1.representativeLandline)) return false;
    if (p1.coordinatorMobile.toUpperCase() !== "N/A" && !/^\d{11}$/.test(p1.coordinatorMobile)) return false;
    if (p1.coordinatorLandline.toUpperCase() !== "N/A" && !/^\d{7}$/.test(p1.coordinatorLandline)) return false;

    // Check all string fields in page2 are filled, skip booleans
    const requiredP2Fields = [
      'chairsMonoblock', 'chairsTiffany', 'chairsCrystal', 'chairsRustic', 'chairsKiddie', 'premiumChairs', 'chairsRemarks',
      'flowerBackdrop', 'flowerGuestCenterpiece', 'flowerVipCenterpiece', 'flowerCakeTable', 'flowerRemarks',
      'cakeNameCode', 'cakeFlavor', 'cakeSupplier', 'cakeSpecifications', 'celebratorsCar', 'emcee', 'soundSystem', 'tent', 'celebratorsChair'
    ];
    for (const field of requiredP2Fields) {
      if (!p2[field] || !p2[field].trim()) return false;
    }

    // Check all string fields in page3 are filled
    const requiredP3Fields = [
      'pricePerPlate', 'cocktailHour', 'appetizer', 'soup', 'bread', 'salad', 'mainEntree', 'dessert', 'cakeName', 'kidsMeal', 'crewMeal',
      'drinksCocktail', 'drinksMeal', 'roastedPig', 'roastedCalf', 'totalMenuCost', 'totalSpecialReqCost', 'outOfServiceAreaCharge',
      'mobilizationCharge', 'taxes', 'grandTotal', 'fortyPercentDueOn', 'fortyPercentAmount', 'fortyPercentReceivedBy', 'fortyPercentDateReceived',
      'fullPaymentDueOn', 'fullPaymentAmount', 'fullPaymentReceivedBy', 'fullPaymentDateReceived', 'remarks'
    ];
    for (const field of requiredP3Fields) {
      if (!p3[field] || !p3[field].trim()) return false;
    }

    return true;
  };

  const validateForm = () => {
    const newErrors = {};

    // Check conditional requirements for representative
    const isNA = (value) => value && value.trim().toUpperCase() === 'N/A';
    const celebratorContactsNA = isNA(p1.celebratorEmail) || isNA(p1.celebratorAddress) || isNA(p1.celebratorMobile);
    if (celebratorContactsNA) {
      if (!p1.representativeName || !p1.representativeName.trim()) {
        newErrors.representativeName = "Representative name is required since celebrator contacts are N/A";
      }
      if (!p1.representativeRelationship || !p1.representativeRelationship.trim()) {
        newErrors.representativeRelationship = "Representative relationship is required since celebrator contacts are N/A";
      }
      if (!p1.representativeEmail || p1.representativeEmail.trim().toUpperCase() === 'N/A') {
        newErrors.representativeEmail = "Representative email is required and cannot be N/A since celebrator contacts are N/A";
      }
      if (!p1.representativeAddress || p1.representativeAddress.trim().toUpperCase() === 'N/A') {
        newErrors.representativeAddress = "Representative address is required and cannot be N/A since celebrator contacts are N/A";
      }
      if (!p1.representativeMobile || p1.representativeMobile.trim().toUpperCase() === 'N/A') {
        newErrors.representativeMobile = "Representative mobile is required and cannot be N/A since celebrator contacts are N/A";
      }
    }

    // Check all string fields in page1 are filled (excluding computed fields)
    const requiredP1Fields = [
      'date', 'celebratorName', 'celebratorAddress', 'celebratorLandline', 'celebratorMobile', 'celebratorEmail',
      'coordinatorName', 'coordinatorMobile', 'coordinatorLandline', 'coordinatorAddress', 'coordinatorEmail',
      'eventDate', 'occasion', 'venue', 'hall', 'ingressTime', 'cocktailTime', 'address', 'arrivalOfGuests', 'servingTime',
      'totalVIP', 'totalRegular', 'kiddiePlated', 'kiddiePacked', 'crewPlated', 'crewPacked',
      'themeSetup', 'colorMotif', 'vipTableType', 'regularTableType', 'vipTableSeats', 'regularTableSeats', 'vipTableQuantity', 'regularTableQuantity',
      'vipUnderliner', 'vipTopper', 'vipNapkin', 'guestUnderliner', 'guestTopper', 'guestNapkin', 'setupRemarks',
      'buffetStandard', 'buffetUpgraded', 'buffetPremium', 'buffetBarrel', 'buffetOval', 'buffetRemarks'
    ];
    for (const field of requiredP1Fields) {
      if (!p1[field] || !p1[field].trim()) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
      }
    }

    // Additional check: celebrator name cannot be N/A
    if (p1.celebratorName && p1.celebratorName.trim().toUpperCase() === 'N/A') {
      newErrors.celebratorName = "Celebrator name cannot be N/A";
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



    // Check all string fields in page2 are filled, skip booleans
    const requiredP2Fields = [
      'chairsMonoblock', 'chairsTiffany', 'chairsCrystal', 'chairsRustic', 'chairsKiddie', 'premiumChairs', 'chairsRemarks',
      'flowerBackdrop', 'flowerGuestCenterpiece', 'flowerVipCenterpiece', 'flowerCakeTable', 'flowerRemarks',
      'cakeNameCode', 'cakeFlavor', 'cakeSupplier', 'cakeSpecifications', 'celebratorsCar', 'emcee', 'soundSystem', 'tent', 'celebratorsChair'
    ];
    for (const field of requiredP2Fields) {
      if (!p2[field] || !p2[field].trim()) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
      }
    }

    // Check all string fields in page3 are filled
    const requiredP3Fields = [
      'pricePerPlate', 'cocktailHour', 'appetizer', 'soup', 'bread', 'salad', 'mainEntree', 'dessert', 'cakeName', 'kidsMeal', 'crewMeal',
      'drinksCocktail', 'drinksMeal', 'roastedPig', 'roastedCalf', 'totalMenuCost', 'totalSpecialReqCost', 'outOfServiceAreaCharge',
      'mobilizationCharge', 'taxes', 'grandTotal', 'fortyPercentDueOn', 'fortyPercentAmount', 'fortyPercentReceivedBy', 'fortyPercentDateReceived',
      'fullPaymentDueOn', 'fullPaymentAmount', 'fullPaymentReceivedBy', 'fullPaymentDateReceived', 'remarks'
    ];
    for (const field of requiredP3Fields) {
      if (!p3[field] || !p3[field].trim()) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
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
          body: JSON.stringify({ page1: p1, page2: p2, page3: p3, status: "Draft" }),
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
      } else {
        const payload = { department: "Sales", status: "Draft", page1: p1, page2: p2, page3: p3 };
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
      }
    } catch (err) {
      alert("Failed to save contract. Please try again.");
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
          body: JSON.stringify({ page1: p1, page2: p2, page3: p3, status: "For Approval" }),
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
        const payload = { department: "Sales", status: "For Approval", page1: p1, page2: p2, page3: p3 };
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
    setActivePage((p) => Math.min(3, p + 1));
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
      <div className="form-row two">
        <div className="form-group">
          <label>Contract No.</label>
          <input type="text" value={nextNumber} readOnly />
        </div>
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={p1.date} onChange={(e) => setP1({ ...p1, date: e.target.value })} />
        </div>
      </div>

      <h4>Celebrator</h4>
      <div className="form-row two">
        <div className="form-group"><label>Celebrator/Corporate Name</label><input value={p1.celebratorName} onChange={(e)=>setP1({...p1, celebratorName:convertToUppercase(e.target.value)})} onBlur={handleAutoSave} /></div>
        <div className="form-group"><label>Email Address</label><input value={p1.celebratorEmail} onChange={(e)=>setP1({...p1, celebratorEmail:e.target.value})} className={errors.celebratorEmail ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.celebratorEmail}</div></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>Address</label><input value={p1.celebratorAddress} onChange={(e)=>setP1({...p1, celebratorAddress:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>Landline No.</label><input value={p1.celebratorLandline} onChange={(e)=>setP1({...p1, celebratorLandline:e.target.value})} className={errors.celebratorLandline ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.celebratorLandline}</div></div>
        <div className="form-group"><label>Mobile No.</label><input value={p1.celebratorMobile} onChange={(e)=>setP1({...p1, celebratorMobile:e.target.value})} className={errors.celebratorMobile ? 'invalid-input' : ''} onBlur={() => validateForm()} /><div className="validation-error">{errors.celebratorMobile}</div></div>
      </div>

      <h4>Representative</h4>
      <div className="form-row two">
        <div className="form-group"><label>Name</label><input value={p1.representativeName} onChange={(e)=>setP1({...p1, representativeName:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>Relationship</label><input value={p1.representativeRelationship} onChange={(e)=>setP1({...p1, representativeRelationship:convertToUppercase(e.target.value)})} /></div>
      </div>
      <div className="form-row
