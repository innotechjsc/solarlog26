// Script to test MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');

// Get MongoDB URI from command line argument or environment variable
const mongoUri = process.argv[2] || process.env.MONGODB_URI || 'mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin';

console.log('========================================');
console.log('Testing MongoDB Connection');
console.log('========================================');
console.log('');
console.log('MongoDB URI:', mongoUri.replace(/:[^:@]+@/, ':****@'));
console.log('');

// Set connection timeout
const connectionOptions = {
  serverSelectionTimeoutMS: 5000, // 5 seconds
  socketTimeoutMS: 5000,
};

// Connect to MongoDB
mongoose.connect(mongoUri, connectionOptions)
  .then(() => {
    console.log('✅ SUCCESS: Connected to MongoDB!');
    console.log('');
    
    // Get database name
    const db = mongoose.connection.db;
    console.log('Database name:', db.databaseName);
    
    // List collections
    return db.listCollections().toArray();
  })
  .then((collections) => {
    console.log('');
    console.log('Collections found:', collections.length);
    if (collections.length > 0) {
      console.log('');
      collections.forEach((col) => {
        console.log('  -', col.name);
      });
    }
    
    // Get collection counts
    const db = mongoose.connection.db;
    const promises = collections.map(col => 
      db.collection(col.name).countDocuments().then(count => ({
        name: col.name,
        count: count
      }))
    );
    
    return Promise.all(promises);
  })
  .then((counts) => {
    if (counts.length > 0) {
      console.log('');
      console.log('Document counts:');
      counts.forEach(item => {
        console.log(`  - ${item.name}: ${item.count} documents`);
      });
    }
    
    console.log('');
    console.log('========================================');
    console.log('Connection test completed successfully!');
    console.log('========================================');
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ ERROR: Failed to connect to MongoDB');
    console.error('');
    console.error('Error details:');
    console.error('  Message:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('');
      console.error('Possible causes:');
      console.error('  1. MongoDB server is not running');
      console.error('  2. Network connectivity issue');
      console.error('  3. Firewall blocking the connection');
      console.error('  4. Wrong host/port in connection string');
      console.error('  5. Authentication credentials are incorrect');
    } else if (error.name === 'MongoAuthenticationError') {
      console.error('');
      console.error('Possible causes:');
      console.error('  1. Username or password is incorrect');
      console.error('  2. authSource parameter is wrong');
      console.error('  3. User does not have permission to access the database');
    }
    
    console.error('');
    process.exit(1);
  });

// Handle process termination
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('');
    console.log('Connection closed');
    process.exit(0);
  });
});
