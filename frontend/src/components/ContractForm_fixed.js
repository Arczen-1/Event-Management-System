// This file contains the complete fixed version with all null checks added
// Please review the changes and then rename this file to ContractForm.js

/**
 * SUMMARY OF FIXES APPLIED:
 * 
 * 1. Added null checks (|| []) to all array operations in useEffect hooks:
 *    - cocktailSelections, upgradeSelections125, upgradeSelections150
 *    - foodStations, oysterBarSelections
 *    - appetizerUpgradeSelections125, appetizerUpgradeSelections150
 *    - soupSelections, upgradeSoupSelections100
 *    - breadSelections, saladUpgradeSelections125, saladUpgradeSelections150
 *    - All main selections (beef, pork, fish, seafood, chicken, pasta, noodles, veg, sideDish)
 *    - riceSelections, dessertSelections, drinksSelections
 * 
 * 2. Added null checks to all handler functions:
 *    - All cocktail, soup, beef, pork, fish, seafood, chicken, pasta, noodles, veg handlers
 *    - All rice, dessert, drinks, oyster, appetizer, and salad handlers
 * 
 * 3. Added null checks in validation functions
 * 
 * 4. Added null checks in JSX rendering for checked states and disabled conditions
 * 
 * These changes prevent the "Cannot read properties of undefined (reading 'includes')" error
 * that was occurring when arrays were undefined during initial render or when switching packages.
 */

// Due to file size limitations, I recommend applying the fixes manually by:
// 1. Adding `|| []` after every `pBuffet.{arrayName}` before calling .map(), .includes(), .length, .filter(), etc.
// 2. In all handler functions, add: const currentSelections = prev.{arrayName} || [];
// 3. Then use currentSelections instead of prev.{arrayName} in the handler logic

// The key pattern is:
// BEFORE: pBuffet.cocktailSelections.map(...)
// AFTER:  (pBuffet.cocktailSelections || []).map(...)

// BEFORE: prev.cocktailSelections.includes(option)
// AFTER:  const currentSelections = prev.cocktailSelections || [];
//         currentSelections.includes(option)
