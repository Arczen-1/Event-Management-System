import React, { useEffect, useState } from "react";
import "./ContractForm.css";

// Multi-page contract form replicating the client's three contract pages.
// Saves to backend with monthly-reset contract numbering.
function ContractForm({ onCancel, onCreated, existing }) {
  const [activePage, setActivePage] = useState(1); // 1, 2, 3
  const [nextNumber, setNextNumber] = useState("");

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

  // Validation functions
  const convertToUppercase = (value) => {
    return value.toUpperCase();
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

  const validateForm = () => {
    const errors = [];

    // Page 1 validations
    if (!p1.celebratorName?.trim()) errors.push("Celebrator Name is required");
    if (!p1.eventDate) errors.push("Event Date is required");
    if (!p1.occasion) errors.push("Occasion is required");
    if (!p1.venue?.trim()) errors.push("Venue is required");
    if (!p1.totalGuests) errors.push("Total Number of Guests is required");
    if (!p1.coordinatorName?.trim()) errors.push("Coordinator Name is required");

    // Page 2 validations - at least some basic requirements
    if (!p2.cakeNameCode?.trim() && !p2.cakeFlavor?.trim()) {
      errors.push("Cake details are required");
    }

    // Page 3 validations
    if (!p3.mainEntree?.trim()) errors.push("Main Entrée is required");
    if (!p3.grandTotal) errors.push("Grand Total is required");

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert("Please fill in all required fields:\n\n" + validationErrors.join("\n"));
      return;
    }

    try {
    if (existing) {
      // Update existing draft
      const updateStatus = existing.status === "Rejected" ? "For Approval" : existing.status || "draft";
      const res = await fetch(`http://localhost:5000/contracts/${existing._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page1: p1, page2: p2, page3: p3, status: updateStatus }),
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
          status: data.contract.status || "Draft",
        });
      }
    } else {
        // Create new
        const payload = { department: "Sales", status: "draft", page1: p1, page2: p2, page3: p3 };
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
            status: "Draft",
          });
        }
      }
    } catch (err) {
      alert("Failed to save contract. Please try again.");
      return;
    }
  };

  const next = () => setActivePage((p) => Math.min(3, p + 1));
  const back = () => setActivePage((p) => Math.max(1, p - 1));

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
        <div className="form-group"><label>Name</label><input value={p1.celebratorName} onChange={(e)=>setP1({...p1, celebratorName:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>Email Address</label><input value={p1.celebratorEmail} onChange={(e)=>setP1({...p1, celebratorEmail:e.target.value})} /></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>Address</label><input value={p1.celebratorAddress} onChange={(e)=>setP1({...p1, celebratorAddress:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>Landline No.</label><input value={p1.celebratorLandline} onChange={(e)=>setP1({...p1, celebratorLandline:e.target.value})} /></div>
        <div className="form-group"><label>Mobile No.</label><input value={p1.celebratorMobile} onChange={(e)=>setP1({...p1, celebratorMobile:e.target.value})} /></div>
      </div>

      <h4>Representative</h4>
      <div className="form-row two">
        <div className="form-group"><label>Name</label><input value={p1.representativeName} onChange={(e)=>setP1({...p1, representativeName:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>Relationship</label><input value={p1.representativeRelationship} onChange={(e)=>setP1({...p1, representativeRelationship:convertToUppercase(e.target.value)})} /></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>Email Address</label><input value={p1.representativeEmail} onChange={(e)=>setP1({...p1, representativeEmail:e.target.value})} /></div>
        <div className="form-group"><label>Address</label><input value={p1.representativeAddress} onChange={(e)=>setP1({...p1, representativeAddress:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>Landline No.</label><input value={p1.representativeLandline} onChange={(e)=>setP1({...p1, representativeLandline:e.target.value})} /></div>
        </div>
      <div className="form-row two">
        <div className="form-group"><label>Mobile No.</label><input value={p1.representativeMobile} onChange={(e)=>setP1({...p1, representativeMobile:e.target.value})} /></div>
      </div>

      <h4>Coordinator </h4>
      <div className="form-row three">
        <div className="form-group"><label>Coordinator Name</label><input value={p1.coordinatorName} onChange={(e)=>setP1({...p1, coordinatorName:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>Mobile No.</label><input value={p1.coordinatorMobile} onChange={(e)=>setP1({...p1, coordinatorMobile:e.target.value})} /></div>
        <div className="form-group"><label>Landline No.</label><input value={p1.coordinatorLandline} onChange={(e)=>setP1({...p1, coordinatorLandline:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Email Address</label><input value={p1.coordinatorEmail} onChange={(e)=>setP1({...p1, coordinatorEmail:e.target.value})} /></div>
        <div className="form-group"><label>Address</label><input value={p1.coordinatorAddress} onChange={(e)=>setP1({...p1, coordinatorAddress:convertToUppercase(e.target.value)})} /></div>
      </div>
      
      <h4>Event Details</h4>
      <div className="form-row three">
        <div className="form-group"><label>Date of Event</label><input type="date" value={p1.eventDate} onChange={(e)=>setP1({...p1, eventDate:e.target.value})} /></div>
        <div className="form-group">
          <label>Occasion</label>
          <select value={p1.occasion} onChange={(e)=>setP1({...p1, occasion:e.target.value})}>
            <option value="">Select Occasion</option>
            <option value="BIRTHDAY">Birthday</option>
            <option value="DEBUT">Debut</option>
            <option value="SPECIAL OCCASION">Special Occasion</option>
            <option value="CORPORATE">Corporate</option>
            <option value="WEDDINGS">Weddings</option>
          </select>
        </div>
        <div className="form-group"><label>Venue</label><input value={p1.venue} onChange={(e)=>setP1({...p1, venue:convertToUppercase(e.target.value)})} /></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>Hall</label><input value={p1.hall} onChange={(e)=>setP1({...p1, hall:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group">
          <label>Ingress Time</label>
          <input 
            value={p1.ingressTime} 
            onChange={(e) => setP1({...p1, ingressTime: validateTimeField(e.target.value)})}
            placeholder="HH:MM AM/PM or N/A"
            className={!isTimeFieldValid(p1.ingressTime) ? "invalid-input" : ""}
          />
          {!isTimeFieldValid(p1.ingressTime) && (
            <span className="validation-error">Please enter time in HH:MM AM/PM format or N/A</span>
          )}
        </div>
        <div className="form-group">
          <label>Cocktail Time</label>
          <input 
            value={p1.cocktailTime} 
            onChange={(e) => setP1({...p1, cocktailTime: validateTimeField(e.target.value)})}
            placeholder="HH:MM AM/PM or N/A"
            className={!isTimeFieldValid(p1.cocktailTime) ? "invalid-input" : ""}
          />
          {!isTimeFieldValid(p1.cocktailTime) && (
            <span className="validation-error">Please enter time in HH:MM AM/PM format or N/A</span>
          )}
        </div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>Address</label><input value={p1.address} onChange={(e)=>setP1({...p1, address:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group">
          <label>Arrival of Guests</label>
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
        <div className="form-group">
          <label>Serving Time</label>
          <input 
            value={p1.servingTime} 
            onChange={(e) => setP1({...p1, servingTime: validateTimeField(e.target.value)})}
            placeholder="HH:MM AM/PM or N/A"
            className={!isTimeFieldValid(p1.servingTime) ? "invalid-input" : ""}
          />
          {!isTimeFieldValid(p1.servingTime) && (
            <span className="validation-error">Please enter time in HH:MM AM/PM format or N/A</span>
          )}
        </div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>Total No. of Guests</label><input value={p1.totalGuests} onChange={(e)=>setP1({...p1, totalGuests:e.target.value})} /></div>
        <div className="form-group"><label>VIP</label><input value={p1.totalVIP} onChange={(e)=>setP1({...p1, totalVIP:e.target.value})} /></div>
        <div className="form-group"><label>Regular</label><input value={p1.totalRegular} onChange={(e)=>setP1({...p1, totalRegular:e.target.value})} /></div>
      </div>
      <div className="form-row four">
        <div className="form-group"><label>Kiddie Meal Plated</label><input value={p1.kiddiePlated} onChange={(e)=>setP1({...p1, kiddiePlated:e.target.value})} /></div>
        <div className="form-group"><label>Kiddie Meal Packed</label><input value={p1.kiddiePacked} onChange={(e)=>setP1({...p1, kiddiePacked:e.target.value})} /></div>
        <div className="form-group"><label>Crew Meal Plated</label><input value={p1.crewPlated} onChange={(e)=>setP1({...p1, crewPlated:e.target.value})} /></div>
        <div className="form-group"><label>Crew Meal Packed</label><input value={p1.crewPacked} onChange={(e)=>setP1({...p1, crewPacked:e.target.value})} /></div>
      </div>

      <h4>Set Up</h4>
      <div className="form-row two">
        <div className="form-group"><label>Theme Set-up</label><input value={p1.themeSetup} onChange={(e)=>setP1({...p1, themeSetup:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>Color Motif</label><input value={p1.colorMotif} onChange={(e)=>setP1({...p1, colorMotif:convertToUppercase(e.target.value)})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>VIP Table Type</label><input value={p1.vipTableType} onChange={(e)=>setP1({...p1, vipTableType:e.target.value})} /></div>
        <div className="form-group"><label>Regular Table Type</label><input value={p1.regularTableType} onChange={(e)=>setP1({...p1, regularTableType:e.target.value})} /></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>VIP Underliner</label><input value={p1.vipUnderliner} onChange={(e)=>setP1({...p1, vipUnderliner:e.target.value})} /></div>
        <div className="form-group"><label>VIP Topper</label><input value={p1.vipTopper} onChange={(e)=>setP1({...p1, vipTopper:e.target.value})} /></div>
        <div className="form-group"><label>VIP Napkin</label><input value={p1.vipNapkin} onChange={(e)=>setP1({...p1, vipNapkin:e.target.value})} /></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>Guest Underliner</label><input value={p1.guestUnderliner} onChange={(e)=>setP1({...p1, guestUnderliner:e.target.value})} /></div>
        <div className="form-group"><label>Guest Topper</label><input value={p1.guestTopper} onChange={(e)=>setP1({...p1, guestTopper:e.target.value})} /></div>
        <div className="form-group"><label>Guest Napkin</label><input value={p1.guestNapkin} onChange={(e)=>setP1({...p1, guestNapkin:e.target.value})} /></div>
      </div>
      <div className="form-group"><label>Remarks</label><textarea value={p1.setupRemarks} onChange={(e)=>setP1({...p1, setupRemarks:e.target.value})} /></div>

      <h4>Buffet Set Up</h4>
      <div className="form-row three">
        <div className="form-group"><label>Standard Buffet</label><input value={p1.buffetStandard} onChange={(e)=>setP1({...p1, buffetStandard:e.target.value})} /></div>
        <div className="form-group"><label>Upgraded Buffet - Lighted</label><input value={p1.buffetUpgraded} onChange={(e)=>setP1({...p1, buffetUpgraded:e.target.value})} /></div>
        <div className="form-group"><label>Upgraded Buffet - Barrel</label><input value={p1.buffetBarrel} onChange={(e)=>setP1({...p1, buffetBarrel:e.target.value})} /></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>Premium Buffet - Mirrorized</label><input value={p1.buffetPremium} onChange={(e)=>setP1({...p1, buffetPremium:e.target.value})} /></div>
        <div className="form-group"><label>Premium Buffet -Oval Buffet</label><input value={p1.buffetOval} onChange={(e)=>setP1({...p1, buffetOval:e.target.value})} /></div>
      </div>
      <div className="form-group"><label>Remarks</label><textarea value={p1.buffetRemarks} onChange={(e)=>setP1({...p1, buffetRemarks:e.target.value})} /></div>
    </div>
  );

  const renderPage2 = () => (
    <div className="page">
      <h4>Chairs</h4>
      <div className="form-row five">
        <div className="form-group"><label>Monoblock</label><input value={p2.chairsMonoblock} onChange={(e)=>setP2({...p2, chairsMonoblock:e.target.value})} /></div>
        <div className="form-group"><label>Tiffany</label><input value={p2.chairsTiffany} onChange={(e)=>setP2({...p2, chairsTiffany:e.target.value})} /></div>
        <div className="form-group"><label>Crystal</label><input value={p2.chairsCrystal} onChange={(e)=>setP2({...p2, chairsCrystal:e.target.value})} /></div>
        <div className="form-group"><label>Rustic</label><input value={p2.chairsRustic} onChange={(e)=>setP2({...p2, chairsRustic:e.target.value})} /></div>
        <div className="form-group"><label>Kiddie</label><input value={p2.chairsKiddie} onChange={(e)=>setP2({...p2, chairsKiddie:e.target.value})} /></div>
      </div>
      <div className="form-group"><label>Premium Chairs</label><input value={p2.premiumChairs} onChange={(e)=>setP2({...p2, premiumChairs:e.target.value})} /></div>
      <div className="form-group"><label>Remarks</label><textarea value={p2.chairsRemarks} onChange={(e)=>setP2({...p2, chairsRemarks:convertToUppercase(e.target.value)})} /></div>

      <h4>Flower Arrangement</h4>
      <div className="form-row two">
        <div className="form-group"><label>Backdrop</label><input value={p2.flowerBackdrop} onChange={(e)=>setP2({...p2, flowerBackdrop:e.target.value})} /></div>
        <div className="form-group"><label>Guest Centerpiece</label><input value={p2.flowerGuestCenterpiece} onChange={(e)=>setP2({...p2, flowerGuestCenterpiece:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>VIP Centerpiece</label><input value={p2.flowerVipCenterpiece} onChange={(e)=>setP2({...p2, flowerVipCenterpiece:e.target.value})} /></div>
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
    
      <h4>How did you know our company?</h4>
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

  const renderPage3 = () => (
    <div className="page">
      <div className="form-group"><label>Price Per Plate</label><input value={p3.pricePerPlate} onChange={(e)=>setP3({...p3, pricePerPlate:e.target.value})} /></div>

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
        <label>Total Menu Cost</label>
        <input value={p3.totalMenuCost} onChange={(e)=>setP3({...p3, totalMenuCost:e.target.value})} />
      </div>
      <div className="form-group">
        <label>Total Special Requirements Cost</label>
        <input value={p3.totalSpecialReqCost} onChange={(e)=>setP3({...p3, totalSpecialReqCost:e.target.value})} />
      </div>
      <div className="form-group">
        <label>Out of Service Area Charge</label>
        <input value={p3.outOfServiceAreaCharge} onChange={(e)=>setP3({...p3, outOfServiceAreaCharge:e.target.value})} />
      </div>
      <div className="form-group">
        <label>Mobilization Charge</label>
        <input value={p3.mobilizationCharge} onChange={(e)=>setP3({...p3, mobilizationCharge:e.target.value})} />
      </div>
      <div className="form-group">
        <label>Taxes</label>
        <input value={p3.taxes} onChange={(e)=>setP3({...p3, taxes:e.target.value})} />
      </div>
      <div className="form-group">
        <label>Grand Total</label>
        <input value={p3.grandTotal} onChange={(e)=>setP3({...p3, grandTotal:e.target.value})} />
      </div>

      <h4>Payment Details</h4>
      
      <h5>40% Payment</h5>
      <div className="form-row two">
        <div className="form-group"><label>40% Due On</label><input type="date" value={p3.fortyPercentDueOn} onChange={(e)=>setP3({...p3, fortyPercentDueOn:e.target.value})} /></div>
        <div className="form-group"><label>40% Amount</label><input value={p3.fortyPercentAmount} onChange={(e)=>setP3({...p3, fortyPercentAmount:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>40% Received By</label><input value={p3.fortyPercentReceivedBy} onChange={(e)=>setP3({...p3, fortyPercentReceivedBy:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>40% Date Received</label><input type="date" value={p3.fortyPercentDateReceived} onChange={(e)=>setP3({...p3, fortyPercentDateReceived:e.target.value})} /></div>
      </div>

      <h5>Full Payment</h5>
      <div className="form-row two">
        <div className="form-group"><label>Full Payment Due On</label><input type="date" value={p3.fullPaymentDueOn} onChange={(e)=>setP3({...p3, fullPaymentDueOn:e.target.value})} /></div>
        <div className="form-group"><label>Full Payment Amount</label><input value={p3.fullPaymentAmount} onChange={(e)=>setP3({...p3, fullPaymentAmount:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Full Payment Received By</label><input value={p3.fullPaymentReceivedBy} onChange={(e)=>setP3({...p3, fullPaymentReceivedBy:convertToUppercase(e.target.value)})} /></div>
        <div className="form-group"><label>Full Payment Date Received</label><input value={p3.fullPaymentDateReceived} onChange={(e)=>setP3({...p3, fullPaymentDateReceived:e.target.value})} /></div>
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
        {activePage === 3 && renderPage3()}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <div className="pager">
            <button type="button" className="pager-btn" onClick={back} disabled={activePage === 1}>← Back</button>
            <span>Page {activePage} of 3</span>
            {activePage < 3 ? (
              <button type="button" className="pager-btn" onClick={next}>Next →</button>
            ) : (
              <button type="button" className="btn-primary" onClick={handleSubmit}>Save Contract</button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default ContractForm;


