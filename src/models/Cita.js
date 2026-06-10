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
    default: "Pendiente"
  },

  motivo_cancelacion: {
    type: String,
    default: ""
  },

  canal: {
    type: String,
    default: "WhatsApp"
  },

  orden_medica: {
    type: String,
    default: ""
  },

  estado_pago: {
    type: String,
    default: "NO_APLICA"
  }

}, {
  timestamps: true
});

module.exports = mongoose.model(
  "Cita",
  citaSchema,
  "citas"
);