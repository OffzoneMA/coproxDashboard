const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');

mongoose.set('useFindAndModify', false);

async function connectAndExecute(callback) {
  try {
    await MongoDB.connectToDatabase();
    const result = await callback();
    return result;
  } catch (error) {
    console.error('Error connecting and executing:', error.message);
    throw error;
  } 
}

async function listCopropriete() {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    return await coproprieteCollection.find({ status: { $ne: 'Inactif' } }).toArray();
  });
}

async function detailsCopropriete(id) {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    return await coproprieteCollection.findOne({ _id: mongoose.Types.ObjectId(id) });
  });
}
async function detailsCoproprieteByidVilogi(id) {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    return await coproprieteCollection.findOne({ idVilogi: id });
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
  detailsCoproprieteByidVilogi,
  addCopropriete,
  editCopropriete,
  countOffers,
  countCoproprieteWithoutSuiviAG,
};
