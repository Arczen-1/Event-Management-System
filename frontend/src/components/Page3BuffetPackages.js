import React from "react";

function Page3BuffetPackages({ p1, pBuffet, setPBuffet, handlePackageSelect }) {
  const getPackagePrice = (pkg, pax) => {
    if (pax >= 100 && pax <= 150) return pkg.price100;
    if (pax >= 151 && pax <= 200) return pkg.price151;
    if (pax >= 201 && pax <= 250) return pkg.price201;
    if (pax >= 251 && pax <= 300) return pkg.price251;
    return 0;
  };

  const packages = [
    {
      name: "Buffet Package 1",
      price100: 650,
      price151: 600,
      price201: 550,
      price251: 500,
      inclusions: [
        "Cocktail Hour (2 selections)",
        "Soup (1 selection)",
        "Main Course (3 selections)",
        "Rice (1 selection)",
        "Dessert (2 selections)",
        "Drinks (2 selections)",
        "Bread (1 selection)",
        "Salad (1 selection)"
      ]
    },
    {
      name: "Buffet Package 2",
      price100: 750,
      price151: 700,
      price201: 650,
      price251: 600,
      inclusions: [
        "Cocktail Hour (3 selections)",
        "Soup (1 selection)",
        "Main Course (4 selections)",
        "Rice (1 selection)",
        "Dessert (2 selections)",
        "Drinks (2 selections)",
        "Bread (1 selection)",
        "Salad (1 selection)"
      ]
    },
    {
      name: "Buffet Package 3",
      price100: 850,
      price151: 800,
      price201: 750,
      price251: 700,
      inclusions: [
        "Cocktail Hour (3 selections)",
        "Soup (1 selection)",
        "Main Course (5 selections)",
        "Rice (1 selection)",
        "Dessert (2 selections)",
        "Drinks (2 selections)",
        "Bread (1 selection)",
        "Salad (1 selection)"
      ]
    }
  ];

  return (
    <div className="page">
      <h4>Buffet Packages</h4>
      <div className="package-grid">
        {packages.map((pkg) => {
          const price = getPackagePrice(pkg, parseInt(p1.totalGuests) || 0);
          const isSelected = pBuffet.selectedPackage === pkg.name;
          return (
            <div
              key={pkg.name}
              className={`package-card ${isSelected ? "selected" : ""}`}
              onClick={() => handlePackageSelect(pkg.name)}
            >
              <h5>{pkg.name}</h5>
              <p className="price">₱{price} per person</p>
              <ul>
                {pkg.inclusions.map((inc, idx) => (
                  <li key={idx}>{inc}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {pBuffet.selectedPackage && (
        <div className="selected-package">
          <h5>Selected Package: {pBuffet.selectedPackage}</h5>
        </div>
      )}
    </div>
  );
}

export default Page3BuffetPackages;
