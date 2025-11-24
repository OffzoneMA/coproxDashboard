const MongoDB = require('./mongodb');
const mongoose = require('mongoose');

/**
 * Migration script to:
 * 1. Change person.idCopro from single ObjectId to array of ObjectIds
 * 2. Merge duplicate users (same email) into single record with multiple copros
 * 3. Ensure data integrity
 */

async function migrateToMultiCopro() {
  try {
    console.log('🔄 ========== Starting Multi-Copro Migration ==========\n');
    await MongoDB.connectToDatabase();
    const personCollection = MongoDB.getCollection('person');
    
    // Step 1: Find all duplicate emails
    console.log('📊 Step 1: Finding duplicate users...');
    const duplicates = await personCollection.aggregate([
      { $match: { email: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { 
        _id: '$email', 
        count: { $sum: 1 },
        docs: { $push: '$$ROOT' }
      }},
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    console.log(`   Found ${duplicates.length} emails with duplicates\n`);
    
    let mergedCount = 0;
    let deletedCount = 0;
    
    // Step 2: Merge duplicates
    console.log('🔀 Step 2: Merging duplicate users...');
    for (const dup of duplicates) {
      const email = dup._id;
      const docs = dup.docs;
      
      console.log(`   Processing: ${email} (${docs.length} duplicates)`);
      
      // Sort by most recent update or created date
      const sortedDocs = docs.sort((a, b) => {
        const aDate = a.updatedAt || a.createdAt || new Date(0);
        const bDate = b.updatedAt || b.createdAt || new Date(0);
        return bDate - aDate;
      });
      
      // Use the most recent record as base
      const primaryDoc = sortedDocs[0];
      const duplicateDocs = sortedDocs.slice(1);
      
      // Collect all unique copro IDs
      const allCoproIds = new Set();
      docs.forEach(doc => {
        if (doc.idCopro) {
          allCoproIds.add(doc.idCopro.toString());
        }
      });
      
      // Convert to array of ObjectIds
      const coproArray = Array.from(allCoproIds).map(id => new mongoose.Types.ObjectId(id));
      
      console.log(`      Keeping: ${primaryDoc._id}`);
      console.log(`      Copros: ${coproArray.length} unique`);
      console.log(`      Deleting: ${duplicateDocs.length} duplicates`);
      
      // Merge data - prefer non-null values
      const mergedData = {
        idCopro: coproArray, // Now an array
        active: docs.some(d => d.active === true), // Active if ANY record is active
        idZendesk: docs.find(d => d.idZendesk)?.idZendesk || primaryDoc.idZendesk,
        telephone: docs.find(d => d.telephone)?.telephone || primaryDoc.telephone,
        telephone2: docs.find(d => d.telephone2)?.telephone2 || primaryDoc.telephone2,
        mobile: docs.find(d => d.mobile)?.mobile || primaryDoc.mobile,
        mobile2: docs.find(d => d.mobile2)?.mobile2 || primaryDoc.mobile2,
        typePersonne: docs.find(d => d.typePersonne === 'CS')?.typePersonne || primaryDoc.typePersonne,
        url: primaryDoc.url,
        updatedAt: new Date()
      };
      
      // Update primary document
      await personCollection.updateOne(
        { _id: primaryDoc._id },
        { $set: mergedData }
      );
      
      // Delete duplicate documents
      const idsToDelete = duplicateDocs.map(d => d._id);
      const deleteResult = await personCollection.deleteMany({
        _id: { $in: idsToDelete }
      });
      
      mergedCount++;
      deletedCount += deleteResult.deletedCount;
    }
    
    console.log(`\n✅ Merged ${mergedCount} users, deleted ${deletedCount} duplicates\n`);
    
    // Step 3: Convert remaining single idCopro to array
    console.log('🔧 Step 3: Converting single idCopro to arrays...');
    
    const singleCoproUsers = await personCollection.find({
      idCopro: { $exists: true, $not: { $type: 'array' } }
    }).toArray();
    
    console.log(`   Found ${singleCoproUsers.length} users with single idCopro`);
    
    for (const user of singleCoproUsers) {
      if (user.idCopro) {
        await personCollection.updateOne(
          { _id: user._id },
          { $set: { idCopro: [user.idCopro] } }
        );
      }
    }
    
    console.log(`   ✅ Converted ${singleCoproUsers.length} users to array format\n`);
    
    // Step 4: Handle users with no copro
    console.log('🧹 Step 4: Cleaning users with no copro...');
    const noCoproUsers = await personCollection.find({
      $or: [
        { idCopro: { $exists: false } },
        { idCopro: null },
        { idCopro: [] }
      ]
    }).toArray();
    
    console.log(`   Found ${noCoproUsers.length} users with no copro`);
    
    // Set empty array for users with no copro
    await personCollection.updateMany(
      {
        $or: [
          { idCopro: { $exists: false } },
          { idCopro: null }
        ]
      },
      { $set: { idCopro: [] } }
    );
    
    console.log(`   ✅ Set empty array for users with no copro\n`);
    
    // Step 5: Create unique index on email
    console.log('📇 Step 5: Creating unique index on email...');
    try {
      await personCollection.createIndex(
        { email: 1 }, 
        { 
          unique: true, 
          sparse: true,
          name: 'email_unique'
        }
      );
      console.log('   ✅ Unique index created on email\n');
    } catch (error) {
      if (error.code === 11000) {
        console.log('   ⚠️  Unique index already exists\n');
      } else {
        throw error;
      }
    }
    
    // Final statistics
    console.log('📊 Final Statistics:');
    const totalUsers = await personCollection.countDocuments({});
    const uniqueEmails = (await personCollection.distinct('email')).length;
    const multiCoproUsers = await personCollection.countDocuments({
      idCopro: { $exists: true, $type: 'array' },
      $expr: { $gt: [{ $size: '$idCopro' }, 1] }
    });
    
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Unique emails: ${uniqueEmails}`);
    console.log(`   Users with multiple copros: ${multiCoproUsers}`);
    console.log(`   Duplicates: ${totalUsers - uniqueEmails}`);
    
    if (totalUsers === uniqueEmails) {
      console.log('\n✅ ========== Migration Complete - No Duplicates! ==========');
    } else {
      console.log('\n⚠️  Warning: Some duplicates still exist');
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  migrateToMultiCopro().catch(console.error);
}

module.exports = { migrateToMultiCopro };
