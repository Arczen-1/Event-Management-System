// DatabaseService.js
const SHEET_ID = '17n0-GRnQWhQVDme94Uz3E0WOru_nP8AMH2v3QhEL9rQ';
const SHEET_W = '1QF9QcRZkac50kZjVsMjVcESozR8m2M2yX4TxQ4UvLCk';
const SHEET_C = '1kPPmbaAkafCTfnybVKEKExrY4G0roIjyMfSBtQ6fOs4';

// Fallback data in case Google Sheets is unavailable
const FALLBACK_DATA = {
  themeSetups: [
    { id: 1, name: 'Romantic Garden', category: 'Theme' },
    { id: 2, name: 'Modern Minimalist', category: 'Theme' },
    { id: 3, name: 'Vintage Classic', category: 'Theme' },
    { id: 4, name: 'Bohemian Chic', category: 'Theme' },
    { id: 5, name: 'Rustic Elegance', category: 'Theme' },
    { id: 6, name: 'Beach/Tropical', category: 'Theme' },
    { id: 7, name: 'Winter Wonderland', category: 'Theme' },
    { id: 8, name: 'Art Deco', category: 'Theme' },
    { id: 9, name: 'Fairytale', category: 'Theme' },
    { id: 10, name: 'Industrial', category: 'Theme' }
  ],
  underliners: [
    { id: 1, name: 'White Linen', category: 'Underliner' },
    { id: 2, name: 'Ivory Linen', category: 'Underliner' },
    { id: 3, name: 'Champagne Linen', category: 'Underliner' },
    { id: 4, name: 'Silver Satin', category: 'Underliner' },
    { id: 5, name: 'Gold Satin', category: 'Underliner' },
    { id: 6, name: 'Black Linen', category: 'Underliner' },
    { id: 7, name: 'Navy Blue Linen', category: 'Underliner' },
    { id: 8, name: 'Burgundy Linen', category: 'Underliner' },
    { id: 9, name: 'Emerald Green Linen', category: 'Underliner' },
    { id: 10, name: 'Blush Pink Linen', category: 'Underliner' }
  ],
  toppers: [
    { id: 1, name: 'Ivory Lace', category: 'Topper' },
    { id: 2, name: 'White Lace', category: 'Topper' },
    { id: 3, name: 'Gold Sequined', category: 'Topper' },
    { id: 4, name: 'Silver Sequined', category: 'Topper' },
    { id: 5, name: 'Crystal Beaded', category: 'Topper' },
    { id: 6, name: 'Pearl Embroidered', category: 'Topper' },
    { id: 7, name: 'Satin Ribbon', category: 'Topper' },
    { id: 8, name: 'Velvet Runner', category: 'Topper' },
    { id: 9, name: 'Organza Overlay', category: 'Topper' },
    { id: 10, name: 'Tulle Skirt', category: 'Topper' }
  ],
  flowerArrangements: [
    { id: 1, name: 'Rose Arch Backdrop', category: 'Flower' },
    { id: 2, name: 'Orchid Wall', category: 'Flower' },
    { id: 3, name: 'Mixed Seasonal Flowers', category: 'Flower' },
    { id: 4, name: 'Tropical Leaves Backdrop', category: 'Flower' },
    { id: 5, name: 'Crystal Curtain', category: 'Flower' },
    { id: 6, name: 'Fabric Draping', category: 'Flower' },
    { id: 7, name: 'Floral Chandelier', category: 'Flower' },
    { id: 8, name: 'Greenery Wall', category: 'Flower' },
    { id: 9, name: 'Paper Flower Backdrop', category: 'Flower' },
    { id: 10, name: 'LED Light Backdrop', category: 'Flower' }
  ],
  centerpieces: [
    { id: 1, name: 'Tall Crystal Vase', category: 'Centerpiece' },
    { id: 2, name: 'Low Rose Arrangement', category: 'Centerpiece' },
    { id: 3, name: 'Floating Candles', category: 'Centerpiece' },
    { id: 4, name: 'Mixed Garden Flowers', category: 'Centerpiece' },
    { id: 5, name: 'Orchid Centerpiece', category: 'Centerpiece' },
    { id: 6, name: 'Tropical Flowers', category: 'Centerpiece' },
    { id: 7, name: 'Succulent Garden', category: 'Centerpiece' },
    { id: 8, name: 'Hydrangea Ball', category: 'Centerpiece' },
    { id: 9, name: 'Candle Cluster', category: 'Centerpiece' },
    { id: 10, name: 'Fruit Display', category: 'Centerpiece' }
  ],
  cakeTableArrangements: [
    { id: 1, name: 'Floral Garland', category: 'Cake Table' },
    { id: 2, name: 'Crystal Accents', category: 'Cake Table' },
    { id: 3, name: 'Rose Petals', category: 'Cake Table' },
    { id: 4, name: 'Greenery Runner', category: 'Cake Table' },
    { id: 5, name: 'Themed Decor', category: 'Cake Table' },
    { id: 6, name: 'Candle Display', category: 'Cake Table' },
    { id: 7, name: 'Fabric Draping', category: 'Cake Table' },
    { id: 8, name: 'Seasonal Flowers', category: 'Cake Table' },
    { id: 9, name: 'Custom Signage', category: 'Cake Table' },
    { id: 10, name: 'Photo Frame Display', category: 'Cake Table' }
  ],
  chairs: [
    { id: 1, name: 'Monoblock Chair', category: 'Chair' },
    { id: 2, name: 'Rustic Wood Chair', category: 'Chair' },
    { id: 3, name: 'Tiffany Chair', category: 'Chair' },
    { id: 4, name: 'Premium Banquet Chair', category: 'Chair' },
    { id: 5, name: 'Crystal Chair', category: 'Chair' },
    { id: 6, name: 'Chiavari Chair', category: 'Chair' },
    { id: 7, name: 'Ghost Chair', category: 'Chair' },
    { id: 8, name: 'Cross Back Chair', category: 'Chair' },
    { id: 9, name: 'Bamboo Chair', category: 'Chair' },
    { id: 10, name: 'Louis Chair', category: 'Chair' }
  ],
  specialRequirements: [
    { id: 1, name: 'Classic Round Cake', category: 'Cake' },
    { id: 2, name: 'Tiered Wedding Cake', category: 'Cake' },
    { id: 3, name: 'Cupcake Tower', category: 'Cake' },
    { id: 4, name: 'Dessert Table', category: 'Cake' },
    { id: 5, name: 'Chocolate Flavor', category: 'Flavor' },
    { id: 6, name: 'Vanilla Flavor', category: 'Flavor' },
    { id: 7, name: 'Red Velvet Flavor', category: 'Flavor' },
    { id: 8, name: 'Fruit Flavor', category: 'Flavor' },
    { id: 9, name: 'Sweet Cakes Supplier', category: 'Supplier' },
    { id: 10, name: 'Delicious Bakes Supplier', category: 'Supplier' },
    { id: 11, name: 'Premium Cakes Co.', category: 'Supplier' },
    { id: 12, name: 'Luxury Sedan', category: 'Transportation' },
    { id: 13, name: 'Vintage Car', category: 'Transportation' },
    { id: 14, name: 'SUV Service', category: 'Transportation' },
    { id: 15, name: 'Basic Sound System', category: 'Audio Visual' },
    { id: 16, name: 'Premium Sound System', category: 'Audio Visual' },
    { id: 17, name: 'DJ Package', category: 'Audio Visual' },
    { id: 18, name: 'Small Tent (10x10)', category: 'Tent' },
    { id: 19, name: 'Medium Tent (20x20)', category: 'Tent' },
    { id: 20, name: 'Large Tent (30x40)', category: 'Tent' },
    { id: 21, name: 'Throne Chair', category: 'Chairs' },
    { id: 22, name: 'Love Seat', category: 'Chairs' },
    { id: 23, name: 'Decorative Chair', category: 'Chairs' }
  ]
};

export const DatabaseService = {
  async fetchData(sheetName) {
    try {
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
      const response = await fetch(sheetUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      const json = JSON.parse(text.substring(47).slice(0, -2));
      
      return json.table.rows.map((row, index) => ({
        id: row.c[0]?.v || index + 1,
        name: row.c[1]?.v || '',
        category: row.c[2]?.v || sheetName
      }));
    } catch (error) {
      console.warn(`Error fetching ${sheetName}, using fallback data:`, error);
      return FALLBACK_DATA[this.getFallbackKey(sheetName)] || [];
    }
  },

  async fetchDataWarehouse(sheetName) {
    try {
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_W}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
      const response = await fetch(sheetUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      const json = JSON.parse(text.substring(47).slice(0, -2));
      
      return json.table.rows.map((row, index) => ({
        id: row.c[0]?.v || index + 1,
        name: row.c[1]?.v || '',
        category: row.c[2]?.v || sheetName
      }));
    } catch (error) {
      console.warn(`Error fetching ${sheetName}, using fallback data:`, error);
      return FALLBACK_DATA[this.getFallbackKey(sheetName)] || [];
    }
  },

  async fetchDataCreatives(sheetName) {
    try {
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_C}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
      const response = await fetch(sheetUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      const json = JSON.parse(text.substring(47).slice(0, -2));
      
      return json.table.rows.map((row, index) => ({
        id: row.c[0]?.v || index + 1,
        name: row.c[1]?.v || '',
        category: row.c[2]?.v || sheetName
      }));
    } catch (error) {
      console.warn(`Error fetching ${sheetName}, using fallback data:`, error);
      return FALLBACK_DATA[this.getFallbackKey(sheetName)] || [];
    }
  },


  getFallbackKey(sheetName) {
    const keyMap = {
      'Theme_Setups': 'themeSetups',
      'Underliners': 'underliners',
      'Toppers': 'toppers',
      'Flower_Arrangements': 'flowerArrangements',
      'Centerpieces': 'centerpieces',
      'Cake_Table_Arrangements': 'cakeTableArrangements',
      'Chairs': 'chairs',
      'Special_Requirements': 'specialRequirements'
    };
    return keyMap[sheetName];
  },

  // Specific data fetchers
  async getThemeSetups() {
    return this.fetchData('Theme_Setups');
  },

   async getNapkin() {
    return this.fetchData('Table Napkin');
  },

  async getUnderliners() {
    return this.fetchData('Table Cloth');
  },

  async getToppers() {
    return this.fetchData('Topper');
  },

  async getBackdrop() {
    return this.fetchDataCreatives('Backdrop');
  },

  async getFlowers() {
    return this.fetchDataCreatives('Flowers');
  },

  async getDecor() {
    return this.fetchDataWarehouse('Decor');
  },

  async getChairs() {
    return this.fetchData('Chairs');
  },

  async getEntrance() {
    return this.fetchDataCreatives('Entrance');
  },

  async getStaging() {
    return this.fetchDataWarehouse('Staging');
  },
  
  async getEquipments() {
    return this.fetchDataWarehouse('Audio & Lighting');
  },

  async getMiscellaneous() {
    return this.fetchDataWarehouse('Miscellaneous');
  },

  async getSpecialRequirements() {
    return this.fetchData('Special_Requirements');
  }
};