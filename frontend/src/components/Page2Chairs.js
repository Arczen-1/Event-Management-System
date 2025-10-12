import React from "react";

function Page2Chairs({ p2, setP2, errors }) {
  return (
    <div className="page">
      <h4>Chairs</h4>
      <div className="form-row five">
        <div className="form-group">
          <label>Monoblock <span className="required-asterisk">*</span></label>
          <input
            value={p2.chairsMonoblock}
            onChange={(e) => setP2({ ...p2, chairsMonoblock: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Rustic <span className="required-asterisk">*</span></label>
          <input
            value={p2.chairsRustic}
            onChange={(e) => setP2({ ...p2, chairsRustic: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Tiffany <span className="required-asterisk">*</span></label>
          <input
            value={p2.chairsTiffany}
            onChange={(e) => setP2({ ...p2, chairsTiffany: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Premium <span className="required-asterisk">*</span></label>
          <input
            value={p2.premiumChairs}
            onChange={(e) => setP2({ ...p2, premiumChairs: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Crystal <span className="required-asterisk">*</span></label>
          <input
            value={p2.chairsCrystal}
            onChange={(e) => setP2({ ...p2, chairsCrystal: e.target.value })}
          />
        </div>
      </div>
      <div className="form-row two">
        <div className="form-group">
          <label>Kiddie <span className="required-asterisk">*</span></label>
          <input
            value={p2.chairsKiddie}
            onChange={(e) => setP2({ ...p2, chairsKiddie: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Total Chairs <span className="required-asterisk">*</span></label>
          <input value={p2.totalChairs} readOnly />
        </div>
      </div>
      {errors.chairsSum && <div className="validation-error">{errors.chairsSum}</div>}
      <div className="form-group">
        <label>Remarks</label>
        <textarea
          value={p2.chairsRemarks}
          onChange={(e) => setP2({ ...p2, chairsRemarks: e.target.value.toUpperCase() })}
        />
      </div>

      <h4>Flower Arrangement</h4>
      <div className="form-row two">
        <div className="form-group">
          <label>Backdrop</label>
          <input
            value={p2.flowerBackdrop}
            onChange={(e) => setP2({ ...p2, flowerBackdrop: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>VIP Centerpiece</label>
          <input
            value={p2.flowerVipCenterpiece}
            onChange={(e) => setP2({ ...p2, flowerVipCenterpiece: e.target.value })}
          />
        </div>
      </div>
      <div className="form-row two">
        <div className="form-group">
          <label>Guest Centerpiece</label>
          <input
            value={p2.flowerGuestCenterpiece}
            onChange={(e) => setP2({ ...p2, flowerGuestCenterpiece: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Cake Table</label>
          <input
            value={p2.flowerCakeTable}
            onChange={(e) => setP2({ ...p2, flowerCakeTable: e.target.value })}
          />
        </div>
      </div>
      <div className="form-group">
        <label>Remarks</label>
        <textarea
          value={p2.flowerRemarks}
          onChange={(e) => setP2({ ...p2, flowerRemarks: e.target.value })}
        />
      </div>

      <h4>Other Special Requirements</h4>
      <div className="form-row two">
        <div className="form-group">
          <label>Cake Name/Code</label>
          <input
            value={p2.cakeNameCode}
            onChange={(e) => setP2({ ...p2, cakeNameCode: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Flavor</label>
          <input
            value={p2.cakeFlavor}
            onChange={(e) => setP2({ ...p2, cakeFlavor: e.target.value })}
          />
        </div>
      </div>
      <div className="form-row two">
        <div className="form-group">
          <label>Supplier</label>
          <input
            value={p2.cakeSupplier}
            onChange={(e) => setP2({ ...p2, cakeSupplier: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Cake Specifications</label>
          <input
            value={p2.cakeSpecifications}
            onChange={(e) => setP2({ ...p2, cakeSpecifications: e.target.value })}
          />
        </div>
      </div>
      <div className="form-row two">
        <div className="form-group">
          <label>Celebrator's Car</label>
          <input
            value={p2.celebratorsCar}
            onChange={(e) => setP2({ ...p2, celebratorsCar: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Emcee</label>
          <input
            value={p2.emcee}
            onChange={(e) => setP2({ ...p2, emcee: e.target.value })}
          />
        </div>
      </div>
      <div className="form-row two">
        <div className="form-group">
          <label>Sound System</label>
          <input
            value={p2.soundSystem}
            onChange={(e) => setP2({ ...p2, soundSystem: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Tent</label>
          <input
            value={p2.tent}
            onChange={(e) => setP2({ ...p2, tent: e.target.value })}
          />
        </div>
      </div>
      <div className="form-group">
        <label>Celebrator's Chair</label>
        <input
          value={p2.celebratorsChair}
          onChange={(e) => setP2({ ...p2, celebratorsChair: e.target.value })}
        />
      </div>

      <h4>How did you know our company? <span className="required-asterisk">*</span></h4>
      <div className="checkbox-grid">
        {[
          ["knowUsWebsite", "Website"],
          ["knowUsFacebook", "Facebook"],
          ["knowUsInstagram", "Instagram"],
          ["knowUsFlyers", "Flyers"],
          ["knowUsBillboard", "Billboard Ad"],
          ["knowUsWordOfMouth", "Word of Mouth"],
          ["knowUsVenueReferral", "Venue Referral"],
          ["knowUsRepeatClient", "Repeat Client"],
          ["knowUsBridalFair", "Bridal Fair / Exhibit"],
          ["knowUsFoodTasting", "Food Tasting"],
          ["knowUsCelebrityReferral", "Celebrity Referral"],
          ["knowUsOthers", "Others"],
        ].map(([key, label]) => (
          <label key={key} className="checkbox-item">
            <input
              type="checkbox"
              checked={p2[key]}
              onChange={(e) => setP2({ ...p2, [key]: e.target.checked })}
            />{" "}
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default Page2Chairs;
