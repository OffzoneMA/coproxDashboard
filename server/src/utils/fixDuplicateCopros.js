const MongoDB = require('./mongodb');

/**
 * Migration script to fix duplicate copros and add unique index
 * This script:
 * 1. Finds duplicate copros by idVilogi
 * 2. Keeps the most recently updated entry
 * 3. Removes older duplicates
 * 4. Creates a unique index on idVilogi
 */

async function fixDuplicates() {
  try {
    console.log('🔍 Starting duplicate cleanup...');
    await MongoDB.connectToDatabase();
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    
    // Find all duplicates
    const duplicates = await coproprieteCollection.aggregate([
      { $match: { idVilogi: { $exists: true, $ne: null } } },
      { $group: { 
        _id: '$idVilogi', 
        count: { $sum: 1 },
        docs: { $push: { id: '$_id', updatedAt: '$updatedAt', createdAt: '$createdAt' } }
      }},
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    console.log(`Found ${duplicates.length} duplicate idVilogi entries`);
    
    let totalDeleted = 0;
    
    // For each duplicate group, keep the most recent and delete the rest
    for (const dup of duplicates) {
      // Sort by updatedAt (most recent first), then createdAt
      const sortedDocs = dup.docs.sort((a, b) => {
        const aDate = a.updatedAt || a.createdAt || new Date(0);
        const bDate = b.updatedAt || b.createdAt || new Date(0);
        return bDate - aDate;
      });
      
      // Keep the first (most recent), delete the rest
      const toKeep = sortedDocs[0].id;
      const toDelete = sortedDocs.slice(1).map(doc => doc.id);
      
      console.log(`  idVilogi ${dup._id}: Keeping ${toKeep}, deleting ${toDelete.length} duplicates`);
      
      const result = await coproprieteCollection.deleteMany({
        _id: { $in: toDelete }
      });
      
      totalDeleted += result.deletedCount;
    }
    
    console.log(`✅ Deleted ${totalDeleted} duplicate entries`);
    
    // Create unique index on idVilogi
    console.log('🔧 Creating unique index on idVilogi...');
    try {
      await coproprieteCollection.createIndex(
        { idVilogi: 1 }, 
        { 
          unique: true, 
          sparse: true, // Allow documents without idVilogi
          name: 'idVilogi_unique'
        }
      );
      console.log('✅ Unique index created successfully');
    } catch (indexError) {
      if (indexError.code === 11000) {
        console.log('⚠️  Unique index already exists');
      } else {
        throw indexError;
      }
    }
    
    // Final count
    const finalCount = await coproprieteCollection.countDocuments({});
    console.log(`\n📊 Final count: ${finalCount} copros in database`);
    
    // Verify no more duplicates
    const remainingDuplicates = await coproprieteCollection.aggregate([
      { $match: { idVilogi: { $exists: true, $ne: null } } },
      { $group: { _id: '$idVilogi', count: { $sum: 1 } }},
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    if (remainingDuplicates.length === 0) {
      console.log('✅ No duplicates remaining - cleanup successful!');
    } else {
      console.log(`⚠️  Warning: ${remainingDuplicates.length} duplicates still exist`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing duplicates:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  fixDuplicates().catch(console.error);
}

module.exports = { fixDuplicates };
