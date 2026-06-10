const mongoose = require("mongoose");

const pacienteSchema = new mongoose.Schema({

  tipo_documento: {
    type: String,
    required: true
  },

  numero_documento: {
    type: String,
    required: true,
    unique: true
  },

  nombre_completo: {
    type: String, 
    required: true

  },

  fecha_nacimiento: {
    type: String
  },

  sexo: {
    type: String
  },

  direccion_residencia: {
    type: String
  },

  telefono: {
    type: String,
    required: true
  },

  correo: {
    type: String
  },

  conviviente: {
    nombre: String,
    telefono: String
  },

  cobertura_medica: {

    tipo: String,
    nombre_entidad: String,

    tiene_orden_medica: {
      type: Boolean,
      default: false
    }

  },

  estado_pago: {
    type: String,
    default: "NO_APLICA"
  },
  
  estado: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Paciente", pacienteSchema, "pacientes");