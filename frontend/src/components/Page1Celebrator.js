import React from "react";
import { VENUES } from "./constants";

function Page1Celebrator({
  p1,
  setP1,
  errors,
  nextNumber,
  availableHalls,
  maxPax,
  convertToUppercase,
  validateTimeField,
  isTimeFieldValid,
  handleAutoSave
}) {
  return (
    <div className="page">
      <div className="form-row">
        <div className="form-group">
          <label>Contract No.</label>
          <input type="text" value={nextNumber} readOnly />
        </div>
      </div>

      <h4>Celebrator</h4>
      <div className="form-row two">
        <div className="form-group">
          <label>
            Celebrator/Corporate Name
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.celebratorName}
            onChange={(e) => setP1({ ...p1, celebratorName: convertToUppercase(e.target.value) })}
            onBlur={handleAutoSave}
          />
        </div>
        <div className="form-group">
          <label>Email Address</label>
          <input
            value={p1.celebratorEmail}
            onChange={(e) => setP1({ ...p1, celebratorEmail: e.target.value })}
            className={errors.celebratorEmail ? "invalid-input" : ""}
            onBlur={() => {}}
          />
          <div className="validation-error">{errors.celebratorEmail}</div>
        </div>
      </div>
      <div className="form-row three">
        <div className="form-group">
          <label>Address</label>
          <input
            value={p1.celebratorAddress}
            onChange={(e) => setP1({ ...p1, celebratorAddress: convertToUppercase(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>Landline No.</label>
          <input
            value={p1.celebratorLandline}
            onChange={(e) => setP1({ ...p1, celebratorLandline: e.target.value })}
            className={errors.celebratorLandline ? "invalid-input" : ""}
            onBlur={() => {}}
          />
          <div className="validation-error">{errors.celebratorLandline}</div>
        </div>
        <div className="form-group">
          <label>Mobile No.</label>
          <input
            value={p1.celebratorMobile}
            onChange={(e) => setP1({ ...p1, celebratorMobile: e.target.value })}
            className={errors.celebratorMobile ? "invalid-input" : ""}
            onBlur={() => {}}
          />
          <div className="validation-error">{errors.celebratorMobile}</div>
        </div>
      </div>

      <h4>Representative</h4>
      <div className="form-row two">
        <div className="form-group">
          <label>
            Name
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.representativeName}
            onChange={(e) => setP1({ ...p1, representativeName: convertToUppercase(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>
            Relationship
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.representativeRelationship}
            onChange={(e) => setP1({ ...p1, representativeRelationship: convertToUppercase(e.target.value) })}
          />
        </div>
      </div>
      <div className="form-row three">
        <div className="form-group">
          <label>
            Email Address
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.representativeEmail}
            onChange={(e) => setP1({ ...p1, representativeEmail: e.target.value })}
            className={errors.representativeEmail ? "invalid-input" : ""}
            onBlur={() => {}}
          />
          <div className="validation-error">{errors.representativeEmail}</div>
        </div>
        <div className="form-group">
          <label>
            Address
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.representativeAddress}
            onChange={(e) => setP1({ ...p1, representativeAddress: convertToUppercase(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>Landline No.</label>
          <input
            value={p1.representativeLandline}
            onChange={(e) => setP1({ ...p1, representativeLandline: e.target.value })}
            className={errors.representativeLandline ? "invalid-input" : ""}
            onBlur={() => {}}
          />
          <div className="validation-error">{errors.representativeLandline}</div>
        </div>
      </div>
      <div className="form-row two">
        <div className="form-group">
          <label>
            Mobile No.
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.representativeMobile}
            onChange={(e) => setP1({ ...p1, representativeMobile: e.target.value })}
            className={errors.representativeMobile ? "invalid-input" : ""}
            onBlur={() => {}}
          />
          <div className="validation-error">{errors.representativeMobile}</div>
        </div>
      </div>

      <h4>Coordinator</h4>
      <div className="form-row three">
        <div className="form-group">
          <label>
            Coordinator Name
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.coordinatorName}
            onChange={(e) => setP1({ ...p1, coordinatorName: convertToUppercase(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>
            Mobile No.
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.coordinatorMobile}
            onChange={(e) => setP1({ ...p1, coordinatorMobile: e.target.value })}
            className={errors.coordinatorMobile ? "invalid-input" : ""}
            onBlur={() => {}}
          />
          <div className="validation-error">{errors.coordinatorMobile}</div>
        </div>
        <div className="form-group">
          <label>Landline No.</label>
          <input
            value={p1.coordinatorLandline}
            onChange={(e) => setP1({ ...p1, coordinatorLandline: e.target.value })}
            className={errors.coordinatorLandline ? "invalid-input" : ""}
            onBlur={() => {}}
          />
          <div className="validation-error">{errors.coordinatorLandline}</div>
        </div>
      </div>
      <div className="form-row two">
        <div className="form-group">
          <label>
            Email Address
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.coordinatorEmail}
            onChange={(e) => setP1({ ...p1, coordinatorEmail: e.target.value })}
            className={errors.coordinatorEmail ? "invalid-input" : ""}
            onBlur={() => {}}
          />
          <div className="validation-error">{errors.coordinatorEmail}</div>
        </div>
        <div className="form-group">
          <label>
            Address
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.coordinatorAddress}
            onChange={(e) => setP1({ ...p1, coordinatorAddress: convertToUppercase(e.target.value) })}
          />
        </div>
      </div>

      <h4>Event Details</h4>
      <div className="form-row three">
        <div className="form-group">
          <label>
            Date of Event
            <span className="required-asterisk">*</span>
          </label>
          <input
            type="date"
            value={p1.eventDate}
            onChange={(e) => setP1({ ...p1, eventDate: e.target.value })}
            onBlur={handleAutoSave}
            className={errors.eventDate ? "invalid-input" : ""}
          />
          <div className="validation-error">{errors.eventDate}</div>
        </div>
        <div className="form-group">
          <label>
            Occasion
            <span className="required-asterisk">*</span>
          </label>
          <select
            value={p1.occasion}
            onChange={(e) => setP1({ ...p1, occasion: e.target.value })}
          >
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
          <select
            value={p1.serviceStyle}
            onChange={(e) => setP1({ ...p1, serviceStyle: e.target.value })}
          >
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
        <div className="form-group">
          <label>
            Address
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.address}
            onChange={(e) => setP1({ ...p1, address: convertToUppercase(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>
            Arrival of Guests
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.arrivalOfGuests}
            onChange={(e) => setP1({ ...p1, arrivalOfGuests: validateTimeField(e.target.value) })}
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
        <div className="form-group">
          <label>
            VIP
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.totalVIP}
            onChange={(e) => {
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
            }}
          />
        </div>
        <div className="form-group">
          <label>
            Regular
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.totalRegular}
            onChange={(e) => {
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
            }}
          />
        </div>
        <div className="form-group">
          <label>
            Total No. of Guests
            <span className="required-asterisk">*</span>
          </label>
          <input value={p1.totalGuests} readOnly className={errors.totalGuests ? "invalid-input" : ""} />
          {errors.totalGuests && <div className="validation-error">{errors.totalGuests}</div>}
        </div>
      </div>
      <div className="form-row four">
        <div className="form-group">
          <label>Kiddie Meal Plated</label>
          <input
            value={p1.kiddiePlated}
            onChange={(e) => setP1({ ...p1, kiddiePlated: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Kiddie Meal Packed</label>
          <input
            value={p1.kiddiePacked}
            onChange={(e) => setP1({ ...p1, kiddiePacked: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Crew Meal Plated</label>
          <input
            value={p1.crewPlated}
            onChange={(e) => setP1({ ...p1, crewPlated: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Crew Meal Packed</label>
          <input
            value={p1.crewPacked}
            onChange={(e) => setP1({ ...p1, crewPacked: e.target.value })}
          />
        </div>
      </div>

      <h4>Set Up</h4>
      <div className="form-row two">
        <div className="form-group">
          <label>
            Theme Set-up
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.themeSetup}
            onChange={(e) => setP1({ ...p1, themeSetup: convertToUppercase(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>
            Color Motif
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.colorMotif}
            onChange={(e) => setP1({ ...p1, colorMotif: convertToUppercase(e.target.value) })}
          />
        </div>
      </div>
      <div className="form-row four">
        <div className="form-group">
          <label>
            VIP Table Type
            <span className="required-asterisk">*</span>
          </label>
          <select
            value={p1.vipTableType}
            onChange={(e) => setP1({ ...p1, vipTableType: e.target.value })}
          >
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
          <input value={p1.vipTableSeats ? `${p1.vipTableSeats} Seater` : ""} readOnly />
        </div>
        <div className="form-group">
          <label>
            VIP Table Quantity
            <span className="required-asterisk">*</span>
          </label>
          <input
            type="number"
            value={p1.vipTableQuantity}
            onChange={(e) => setP1({ ...p1, vipTableQuantity: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>
            Regular Table Type
            <span className="required-asterisk">*</span>
          </label>
          <select
            value={p1.regularTableType}
            onChange={(e) => setP1({ ...p1, regularTableType: e.target.value })}
          >
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
          <input value={p1.regularTableSeats ? `${p1.regularTableSeats} Seater` : ""} readOnly />
        </div>
        <div className="form-group">
          <label>
            Regular Table Quantity
            <span className="required-asterisk">*</span>
          </label>
          <input
            type="number"
            value={p1.regularTableQuantity}
            onChange={(e) => setP1({ ...p1, regularTableQuantity: e.target.value })}
          />
        </div>
      </div>

      <div className="form-row three">
        <div className="form-group">
          <label>
            VIP Underliner
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.vipUnderliner}
            onChange={(e) => setP1({ ...p1, vipUnderliner: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>VIP Topper</label>
          <input
            value={p1.vipTopper}
            onChange={(e) => setP1({ ...p1, vipTopper: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>
            VIP Napkin
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.vipNapkin}
            onChange={(e) => setP1({ ...p1, vipNapkin: e.target.value })}
          />
        </div>
      </div>
      <div className="form-row three">
        <div className="form-group">
          <label>
            Guest Underliner
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.guestUnderliner}
            onChange={(e) => setP1({ ...p1, guestUnderliner: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Guest Topper</label>
          <input
            value={p1.guestTopper}
            onChange={(e) => setP1({ ...p1, guestTopper: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>
            Guest Napkin
            <span className="required-asterisk">*</span>
          </label>
          <input
            value={p1.guestNapkin}
            onChange={(e) => setP1({ ...p1, guestNapkin: e.target.value })}
          />
        </div>
      </div>
      <div className="form-group">
        <label>Remarks</label>
        <textarea
          value={p1.setupRemarks}
          onChange={(e) => setP1({ ...p1, setupRemarks: e.target.value })}
        />
      </div>
    </div>
  );
}

export default Page1Celebrator;
