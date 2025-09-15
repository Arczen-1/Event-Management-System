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
    companyName: "",
    companyAddress: "",
    companyEmail: "",
    accountHandlerName: "",
    accountHandlerMobile: "",
    accountHandlerEmail: "",
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
    buffetUnderliner: "",
    buffetTopper: "",
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
    remarks: "",
    others: "",
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
    appetizer: "",
    salad: "",
    mainEntree: "",
    soup: "",
    bread: "",
    dessert: "",
    drinksCocktail: "",
    drinksMeal: "",
    cakeName: "",
    kidsMeal: "",
    crewMeal: "",
    roastedPig: "",
    roastedCalf: "",
    totalMenuCost: "",
    totalSpecialReqCost: "",
    outOfServiceAreaCharge: "",
    mobilizationCharge: "",
    taxes: "",
    grandTotal: "",
    reservationAmount: "",
    reservationDetails: "",
    reservationReceivedBy: "",
    reservationDateReceived: "",
    fortyPercentDueOn: "",
    fullPaymentDueOn: "",
    paymentDetails: "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (existing) {
        // Update existing draft
        const res = await fetch(`http://localhost:5000/contracts/${existing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page1: p1, page2: p2, page3: p3, status: existing.status || "Draft" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update contract");
        if (onCreated) {
          onCreated({
            id: data.contract._id,
            contractNumber: data.contract.contractNumber,
            name: p1.contractName || p1.occasion || "Contract",
            client: p1.celebratorName || "",
            value: p3.grandTotal || "",
            startDate: p1.eventDate || "",
            endDate: p1.eventDate || "",
            status: data.contract.status || "Draft",
          });
        }
      } else {
        // Create new
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
        <div className="form-group"><label>Name</label><input value={p1.celebratorName} onChange={(e)=>setP1({...p1, celebratorName:e.target.value})} /></div>
        <div className="form-group"><label>Email Address</label><input value={p1.celebratorEmail} onChange={(e)=>setP1({...p1, celebratorEmail:e.target.value})} /></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>Address</label><input value={p1.celebratorAddress} onChange={(e)=>setP1({...p1, celebratorAddress:e.target.value})} /></div>
        <div className="form-group"><label>Landline No.</label><input value={p1.celebratorLandline} onChange={(e)=>setP1({...p1, celebratorLandline:e.target.value})} /></div>
        <div className="form-group"><label>Mobile No.</label><input value={p1.celebratorMobile} onChange={(e)=>setP1({...p1, celebratorMobile:e.target.value})} /></div>
      </div>

      <h4>Representative</h4>
      <div className="form-row two">
        <div className="form-group"><label>Name</label><input value={p1.representativeName} onChange={(e)=>setP1({...p1, representativeName:e.target.value})} /></div>
        <div className="form-group"><label>Relationship</label><input value={p1.representativeRelationship} onChange={(e)=>setP1({...p1, representativeRelationship:e.target.value})} /></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>Address</label><input value={p1.representativeAddress} onChange={(e)=>setP1({...p1, representativeAddress:e.target.value})} /></div>
        <div className="form-group"><label>Email</label><input value={p1.representativeEmail} onChange={(e)=>setP1({...p1, representativeEmail:e.target.value})} /></div>
        <div className="form-group"><label>Mobile No.</label><input value={p1.representativeMobile} onChange={(e)=>setP1({...p1, representativeMobile:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Landline No.</label><input value={p1.representativeLandline} onChange={(e)=>setP1({...p1, representativeLandline:e.target.value})} /></div>
      </div>

      <h4>Coordinator / Company</h4>
      <div className="form-row three">
        <div className="form-group"><label>Coordinator Name</label><input value={p1.coordinatorName} onChange={(e)=>setP1({...p1, coordinatorName:e.target.value})} /></div>
        <div className="form-group"><label>Mobile No.</label><input value={p1.coordinatorMobile} onChange={(e)=>setP1({...p1, coordinatorMobile:e.target.value})} /></div>
        <div className="form-group"><label>Landline No.</label><input value={p1.coordinatorLandline} onChange={(e)=>setP1({...p1, coordinatorLandline:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Company</label><input value={p1.companyName} onChange={(e)=>setP1({...p1, companyName:e.target.value})} /></div>
        <div className="form-group"><label>Email</label><input value={p1.companyEmail} onChange={(e)=>setP1({...p1, companyEmail:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Address</label><input value={p1.companyAddress} onChange={(e)=>setP1({...p1, companyAddress:e.target.value})} /></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>Account Handler</label><input value={p1.accountHandlerName} onChange={(e)=>setP1({...p1, accountHandlerName:e.target.value})} /></div>
        <div className="form-group"><label>Mobile Number</label><input value={p1.accountHandlerMobile} onChange={(e)=>setP1({...p1, accountHandlerMobile:e.target.value})} /></div>
        <div className="form-group"><label>Email Address</label><input value={p1.accountHandlerEmail} onChange={(e)=>setP1({...p1, accountHandlerEmail:e.target.value})} /></div>
      </div>

      <h4>Event Details</h4>
      <div className="form-row three">
        <div className="form-group"><label>Date of Event</label><input type="date" value={p1.eventDate} onChange={(e)=>setP1({...p1, eventDate:e.target.value})} /></div>
        <div className="form-group"><label>Occasion</label><input value={p1.occasion} onChange={(e)=>setP1({...p1, occasion:e.target.value})} /></div>
        <div className="form-group"><label>Venue</label><input value={p1.venue} onChange={(e)=>setP1({...p1, venue:e.target.value})} /></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>Hall</label><input value={p1.hall} onChange={(e)=>setP1({...p1, hall:e.target.value})} /></div>
        <div className="form-group"><label>Ingress Time</label><input value={p1.ingressTime} onChange={(e)=>setP1({...p1, ingressTime:e.target.value})} /></div>
        <div className="form-group"><label>Cocktail Time</label><input value={p1.cocktailTime} onChange={(e)=>setP1({...p1, cocktailTime:e.target.value})} /></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>Address</label><input value={p1.address} onChange={(e)=>setP1({...p1, address:e.target.value})} /></div>
        <div className="form-group"><label>Arrival of Guests</label><input value={p1.arrivalOfGuests} onChange={(e)=>setP1({...p1, arrivalOfGuests:e.target.value})} /></div>
        <div className="form-group"><label>Serving Time</label><input value={p1.servingTime} onChange={(e)=>setP1({...p1, servingTime:e.target.value})} /></div>
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
        <div className="form-group"><label>Theme Set-up</label><input value={p1.themeSetup} onChange={(e)=>setP1({...p1, themeSetup:e.target.value})} /></div>
        <div className="form-group"><label>Color Motif</label><input value={p1.colorMotif} onChange={(e)=>setP1({...p1, colorMotif:e.target.value})} /></div>
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
        <div className="form-group"><label>Upgraded Buffet / Lighted</label><input value={p1.buffetUpgraded} onChange={(e)=>setP1({...p1, buffetUpgraded:e.target.value})} /></div>
        <div className="form-group"><label>Premium / Mirrorized</label><input value={p1.buffetPremium} onChange={(e)=>setP1({...p1, buffetPremium:e.target.value})} /></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>Barrel Buffet</label><input value={p1.buffetBarrel} onChange={(e)=>setP1({...p1, buffetBarrel:e.target.value})} /></div>
        <div className="form-group"><label>Oval Buffet</label><input value={p1.buffetOval} onChange={(e)=>setP1({...p1, buffetOval:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Underliner</label><input value={p1.buffetUnderliner} onChange={(e)=>setP1({...p1, buffetUnderliner:e.target.value})} /></div>
        <div className="form-group"><label>Topper</label><input value={p1.buffetTopper} onChange={(e)=>setP1({...p1, buffetTopper:e.target.value})} /></div>
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
      <div className="form-group"><label>Remarks</label><textarea value={p2.remarks} onChange={(e)=>setP2({...p2, remarks:e.target.value})} /></div>
      <div className="form-group"><label>Others</label><textarea value={p2.others} onChange={(e)=>setP2({...p2, others:e.target.value})} /></div>

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
      <div className="form-row two">
        <div className="form-group"><label>Appetizer</label><textarea value={p3.appetizer} onChange={(e)=>setP3({...p3, appetizer:e.target.value})} /></div>
        <div className="form-group"><label>Soup</label><textarea value={p3.soup} onChange={(e)=>setP3({...p3, soup:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Salad</label><textarea value={p3.salad} onChange={(e)=>setP3({...p3, salad:e.target.value})} /></div>
        <div className="form-group"><label>Bread</label><textarea value={p3.bread} onChange={(e)=>setP3({...p3, bread:e.target.value})} /></div>
      </div>
      <div className="form-group"><label>Main Entrée</label><textarea value={p3.mainEntree} onChange={(e)=>setP3({...p3, mainEntree:e.target.value})} /></div>
      <div className="form-group"><label>Dessert</label><textarea value={p3.dessert} onChange={(e)=>setP3({...p3, dessert:e.target.value})} /></div>
      <div className="form-row two">
        <div className="form-group"><label>Drinks at Cocktail</label><textarea value={p3.drinksCocktail} onChange={(e)=>setP3({...p3, drinksCocktail:e.target.value})} /></div>
        <div className="form-group"><label>Drinks at Meal</label><textarea value={p3.drinksMeal} onChange={(e)=>setP3({...p3, drinksMeal:e.target.value})} /></div>
      </div>
      <div className="form-row three">
        <div className="form-group"><label>Cake Name</label><input value={p3.cakeName} onChange={(e)=>setP3({...p3, cakeName:e.target.value})} /></div>
        <div className="form-group"><label>Kids' Meal</label><input value={p3.kidsMeal} onChange={(e)=>setP3({...p3, kidsMeal:e.target.value})} /></div>
        <div className="form-group"><label>Crew Meal</label><input value={p3.crewMeal} onChange={(e)=>setP3({...p3, crewMeal:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Roasted Pig</label><input value={p3.roastedPig} onChange={(e)=>setP3({...p3, roastedPig:e.target.value})} /></div>
        <div className="form-group"><label>Roasted Calf</label><input value={p3.roastedCalf} onChange={(e)=>setP3({...p3, roastedCalf:e.target.value})} /></div>
      </div>

      <h4>Total Cash Layout</h4>
      <div className="form-row three">
        <div className="form-group"><label>Total Menu Cost</label><input value={p3.totalMenuCost} onChange={(e)=>setP3({...p3, totalMenuCost:e.target.value})} /></div>
        <div className="form-group"><label>Total Special Requirements Cost</label><input value={p3.totalSpecialReqCost} onChange={(e)=>setP3({...p3, totalSpecialReqCost:e.target.value})} /></div>
        <div className="form-group"><label>Out of Service Area Charge / Mobilization</label><input value={p3.outOfServiceAreaCharge} onChange={(e)=>setP3({...p3, outOfServiceAreaCharge:e.target.value})} /></div>
      </div>
      <div className="form-row two">
        <div className="form-group"><label>Taxes</label><input value={p3.taxes} onChange={(e)=>setP3({...p3, taxes:e.target.value})} /></div>
        <div className="form-group"><label>Grand Total</label><input value={p3.grandTotal} onChange={(e)=>setP3({...p3, grandTotal:e.target.value})} /></div>
      </div>

      <h4>Payment Details</h4>
      <div className="form-row two">
        <div className="form-group"><label>Reservation Amount</label><input value={p3.reservationAmount} onChange={(e)=>setP3({...p3, reservationAmount:e.target.value})} /></div>
        <div className="form-group"><label>Payment Details</label><input value={p3.paymentDetails} onChange={(e)=>setP3({...p3, paymentDetails:e.target.value})} /></div>
      </div>
      <div className="form-row four">
        <div className="form-group"><label>Received By</label><input value={p3.reservationReceivedBy} onChange={(e)=>setP3({...p3, reservationReceivedBy:e.target.value})} /></div>
        <div className="form-group"><label>Date Received</label><input value={p3.reservationDateReceived} onChange={(e)=>setP3({...p3, reservationDateReceived:e.target.value})} /></div>
        <div className="form-group"><label>40% Due On</label><input value={p3.fortyPercentDueOn} onChange={(e)=>setP3({...p3, fortyPercentDueOn:e.target.value})} /></div>
        <div className="form-group"><label>Full Payment Due On</label><input value={p3.fullPaymentDueOn} onChange={(e)=>setP3({...p3, fullPaymentDueOn:e.target.value})} /></div>
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

      <form onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); } }}>
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


