const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({

  nombre_completo: {
    type: String,
    required: true
  },

  especialidad: {
    type: String,
    required: true
  },

  telefono: {
    type: String
  },

  estado: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Doctor", doctorSchema, "doctores");