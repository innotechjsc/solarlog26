const mongoose = require('mongoose');

// ===== OLD SCHEMA (for backward compatibility) =====
const inverterSchemaOld = new mongoose.Schema({
  id: Number,
  slave_address: Number,
  model: String,
  ac_power: Number,
  ac_voltage_l1: Number,
  ac_current_l1: Number,
  power_factor: Number,
  grid_frequency: Number,
  daily_yield: Number,
  device_state: String,
  alarm_code: Number,
  efficiency: Number,
  internal_temp: Number
}, { _id: false });

const batterySchemaOld = new mongoose.Schema({
  soc: Number, // State of charge %
  charge_power: Number, // Power charging (kW)
  discharge_power: Number, // Power discharging (kW)
  charge_energy_today: Number, // Energy charged today (kWh)
  discharge_energy_today: Number // Energy discharged today (kWh)
}, { _id: false });

const powerFlowSchemaOld = new mongoose.Schema({
  pv_to_grid: Number, // Power from PV to grid (kW)
  pv_to_home: Number, // Power from PV to home/load (kW)
  pv_to_battery: Number, // Power from PV to battery (kW)
  battery_to_home: Number, // Power from battery to home (kW)
  battery_to_grid: Number, // Power from battery to grid (kW)
  grid_to_home: Number // Power from grid to home (kW)
}, { _id: false });

const systemSchemaOld = new mongoose.Schema({
  total_ac_power: Number,
  total_reactive_power: Number,
  avg_power_factor: Number,
  avg_frequency: Number,
  online_inverters: Number,
  total_inverters: Number,
  energy_5min: Number,
  system_state: String
}, { _id: false });

// ===== NEW SCHEMA (Schema Version 0.9.0+) =====
const systemSchemaNew = new mongoose.Schema({
  total_ac_active_power_w: Number,  // Tổng công suất AC (Watt)
  online_inverters: Number,          // Số inverter online
  total_inverters: Number            // Tổng số inverter
}, { _id: false });

const inverterInfoSchema = new mongoose.Schema({
  modbus_address: Number,      // Địa chỉ Modbus (thay slave_address)
  serial_number: String,
  model_name: String,
  inverter_type: String,        // "hybrid_3_phase"
  rated_power_w: Number,
  hw_version: String,
  protocol: String              // "modbus_rtu"
}, { _id: false });

const operatingStateSchema = new mongoose.Schema({
  work_mode: String,            // "normal" / "standby" / "fault"
  grid_mode: String             // "on_grid" / "off_grid"
}, { _id: false });

const signConventionSchema = new mongoose.Schema({
  grid_exchange_active_power: String,  // "positive_import"
  battery_dc_active_power: String      // "positive_charge"
}, { _id: false });

const acMeasurementsSchema = new mongoose.Schema({
  voltage_l1n_v: Number,
  voltage_l2n_v: Number,
  voltage_l3n_v: Number,
  current_l1_a: Number,
  current_l2_a: Number,
  current_l3_a: Number,
  inverter_ac_bus_active_power_w: Number,
  inverter_ac_reactive_power_var: Number,
  inverter_ac_apparent_power_va: Number,
  inverter_ac_bus_active_power_l1_w: Number,
  inverter_ac_bus_active_power_l2_w: Number,
  inverter_ac_bus_active_power_l3_w: Number
}, { _id: false });

const gridInteractionSchema = new mongoose.Schema({
  exchange_active_power_w: Number,
  import_active_power_w: Number,
  export_active_power_w: Number,
  import_energy_today_kwh: Number,
  import_energy_total_kwh: Number,
  export_energy_today_kwh: Number,
  export_energy_total_kwh: Number,
  zero_export_enabled: Boolean,
  export_power_limit_w: Number,
  frequency_hz: Number
}, { _id: false });

const pvInputItemSchema = new mongoose.Schema({
  mppt: Number,
  voltage_v: Number,
  current_a: Number,
  dc_power_w: Number
}, { _id: false });

const pvInputSchema = new mongoose.Schema({
  dc_bus_voltage_v: Number,
  pv_inputs: [pvInputItemSchema]
}, { _id: false });

const batteryStorageSchema = new mongoose.Schema({
  mode: String,                 // "charge" / "discharge" / "idle"
  active_power_w: Number,
  voltage_v: Number,
  current_a: Number,
  soc_percent: Number,
  soh_percent: Number,          // State of Health
  energy_charge_today_kwh: Number,
  energy_discharge_today_kwh: Number,
  charge_limit_w: Number,
  discharge_limit_w: Number
}, { _id: false });

const loadSchema = new mongoose.Schema({
  active_power_w: Number
}, { _id: false });

const performanceSchema = new mongoose.Schema({
  inverter_efficiency_percent: Number
}, { _id: false });

const alarmDataSchema = new mongoose.Schema({
  type: String,             // "warning" / "error"
  code: mongoose.Schema.Types.Mixed,  // Có thể là string hoặc number
  text: String,             // Mô tả
  first_seen_ts: Number,    // Unix timestamp
  last_seen_ts: Number      // Unix timestamp
}, { _id: false });

const alarmSchemaNew = new mongoose.Schema({
  count: Number,
  data: [alarmDataSchema]
}, { _id: false });

const thermalHardwareSchema = new mongoose.Schema({
  inverter_temp_c: Number,
  heatsink_temp_c: Number,
  transformer_temp_c: Number,
  ambient_temp_c: Number
}, { _id: false });

const qualitySchema = new mongoose.Schema({
  source: String,               // "modbus", "iec104", "cache"
  device_online: Boolean,
  poll_interval_ms: Number
}, { _id: false });

const inverterSchemaNew = new mongoose.Schema({
  info: inverterInfoSchema,
  operating_state: operatingStateSchema,
  sign_convention: signConventionSchema,
  ac_measurements: acMeasurementsSchema,
  grid_interaction: gridInteractionSchema,
  pv_input: pvInputSchema,
  battery_storage: batteryStorageSchema,
  load: loadSchema,
  performance: performanceSchema,
  alarm: alarmSchemaNew,
  thermal_hardware: thermalHardwareSchema,
  quality: qualitySchema
}, { _id: false });

// ===== MAIN DATAPOINT SCHEMA (supports both old and new) =====
const dataPointSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  timezone: String,
  version: String,            // fw_version (old) or version (new)
  schema_version: String,     // Schema version (new, e.g., "0.9.0")
  fw_version: String,         // Firmware version (new)
  /** Theo envelope IoT — nhóm site */
  site_id: { type: String, index: true },
  /** Số thứ tự message (gap / replay) */
  sequence: Number,
  /** telemetry | control | ack | event | config | heartbeat */
  payload_type: String,
  
  // System data (supports both old and new structure)
  system: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Inverters (supports both old flat structure and new nested structure)
  inverters: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  
  // Legacy fields (for old schema compatibility)
  battery: batterySchemaOld,
  power_flow: powerFlowSchemaOld
}, {
  timestamps: true
});

// Compound index for efficient queries
dataPointSchema.index({ device_id: 1, timestamp: -1 });

// TTL index - auto delete after 7 days
dataPointSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('DataPoint', dataPointSchema);

