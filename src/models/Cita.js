const mongoose = require("mongoose");

const citaSchema = new mongoose.Schema({

  paciente: {

    nombre_completo: String,
    documento: String

  },

  doctor: {

    nombre_completo: String,
    especialidad: String

  },

  fecha: {
    type: String,
    required: true
  },

  hora: {
    type: String,
    required: true
  },

  modalidad: {
    type: String
  },

  estado: {
    type: String,
    default: "Confirmada"
  },

  canal: {
    type: String,
    default: "WhatsApp"
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Cita", citaSchema, "citas");