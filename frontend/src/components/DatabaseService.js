// DatabaseService.js
const SHEET = '1W2mam3XSwOJpJH2FmAgvTWJf5nRVimD8xFmv5E86uKI';

// Comprehensive fallback data for all methods
const FALLBACK_DATA = {
  themeSetups: [
    { id: 1, name: 'Romantic Garden', category: 'Theme Setup', department: 'Linen', price: 0 },
    { id: 2, name: 'Modern Minimalist', category: 'Theme Setup', department: 'Linen', price: 0 },
    { id: 3, name: 'Vintage Classic', category: 'Theme Setup', department: 'Linen', price: 0 },
    { id: 4, name: 'Bohemian Chic', category: 'Theme Setup', department: 'Linen', price: 0 },
    { id: 5, name: 'Rustic Elegance', category: 'Theme Setup', department: 'Linen', price: 0 }
  ],
  napkins: [
    { id: 1, name: 'White Linen Napkin', category: 'Napkin', department: 'Linen', price: 0 },
    { id: 2, name: 'Ivory Linen Napkin', category: 'Napkin', department: 'Linen', price: 0 },
    { id: 3, name: 'Champagne Napkin', category: 'Napkin', department: 'Linen', price: 0 },
    { id: 4, name: 'Black Linen Napkin', category: 'Napkin', department: 'Linen', price: 0 },
    { id: 5, name: 'Burgundy Napkin', category: 'Napkin', department: 'Linen', price: 0 }
  ],
  underliners: [
    { id: 1, name: 'White Linen Tablecloth', category: 'Table Cloth', department: 'Linen', price: 0 },
    { id: 2, name: 'Ivory Linen Tablecloth', category: 'Table Cloth', department: 'Linen', price: 0 },
    { id: 3, name: 'Champagne Tablecloth', category: 'Table Cloth', department: 'Linen', price: 0 },
    { id: 4, name: 'Silver Satin Tablecloth', category: 'Table Cloth', department: 'Linen', price: 0 },
    { id: 5, name: 'Gold Satin Tablecloth', category: 'Table Cloth', department: 'Linen', price: 0 }
  ],
  toppers: [
    { id: 1, name: 'Ivory Lace Topper', category: 'Topper', department: 'Linen', price: 0 },
    { id: 2, name: 'White Lace Topper', category: 'Topper', department: 'Linen', price: 0 },
    { id: 3, name: 'Gold Sequined Topper', category: 'Topper', department: 'Linen', price: 0 },
    { id: 4, name: 'Silver Sequined Topper', category: 'Topper', department: 'Linen', price: 0 },
    { id: 5, name: 'Crystal Beaded Topper', category: 'Topper', department: 'Linen', price: 0 }
  ],
  backdrop: [
    { id: 1, name: 'Floral Arch Backdrop', category: 'Backdrop', department: 'Creatives', price: 0 },
    { id: 2, name: 'Fabric Draping Backdrop', category: 'Backdrop', department: 'Creatives', price: 0 },
    { id: 3, name: 'Crystal Curtain Backdrop', category: 'Backdrop', department: 'Creatives', price: 0 },
    { id: 4, name: 'LED Wall Backdrop', category: 'Backdrop', department: 'Creatives', price: 0 },
    { id: 5, name: 'Green Wall Backdrop', category: 'Backdrop', department: 'Creatives', price: 0 }
  ],
  flowers: [
    { id: 1, name: 'Rose Arrangement', category: 'Flowers', department: 'Creatives', price: 0 },
    { id: 2, name: 'Orchid Centerpiece', category: 'Flowers', department: 'Creatives', price: 0 },
    { id: 3, name: 'Mixed Seasonal Flowers', category: 'Flowers', department: 'Creatives', price: 0 },
    { id: 4, name: 'Tropical Flower Display', category: 'Flowers', department: 'Creatives', price: 0 },
    { id: 5, name: 'Succulent Arrangement', category: 'Flowers', department: 'Creatives', price: 0 }
  ],
  decor: [
    { id: 1, name: 'Candle Holders', category: 'Decor', department: 'Warehouse', price: 0 },
    { id: 2, name: 'Decorative Vases', category: 'Decor', department: 'Warehouse', price: 0 },
    { id: 3, name: 'Table Numbers', category: 'Decor', department: 'Warehouse', price: 0 },
    { id: 4, name: 'Centerpiece Bases', category: 'Decor', department: 'Warehouse', price: 0 },
    { id: 5, name: 'Decorative Mirrors', category: 'Decor', department: 'Warehouse', price: 0 }
  ],
  chairs: [
    { id: 1, name: 'Monoblock Chair', category: 'Chairs', department: 'Warehouse', price: 0 },
    { id: 2, name: 'Tiffany Chair', category: 'Chairs', department: 'Warehouse', price: 0 },
    { id: 3, name: 'Chiavari Chair', category: 'Chairs', department: 'Warehouse', price: 0 },
    { id: 4, name: 'Ghost Chair', category: 'Chairs', department: 'Warehouse', price: 0 },
    { id: 5, name: 'Cross Back Chair', category: 'Chairs', department: 'Warehouse', price: 0 }
  ],
  entrance: [
    { id: 1, name: 'Welcome Sign', category: 'Entrance', department: 'Creatives', price: 0 },
    { id: 2, name: 'Entry Arch', category: 'Entrance', department: 'Creatives', price: 0 },
    { id: 3, name: 'Red Carpet', category: 'Entrance', department: 'Creatives', price: 0 },
    { id: 4, name: 'Welcome Station', category: 'Entrance', department: 'Creatives', price: 0 },
    { id: 5, name: 'Entry Lighting', category: 'Entrance', department: 'Creatives', price: 0 }
  ],
  staging: [
    { id: 1, name: 'Main Stage', category: 'Staging', department: 'Warehouse', price: 0 },
    { id: 2, name: 'Dance Floor', category: 'Staging', department: 'Warehouse', price: 0 },
    { id: 3, name: 'Head Table Setup', category: 'Staging', department: 'Warehouse', price: 0 },
    { id: 4, name: 'Cake Table Setup', category: 'Staging', department: 'Warehouse', price: 0 },
    { id: 5, name: 'DJ Booth Setup', category: 'Staging', department: 'Warehouse', price: 0 }
  ],
  equipments: [
    { id: 1, name: 'Sound System', category: 'Audio & Lighting', department: 'Warehouse', price: 0 },
    { id: 2, name: 'Lighting System', category: 'Audio & Lighting', department: 'Warehouse', price: 0 },
    { id: 3, name: 'Microphones', category: 'Audio & Lighting', department: 'Warehouse', price: 0 },
    { id: 4, name: 'Projector', category: 'Audio & Lighting', department: 'Warehouse', price: 0 },
    { id: 5, name: 'Fog Machine', category: 'Audio & Lighting', department: 'Warehouse', price: 0 }
  ],
  miscellaneous: [
    { id: 1, name: 'Aisle Runner', category: 'Miscellaneous', department: 'Warehouse', price: 0 },
    { id: 2, name: 'Chair Covers', category: 'Miscellaneous', department: 'Warehouse', price: 0 },
    { id: 3, name: 'Sashes', category: 'Miscellaneous', department: 'Warehouse', price: 0 },
    { id: 4, name: 'Table Skirting', category: 'Miscellaneous', department: 'Warehouse', price: 0 },
    { id: 5, name: 'Napkin Rings', category: 'Miscellaneous', department: 'Warehouse', price: 0 }
  ],
  specialRequirements: [
    { id: 1, name: 'Special Cake', category: 'Special Requirements', department: 'External', price: 0 },
    { id: 2, name: 'Transportation', category: 'Special Requirements', department: 'External', price: 0 },
    { id: 3, name: 'Audio Visual', category: 'Special Requirements', department: 'External', price: 0 },
    { id: 4, name: 'Tent Rental', category: 'Special Requirements', department: 'External', price: 0 },
    { id: 5, name: 'Special Seating', category: 'Special Requirements', department: 'External', price: 0 }
  ]
};

export const DatabaseService = {
  async fetchData() {
    try {
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET}/gviz/tq?tqx=out:json`;
      const response = await fetch(sheetUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      const json = JSON.parse(text.substring(47).slice(0, -2));
      
      return json.table.rows.map((row, index) => ({
        id: row.c[0]?.v || index + 1,
        name: row.c[1]?.v || '',
        category: row.c[2]?.v || '',
        department: row.c[5]?.v || '',
        price: row.c[6]?.v || 0
      }));
    } catch (error) {
      console.warn('Error fetching from main sheet, using fallback data:', error);
      // Return combined fallback data
      return Object.values(FALLBACK_DATA).flat();
    }
  },

  // Helper function to filter data by department and category
  async getDataByFilters(department = null, category = null) {
    try {
      const allData = await this.fetchData();
      
      const filtered = allData.filter(item => {
        const matchesDepartment = !department || item.department === department;
        const matchesCategory = !category || item.category === category;
        return matchesDepartment && matchesCategory;
      });

      // If no data found, try to get from fallback
      if (filtered.length === 0) {
        console.warn(`No data found for department: ${department}, category: ${category}, using fallback`);
        // Try to find matching fallback data
        const fallbackKey = Object.keys(FALLBACK_DATA).find(key => 
          FALLBACK_DATA[key][0]?.department === department && 
          FALLBACK_DATA[key][0]?.category === category
        );
        return fallbackKey ? FALLBACK_DATA[fallbackKey] : [];
      }

      return filtered;
    } catch (error) {
      console.warn(`Error filtering data for department: ${department}, category: ${category}`, error);
      return [];
    }
  },

  // All the methods your useEffect is calling
  async getThemeSetups() {
    return this.getDataByFilters('linen', 'Theme Setup');
  },

  async getNapkin() {
    return this.getDataByFilters('linen', 'Table Napkin');
  },

  async getUnderliners() {
    return this.getDataByFilters('linen', 'ROUND TABLE CLOTH');
  },

  async getToppers() {
    return this.getDataByFilters('linen', 'TOPPER');
  },

  async getBackdrop() {
    return this.getDataByFilters('creative', 'Backdrops');
  },

  async getFlowers() {
    return this.getDataByFilters('creative', 'Silk Flowers');
  },

  async getDecor() {
    return this.getDataByFilters('warehouse', 'Decor');
  },

  async getChairs() {
    return this.getDataByFilters('warehouse', 'Chairs');
  },

  async getEntrance() {
    return this.getDataByFilters('creative', 'Entrance');
  },

  async getStaging() {
    return this.getDataByFilters('warehouse', 'Staging');
  },
  
  async getEquipments() {
    return this.getDataByFilters('warehouse', 'Audio & Lighting');
  },

  async getMiscellaneous() {
    return this.getDataByFilters('warehouse', 'Miscellaneous / Office Supplies');
  },

  async getSpecialRequirements() {
    return this.getDataByFilters('warehouse', 'Tables');
  },

  // Add these to your DatabaseService
async getChairs() {
  return this.getDataByFilters('warehouse', 'Chairs');
},

async getTables() {
  return this.getDataByFilters('warehouse', 'Tables');
},

  // Debug method to see what data is available
  async debugData() {
    const allData = await this.fetchData();
    console.log('All available data:', allData);
    
    // Log unique departments and categories
    const departments = [...new Set(allData.map(item => item.department))];
    const categories = [...new Set(allData.map(item => item.category))];
    console.log('Available departments:', departments);
    console.log('Available categories:', categories);
    
    return { allData, departments, categories };
  }
};