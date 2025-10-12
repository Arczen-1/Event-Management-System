import React from "react";
import {
  SOUP_OPTIONS,
  UPGRADE_SOUP_OPTIONS,
  MAIN_BEEF_OPTIONS,
  UPGRADE_BEEF_100_OPTIONS,
  UPGRADE_BEEF_125_OPTIONS,
  UPGRADE_BEEF_500_OPTIONS,
  UPGRADE_BEEF_1100_OPTIONS,
  MAIN_PORK_OPTIONS,
  UPGRADE_PORK_200_OPTIONS,
  UPGRADE_PORK_250_OPTIONS,
  UPGRADE_PORK_275_OPTIONS,
  UPGRADE_PORK_15000_OPTIONS,
  MAIN_FISH_OPTIONS,
  MAIN_SEAFOOD_OPTIONS,
  MAIN_CHICKEN_OPTIONS,
  MAIN_PASTA_OPTIONS,
  MAIN_NOODLES_OPTIONS,
  MAIN_VEG_OPTIONS,
  MAIN_SIDE_DISH_OPTIONS,
  RICE_OPTIONS,
  DESSERT_OPTIONS,
  DRINKS_OPTIONS,
  FOOD_STATIONS,
  OYSTER_BAR_OPTIONS,
  APPETIZER_UPGRADE_125_OPTIONS,
  APPETIZER_UPGRADE_150_OPTIONS,
  BREAD_OPTIONS,
  SALAD_UPGRADE_125_OPTIONS,
  SALAD_UPGRADE_150_OPTIONS
} from "./constants";

function Page4MenuSelections({ pBuffet, setPBuffet, p1 }) {
  const handleSelectionChange = (category, value, isChecked) => {
    setPBuffet((prev) => {
      const currentSelections = prev[category] || [];
      let newSelections;
      if (isChecked) {
        newSelections = [...currentSelections, value];
      } else {
        newSelections = currentSelections.filter((item) => item !== value);
      }
      return { ...prev, [category]: newSelections };
    });
  };

  const getLimits = () => {
    const pkg = pBuffet.selectedPackage;
    if (pkg === "Buffet Package 1") {
      return { cocktailLimit: 2, soupLimit: 1, mainLimit: 3, riceLimit: 1, dessertLimit: 2, drinksLimit: 2, breadLimit: 1, saladLimit: 1 };
    } else if (pkg === "Buffet Package 2") {
      return { cocktailLimit: 3, soupLimit: 1, mainLimit: 4, riceLimit: 1, dessertLimit: 2, drinksLimit: 2, breadLimit: 1, saladLimit: 1 };
    } else if (pkg === "Buffet Package 3") {
      return { cocktailLimit: 3, soupLimit: 1, mainLimit: 5, riceLimit: 1, dessertLimit: 2, drinksLimit: 2, breadLimit: 1, saladLimit: 1 };
    }
    return { cocktailLimit: 0, soupLimit: 0, mainLimit: 0, riceLimit: 0, dessertLimit: 0, drinksLimit: 0, breadLimit: 0, saladLimit: 0 };
  };

  const limits = getLimits();

  const renderCheckboxGroup = (title, options, category, limit) => (
    <div className="menu-section">
      <h5>{title} (Select up to {limit})</h5>
      <div className="checkbox-grid">
        {options.map((option) => (
          <label key={option} className="checkbox-item">
            <input
              type="checkbox"
              checked={(pBuffet[category] || []).includes(option)}
              onChange={(e) => handleSelectionChange(category, option, e.target.checked)}
              disabled={!(pBuffet[category] || []).includes(option) && (pBuffet[category] || []).length >= limit}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="page">
      <h4>Buffet Menu Selections</h4>
      {renderCheckboxGroup("Cocktail Hour", pBuffet.cocktailSelections || [], "cocktailSelections", limits.cocktailLimit)}
      {renderCheckboxGroup("Soup", SOUP_OPTIONS, "soupSelections", limits.soupLimit)}
      <div className="menu-section">
        <h5>Main Course (Select up to {limits.mainLimit})</h5>
        <div className="sub-section">
          <h6>Beef</h6>
          <div className="checkbox-grid">
            {MAIN_BEEF_OPTIONS.map((option) => (
              <label key={option} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={(pBuffet.mainBeefSelections || []).includes(option)}
                  onChange={(e) => handleSelectionChange("mainBeefSelections", option, e.target.checked)}
                  disabled={!(pBuffet.mainBeefSelections || []).includes(option) && (pBuffet.mainBeefSelections || []).length >= limits.mainLimit}
                />
                {option}
              </label>
            ))}
          </div>
          <h6>Beef Upgrades (+100 per pax)</h6>
          <div className="checkbox-grid">
            {UPGRADE_BEEF_100_OPTIONS.map((option) => (
              <label key={option} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={(pBuffet.upgradeBeef100Selections || []).includes(option)}
                  onChange={(e) => handleSelectionChange("upgradeBeef100Selections", option, e.target.checked)}
                />
                {option}
              </label>
            ))}
          </div>
          <h6>Beef Upgrades (+125 per pax)</h6>
          <div className="checkbox-grid">
            {UPGRADE_BEEF_125_OPTIONS.map((option) => (
              <label key={option} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={(pBuffet.upgradeBeef125Selections || []).includes(option)}
                  onChange={(e) => handleSelectionChange("upgradeBeef125Selections", option, e.target.checked)}
                />
                {option}
              </label>
            ))}
          </div>
          <h6>Beef Upgrades (+500 per pax)</h6>
          <div className="checkbox-grid">
            {UPGRADE_BEEF_500_OPTIONS.map((option) => (
              <label key={option} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={(pBuffet.upgradeBeef500Selections || []).includes(option)}
                  onChange={(e) => handleSelectionChange("upgradeBeef500Selections", option, e.target.checked)}
                />
                {option}
              </label>
            ))}
          </div>
          <h6>Beef Upgrades (+1100 per pax)</h6>
          <div className="checkbox-grid">
            {UPGRADE_BEEF_1100_OPTIONS.map((option) => (
              <label key={option} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={(pBuffet.upgradeBeef1100Selections || []).includes(option)}
                  onChange={(e) => handleSelectionChange("upgradeBeef1100Selections", option, e.target.checked)}
                />
                {option}
              </label>
            ))}
          </div>
          <h6>Pork</h6>
          <div className="checkbox-grid">
            {MAIN_PORK_OPTIONS.map((option) => (
              <label key={option} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={(pBuffet.mainPorkSelections || []).includes(option)}
                  onChange={(e) => handleSelectionChange("mainPorkSelections", option, e.target.checked)}
                  disabled={!(pBuffet.mainPorkSelections || []).includes(option) && (pBuffet.mainPorkSelections || []).length >= limits.mainLimit}
                />
                {option}
              </label>
            ))}
          </div>
          <h6>Pork Upgrades (+200 per pax)</h6>
          <div className="checkbox-grid">
            {UPGRADE_PORK_200_OPTIONS.map((option) => (
              <label key={option} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={(pBuffet.upgradePork200Selections || []).includes(option)}
                  onChange={(e) => handleSelectionChange("upgradePork200Selections", option, e.target.checked)}
                />
                {option}
              </label>
            ))}
          </div>
          <h6>Pork Upgrades (+250 per pax)</h6>
          <div className="checkbox-grid">
            {UPGRADE_PORK_250_OPTIONS.map((option) => (
              <label key={option} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={(pBuffet.upgradePork250Selections || []).includes(option)}
                  onChange={(e) => handleSelectionChange("upgradePork250Selections", option, e.target.checked)}
                />
                {option}
              </label>
            ))}
          </div>
          <h6>Pork Upgrades (+275 per pax)</h6>
          <div className="checkbox-grid">
            {UPGRADE_PORK_275_OPTIONS.map((option) => (
              <label key={option} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={(pBuffet.upgradePork275Selections || []).includes(option)}
                  onChange={(e) => handleSelectionChange("upgradePork275Selections", option, e.target.checked)}
                />
                {option}
              </label>
            ))}
          </div>
          <h6>Pork Upgrades (+15,000 (60-70 pax))</h6>
          <div className="checkbox-grid">
            {UPGRADE_PORK_15000_OPTIONS.map((option) => (
              <label key={option} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={(pBuffet.upgradePork15000Selections || []).includes(option)}
                  onChange={(e) => handleSelectionChange("upgradePork15000Selections", option, e.target.checked)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
        {/* Add similar for other mains: Fish, etc. */}
      </div>
      {renderCheckboxGroup("Rice", RICE_OPTIONS, "riceSelections", limits.riceLimit)}
      {renderCheckboxGroup("Dessert", DESSERT_OPTIONS, "dessertSelections", limits.dessertLimit)}
      {renderCheckboxGroup("Drinks", DRINKS_OPTIONS, "drinksSelections", limits.drinksLimit)}
      {renderCheckboxGroup("Bread", BREAD_OPTIONS, "breadSelections", limits.breadLimit)}
      {renderCheckboxGroup("Salad", SALAD_UPGRADE_125_OPTIONS.concat(SALAD_UPGRADE_150_OPTIONS), "saladSelections", limits.saladLimit)}
      {/* Add food stations, oyster bar, etc. */}
    </div>
  );
}

export default Page4MenuSelections;
