const { StatusCodes } = require("http-status-codes");
const Admission = require("../models/Admission");
const Bill = require("../models/Bill");
const Carrier = require("../models/Carrier");
const Room = require("../models/Room");
const Doctor = require("../models/Doctor");

const getBills = async (req, res) => {
  const bills = await Bill.find({}).populate("admission_id").populate("patient_id");

  res.status(StatusCodes.OK).json({ bills });
};

const addBill = async (req, res) => {
  try {
    const { admission_id, discharge_date } = req.body;

    // Find admission and related data
    const admission = await Admission.findById(admission_id).populate("treatments");
    if (!admission) {
      return res.status(404).json({ error: "Admission not found" });
    }

    const { admit_date, treatments, room_id, doctor_id, insurance_id } = admission;

    // Calculate treatment cost
    const total_treatements_cost = treatments.reduce((ac, cur) => ac + cur.cost, 0);

    // Calculate room cost and meal cost
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(Math.abs((new Date(discharge_date) - admit_date) / oneDay));

    const room = await Room.findById(room_id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    const { cost_per_day, meal_cost_per_day } = room;

    // Get doctor fee and carrier percentage
    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    const { fee: doctorFee } = doctor;

    const carrier = await Carrier.findById(insurance_id);

    if (!carrier) {
      return res.status(404).json({ error: "Carrier not found" });
    }
    const { percentage } = carrier;

    // Calculate costs
    const total_room_cost = diffDays * cost_per_day;
    const meals_cost = diffDays * meal_cost_per_day;
    const total_cost = doctorFee + total_room_cost + total_treatements_cost + meals_cost;
    const total_carrier_payable = total_cost * (percentage / 100.0);
    const net_payable_cost = total_cost - total_carrier_payable;

    // Create bill
    const bill = new Bill({
      patient_id: req.body.patient_id,
      admission_id,
      discharge_date,
      total_treatements_cost,
      meals_cost,
      total_room_cost,
      total_cost,
      total_carrier_payable,
      net_payable_cost,
    });

    await bill.save();

    // Update admission with bill ID
    admission.bill_id = bill._id;
    await admission.save();

    res.status(200).json({ bill });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const getBill = async (req, res) => {
  const { billId } = req.params;
  const bill = await Bill.findById(billId)
    .populate("admission_id")
    .populate("patient_id")
    .populate({
      path: "admission_id",
      populate: {
        path: "insurance_id",
        model: "InsuranceCarrier",
      },
    })
    .populate({
      path: "admission_id",
      populate: {
        path: "doctor_id",
        model: "doctor",
      },
    })
    .populate({
      path: "admission_id",
      populate: {
        path: "treatments",
        model: "Treatment",
      },
    });
  res.status(StatusCodes.OK).json({ bill });
};

const getBillByPatient = async (req, res) => {
  const { id } = req.params;
  const bill = await Bill.find({ patient_id: id });

  res.status(StatusCodes.OK).json({ bill });
};
module.exports = { getBills, addBill, getBill, getBillByPatient };
