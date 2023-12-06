const Lebarocopro = require('../models/lebarocopro');
const Copropriete = require('../models/copropriete');
const mongoose = require('mongoose');
const { Types } = require('mongoose');
const MongoDB = require('../utils/mongodb');

mongoose.set('useFindAndModify', false);

async function connectAndExecute(callback) {
  try {
    console.log('Connecting to MongoDB');
    await mongoose.connection.readyState || await MongoDB.connectToDatabase();
    return await callback();
  } catch (error) {
    handleMongoError('MongoDB error:', error);
  } finally {
    console.log('Closing MongoDB connection');
    await MongoDB.closeConnection();
  }
}

function handleMongoError(message, error) {
  console.error(message, error.message);
  throw error;
}

async function addLebarocopro(jsonData) {
  try {
    await connectAndExecute(async () => {
      for (const record of jsonData) {
        try {
          const coproprieteDocument = await Copropriete.findOne({ id: record.id });

          if (coproprieteDocument) {
            await Lebarocopro.create({
              idCopro: coproprieteDocument._id,
              note: parseInt(record.value),
              date: new Date(record.date),
            });
          } else {
            console.warn(`No copropriete found for id: ${record.id}`);
          }
        } catch (error) {
          console.error(`Error processing record for id: ${record.id}`, error.message);
        }
      }

      console.log('JSON data processed successfully');
    });
  } catch (error) {
    console.error('Error processing JSON data:', error.message);
    throw error;
  }
}

async function listCopropriete() {
  return connectAndExecute(async () => {
    const coproprieteCollection = mongoose.connection.collection('copropriete');
    return await coproprieteCollection.find({}).toArray();
  });
}

async function detailsCopropriete(id) {
  return connectAndExecute(async () => {
    const coproprieteCollection = mongoose.connection.collection('copropriete');
    return await coproprieteCollection.findOne({ _id: Types.ObjectId(id) });
  });
}

async function addCopropriete(newCoproprieteData) {
  return connectAndExecute(async () => {
    const coproprieteCollection = mongoose.connection.collection('copropriete');
    return await coproprieteCollection.insertOne(newCoproprieteData);
  });
}

async function editCopropriete(id, updatedCoproprieteData) {
  return connectAndExecute(async () => {
    const coproprieteCollection = mongoose.connection.collection('copropriete');
    return await coproprieteCollection.findOneAndUpdate(
      { _id: Types.ObjectId(id) },
      { $set: updatedCoproprieteData },
      { returnDocument: 'after' }
    );
  });
}

async function countOffers() {
  return connectAndExecute(async () => {
    const coproprieteCollection = mongoose.connection.collection('copropriete');
    const offerCounts = await coproprieteCollection.aggregate([
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

    console.log('Offer counts:', offerCounts);

    return offerCounts;
  });
}

async function countCoproprieteWithoutSuiviAG() {
  return connectAndExecute(async () => {
    const coproprieteCollection = mongoose.connection.collection('copropriete');

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

async function getLastTemporalRecord(idCopro) {
  return connectAndExecute(async () => {
    const lebarocoproCollection = mongoose.connection.collection('lebarocopro');
    const objectIdCopro = new Types.ObjectId(idCopro);

    try {
      const result = await lebarocoproCollection.aggregate([
        {
          $match: {
            idCopro: objectIdCopro,
          },
        },
        {
          $sort: {
            date: -1,
          },
        },
        {
          $limit: 1,
        },
        {
          $project: {
            _id: 0,
            note: 1,
          },
        },
      ]).toArray();

      if (result.length > 0) {
        console.log('Last temporal record:', result[0]);
        return result[0].note;
      } else {
        console.log('No temporal records found for idCopro:', idCopro);
        return null;
      }
    } catch (error) {
      console.error('Error getting last temporal record:', error.message);
      throw error;
    }
  });
}

module.exports = {
  addLebarocopro,
  listCopropriete,
  detailsCopropriete,
  addCopropriete,
  editCopropriete,
  countOffers,
  countCoproprieteWithoutSuiviAG,
  getLastTemporalRecord,
};
