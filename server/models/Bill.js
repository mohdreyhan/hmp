const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Types.ObjectId,
    ref: "Patient",
  },
  admission_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admission",
  },
  discharge_date: {
    type: Date,
  },
  meals_cost: {
    type: Number,
  },
  total_treatements_cost: {
    type: Number,
  },
  total_room_cost: {
    type: Number,
  },
  total_cost: {
    type: Number,
  },
  total_carrier_payable: {
    type: Number,
  },
  net_payable_cost: {
    type: Number,
  },
});

module.exports = mongoose.model("Bill", billSchema);
