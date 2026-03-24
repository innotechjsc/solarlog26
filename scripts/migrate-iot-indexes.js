const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required in .env');
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // Collections used by new ingest rules.
  const dataPoints = db.collection('datapoints');
  const iotAlarms = db.collection('iotalarmevents');
  const iotDispatch = db.collection('iotdispatchmessages');
  const iotSync = db.collection('iotsyncbatches');

  // G1 dedup/read performance: (device_id, sequence)
  await dataPoints.createIndex(
    { device_id: 1, sequence: 1 },
    { name: 'idx_device_sequence', background: true }
  );

  // G4 dedup: message_id, unique but sparse to avoid impacting old docs without message_id.
  await iotAlarms.createIndex(
    { device_id: 1, message_id: 1 },
    { name: 'uq_device_message_id', unique: true, sparse: true, background: true }
  );

  // G5 response dedup/read performance by command_id.
  await iotDispatch.createIndex(
    { device_id: 1, command_id: 1, direction: 1 },
    { name: 'idx_device_command_direction', background: true }
  );

  // G8 replay dedup/read performance.
  await iotSync.createIndex(
    { device_id: 1, batch_id: 1, batch_index: 1 },
    { name: 'idx_device_batch_index', background: true }
  );

  console.log('Migration completed: IoT indexes ensured.');
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Migration failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
