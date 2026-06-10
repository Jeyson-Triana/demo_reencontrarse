const mongoose = require("mongoose");

const pagoSchema = new mongoose.Schema({

  documento: String,
  servicio: String,
  valor: Number,

  estado: {
    type: String,
    default: "PENDIENTE"
  }

}, {
  timestamps: true
});

module.exports =
  mongoose.model(
    "Pago",
    pagoSchema,
    "pagos"
  );