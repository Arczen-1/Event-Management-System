const { MongoClient } = require('mongodb');

// MongoDB connection URI - update with your credentials
const uri = 'mongodb+srv://CapIT2467:CAPSTONE67@capstone.a1edsw6.mongodb.net/?appName=CAPSTONE';
const dbName = 'test'; // Change to your database name

async function setupDatabase() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);

    // ====== 1. POST EVENT CHECKLISTS COLLECTION ======
    const postEventChecklists = db.collection('post_event_checklists');
    
    // Create indexes for post_event_checklists
    await postEventChecklists.createIndex({ contractId: 1 });
    await postEventChecklists.createIndex({ contractNumber: 1 });
    await postEventChecklists.createIndex({ createdAt: -1 });
    await postEventChecklists.createIndex({ submittedBy: 1 });

    console.log('✅ post_event_checklists collection setup complete');

    // ====== 2. FABRICATION REQUESTS COLLECTION ======
    const fabricationRequests = db.collection('fabrication_requests');
    
    // Create indexes for fabrication_requests
    await fabricationRequests.createIndex({ status: 1 });
    await fabricationRequests.createIndex({ department: 1 });
    await fabricationRequests.createIndex({ itemId: 1 });
    await fabricationRequests.createIndex({ username: 1 });
    await fabricationRequests.createIndex({ createdAt: -1 });
    await fabricationRequests.createIndex({ updatedAt: -1 });

    console.log('✅ fabrication_requests collection setup complete');

    // ====== 3. ENSURE EXISTING COLLECTIONS HAVE PROPER INDEXES ======

    // Contracts collection indexes
    const contracts = db.collection('contracts');
    await contracts.createIndex({ contractNumber: 1 }, { unique: true });
    await contracts.createIndex({ status: 1 });
    await contracts.createIndex({ 'page1.eventDate': 1 });
    await contracts.createIndex({ createdAt: -1 });

    console.log('✅ contracts collection indexes verified');

    // Inventory collection indexes
    const inventory = db.collection('inventory');
    await inventory.createIndex({ 'Item Id': 1 });
    await inventory.createIndex({ Department: 1 });
    await inventory.createIndex({ Category: 1 });
    await inventory.createIndex({ 'Item Name': 1 });

    console.log('✅ inventory collection indexes verified');

    // Invoices collection indexes (if exists)
    const invoices = db.collection('invoices');
    await invoices.createIndex({ invoiceNumber: 1 }, { unique: true });
    await invoices.createIndex({ contractId: 1 });
    await invoices.createIndex({ status: 1 });
    await invoices.createIndex({ issueDate: -1 });

    console.log('✅ invoices collection indexes verified');

    // ====== 4. INSERT SAMPLE DATA (OPTIONAL) ======
    await insertSampleData(db);

    console.log('\n🎉 Database schema setup completed successfully!');
    console.log('Collections created:');
    console.log('  - post_event_checklists');
    console.log('  - fabrication_requests');
    console.log('  - contracts (indexes updated)');
    console.log('  - inventory (indexes updated)');
    console.log('  - invoices (indexes updated)');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

async function insertSampleData(db) {
  console.log('\nInserting sample data...');

  // Sample fabrication requests
  const fabricationRequests = db.collection('fabrication_requests');
  
  const sampleRequests = [
    {
      username: 'creative_user',
      item: 'Red Velvet Backdrop',
      itemId: 'BACK001',
      quantity: 5,
      remarks: 'Need for upcoming wedding events',
      requestType: 'restock',
      currentStock: 2,
      department: 'creative',
      status: 'pending',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      username: 'creative_manager',
      item: 'Floral Centerpieces',
      itemId: 'FLWR001',
      quantity: 20,
      remarks: 'Low stock for corporate events',
      requestType: 'restock',
      currentStock: 5,
      department: 'creative',
      status: 'approved',
      approvedBy: 'purchasing_manager',
      approvedAt: new Date('2024-01-16'),
      createdAt: new Date('2024-01-14'),
      updatedAt: new Date('2024-01-16')
    },
    {
      username: 'event_coordinator',
      item: 'Sound System',
      itemId: 'AUDIO001',
      quantity: 2,
      remarks: 'Additional equipment for large venue',
      requestType: 'fabrication',
      currentStock: 3,
      department: 'creative',
      status: 'completed',
      approvedBy: 'purchasing_manager',
      approvedAt: new Date('2024-01-10'),
      receivedBy: 'warehouse_manager',
      receivedAt: new Date('2024-01-12'),
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-12')
    }
  ];

  await fabricationRequests.insertMany(sampleRequests);
  console.log('✅ Sample fabrication requests inserted');

  // Sample post-event checklist
  const postEventChecklists = db.collection('post_event_checklists');
  
  const sampleChecklist = {
    contractId: '65a1b2c3d4e5f67890123456', // Sample contract ID
    contractNumber: 'CTR-2024-001',
    checklistItems: [
      {
        id: 'backdrop-wedding-arch',
        name: 'Backdrop: Wedding Arch',
        category: 'backdrop',
        checked: true,
        missing: false
      },
      {
        id: 'flower-centerpieces',
        name: 'Flower: Centerpieces',
        category: 'flower',
        checked: true,
        missing: false
      },
      {
        id: 'decor-fairy-lights',
        name: 'Decor: Fairy Lights',
        category: 'decor',
        checked: false,
        missing: true
      },
      {
        id: 'emcee',
        name: 'Emcee: John Doe',
        category: 'special',
        checked: true,
        missing: false
      }
    ],
    missingItems: [
      {
        id: 'decor-fairy-lights',
        name: 'Decor: Fairy Lights',
        category: 'decor'
      }
    ],
    submittedBy: 'creative_supervisor',
    submittedAt: new Date('2024-01-20'),
    createdAt: new Date('2024-01-20'),
    status: 'submitted'
  };

  await postEventChecklists.insertOne(sampleChecklist);
  console.log('✅ Sample post-event checklist inserted');

  // Update some contracts to have 'Completed' status for testing
  const contracts = db.collection('contracts');
  
  // Find a contract to mark as completed (optional - only if you have existing contracts)
  const existingContract = await contracts.findOne({});
  if (existingContract) {
    await contracts.updateOne(
      { _id: existingContract._id },
      { 
        $set: { 
          status: 'Completed',
          updatedAt: new Date()
        } 
      }
    );
    console.log('✅ Updated sample contract status to "Completed"');
  }
}

// ====== SCHEMA VALIDATION SETUP ======
async function setupSchemaValidation(db) {
  console.log('\n🔧 Setting up schema validation...');

  // Schema validation for fabrication_requests
  await db.command({
    collMod: 'fabrication_requests',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['username', 'item', 'quantity', 'status', 'department', 'createdAt'],
        properties: {
          username: { bsonType: 'string' },
          item: { bsonType: 'string' },
          itemId: { bsonType: 'string' },
          quantity: { bsonType: 'int' },
          remarks: { bsonType: 'string' },
          requestType: { 
            bsonType: 'string',
            enum: ['restock', 'fabrication']
          },
          currentStock: { bsonType: 'int' },
          department: { bsonType: 'string' },
          status: {
            bsonType: 'string',
            enum: ['pending', 'approved', 'completed', 'rejected']
          },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' },
          approvedBy: { bsonType: 'string' },
          approvedAt: { bsonType: 'date' },
          receivedBy: { bsonType: 'string' },
          receivedAt: { bsonType: 'date' }
        }
      }
    }
  });

  // Schema validation for post_event_checklists
  await db.command({
    collMod: 'post_event_checklists',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['contractId', 'contractNumber', 'submittedBy', 'createdAt'],
        properties: {
          contractId: { bsonType: 'string' },
          contractNumber: { bsonType: 'string' },
          checklistItems: {
            bsonType: 'array',
            items: {
              bsonType: 'object',
              required: ['id', 'name', 'category', 'checked', 'missing'],
              properties: {
                id: { bsonType: 'string' },
                name: { bsonType: 'string' },
                category: { bsonType: 'string' },
                checked: { bsonType: 'bool' },
                missing: { bsonType: 'bool' }
              }
            }
          },
          missingItems: { bsonType: 'array' },
          submittedBy: { bsonType: 'string' },
          submittedAt: { bsonType: 'date' },
          createdAt: { bsonType: 'date' },
          status: {
            bsonType: 'string',
            enum: ['submitted', 'reviewed']
          }
        }
      }
    }
  });

  console.log('✅ Schema validation rules applied');
}

// ====== DATABASE STATISTICS ======
async function displayDatabaseStats(db) {
  console.log('\n📊 Database Statistics:');
  
  const collections = await db.listCollections().toArray();
  
  for (const collectionInfo of collections) {
    const collection = db.collection(collectionInfo.name);
    const count = await collection.countDocuments();
    const indexes = await collection.indexes();
    
    console.log(`\n📁 ${collectionInfo.name}:`);
    console.log(`   Documents: ${count}`);
    console.log(`   Indexes: ${indexes.length}`);
    
    indexes.forEach(index => {
      console.log(`     - ${index.name} (${Object.keys(index.key).join(', ')})`);
    });
  }
}

// ====== MAIN EXECUTION ======
async function main() {
  console.log('🚀 Starting MongoDB Schema Setup...\n');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    
    // Run setup functions
    await setupDatabase();
    await setupSchemaValidation(db);
    await displayDatabaseStats(db);
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await client.close();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  setupDatabase,
  setupSchemaValidation,
  displayDatabaseStats
};