const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');

mongoose.set('useFindAndModify', false);

function connectAndExecute(callback) {
  console.log('Connecting to MongoDB');
  return new Promise(async (resolve, reject) => {
    try {
      await MongoDB.connectToDatabase();
      const result = await callback();
      console.log('Closing MongoDB connection');
      await MongoDB.closeConnection();
      resolve(result);
    } catch (error) {
      console.error('Error connecting and executing:', error.message);
      await MongoDB.closeConnection();
      reject(error);
    }
  });
}

async function listCopropriete() {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    return await coproprieteCollection.find({}).toArray();
  });
}

async function detailsCopropriete(id) {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    return await coproprieteCollection.findOne({ _id: mongoose.Types.ObjectId(id) });
  });
}

async function addCopropriete(newCoproprieteData) {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    return await coproprieteCollection.insertOne(newCoproprieteData);
  });
}

async function editCopropriete(id, updatedCoproprieteData) {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    return await coproprieteCollection.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId(id) },
      { $set: updatedCoproprieteData },
      { returnDocument: 'after' }
    );
  });
}

async function countOffers() {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    return await coproprieteCollection.aggregate([
      {
        $group: {
          _id: '$Offre',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          Offre: '$_id',
          count: 1,
        },
      },
    ]).toArray();
  });
}

async function countCoproprieteWithoutSuiviAG() {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');

    try {
      const result = await coproprieteCollection.aggregate([
        {
          $lookup: {
            from: 'suiviAG',
            localField: '_id',
            foreignField: 'idCopro',
            as: 'suiviAG',
          },
        },
        {
          $match: {
            'suiviAG': { $size: 0 },
          },
        },
        {
          $count: 'count',
        },
      ]).toArray();

      console.log('Count of copropriete documents without suiviAG:', result);

      return result.length > 0 ? result[0].count : 0;
    } catch (error) {
      console.error('Error counting copropriete without suiviAG:', error.message);
      throw error;
    }
  });
}

module.exports = {
  listCopropriete,
  detailsCopropriete,
  addCopropriete,
  editCopropriete,
  countOffers,
  countCoproprieteWithoutSuiviAG,
};
