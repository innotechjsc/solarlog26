// MongoDB initialization script
// Creates indexes and collections

db = db.getSiblingDB('solarlogger');

// Create indexes for data_points collection
db.data_points.createIndex({ device_id: 1, timestamp: -1 });
db.data_points.createIndex({ timestamp: -1 }, { expireAfterSeconds: 604800 }); // 7 days TTL

// Create indexes for hourly_summaries collection
db.hourly_summaries.createIndex({ device_id: 1, hour: -1 });
db.hourly_summaries.createIndex({ hour: -1 }, { expireAfterSeconds: 31536000 }); // 1 year TTL

// Create indexes for daily_summaries collection
db.daily_summaries.createIndex({ device_id: 1, date: -1 });
db.daily_summaries.createIndex({ date: -1 }, { expireAfterSeconds: 157680000 }); // 5 years TTL

// Create indexes for alarms collection
db.alarms.createIndex({ device_id: 1, start_time: -1 });
db.alarms.createIndex({ status: 1, severity: 1 });
db.alarms.createIndex({ start_time: -1 }, { expireAfterSeconds: 63072000 }); // 2 years TTL

// Create indexes for devices collection
db.devices.createIndex({ device_id: 1 }, { unique: true });
db.devices.createIndex({ project_id: 1, area_id: 1 });
db.devices.createIndex({ project_id: 1, status: 1 });
db.devices.createIndex({ area_id: 1, status: 1 });

// Create indexes for projects collection
db.projects.createIndex({ code: 1 }, { unique: true });
db.projects.createIndex({ status: 1 });

// Create indexes for areas collection
db.areas.createIndex({ project_id: 1, code: 1 }, { unique: true });
db.areas.createIndex({ project_id: 1, status: 1 });

print('MongoDB indexes created successfully!');


