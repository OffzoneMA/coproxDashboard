// Migration script to convert person.active from number to boolean
// Run this once to migrate existing data

const MongoDB = require('./mongodb');
const mongoose = require('mongoose');

async function migratePersonActiveToBoolean() {
  try {
    console.log('🔄 Starting migration: Converting person.active from number to boolean...');
    
    await MongoDB.connectToDatabase();
    const personCollection = MongoDB.getCollection('people');
    
    // Find all persons
    const allPersons = await personCollection.find({}).toArray();
    console.log(`📊 Found ${allPersons.length} persons to check`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let addedActiveFieldCount = 0;
    
    for (const person of allPersons) {
      let needsUpdate = false;
      const updates = {};
      
      // Check if active field exists and is a number
      if (person.active !== undefined) {
        if (typeof person.active === 'number') {
          // Convert number to boolean (1 = true, 0 or other = false)
          updates.active = person.active === 1;
          needsUpdate = true;
          console.log(`Converting ${person.email}: active ${person.active} (number) -> ${updates.active} (boolean)`);
        } else if (typeof person.active === 'boolean') {
          skippedCount++;
        }
      } else {
        // Add active field if missing (default to true for existing users)
        updates.active = true;
        needsUpdate = true;
        addedActiveFieldCount++;
        console.log(`Adding active field for ${person.email}: true (default)`);
      }
      
      // Add lastSyncDate if missing
      if (!person.lastSyncDate) {
        updates.lastSyncDate = new Date();
        needsUpdate = true;
      }
      
      // Add timestamps if missing
      if (!person.createdAt) {
        updates.createdAt = new Date();
        needsUpdate = true;
      }
      
      if (!person.updatedAt) {
        updates.updatedAt = new Date();
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await personCollection.updateOne(
          { _id: person._id },
          { $set: updates }
        );
        updatedCount++;
      }
    }
    
    console.log('\n✅ Migration complete!');
    console.log(`   - Total persons: ${allPersons.length}`);
    console.log(`   - Updated: ${updatedCount}`);
    console.log(`   - Already boolean: ${skippedCount}`);
    console.log(`   - Active field added: ${addedActiveFieldCount}`);
    
    return {
      success: true,
      totalPersons: allPersons.length,
      updated: updatedCount,
      skipped: skippedCount,
      activeFieldAdded: addedActiveFieldCount
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Allow running directly or importing
if (require.main === module) {
  migratePersonActiveToBoolean()
    .then(result => {
      console.log('\n✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migratePersonActiveToBoolean;
