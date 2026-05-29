const express = require("express");

const router = express.Router();

const Cita = require("../models/Cita");

// Horarios demo
const horariosBase = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "02:00 PM",
  "03:00 PM"
];

// Función formato fecha
const formatearFecha = (fecha) => {

  const year = fecha.getFullYear();

  const month = String(
    fecha.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    fecha.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Endpoint
router.get("/", async (req, res) => {

  try {

    const { especialidad } = req.query;

    // Revisar próximos 30 días
    for (let i = 0; i < 30; i++) {

      const fecha = new Date();

      fecha.setDate(fecha.getDate() + i);

      const fechaFormateada = formatearFecha(fecha);

      // Buscar citas ocupadas
      const citas = await Cita.find({
        "doctor.especialidad": {
          $regex: especialidad,
          $options: "i"
        },
        fecha: fechaFormateada
      });

      // Horas ocupadas
      const horasOcupadas = citas.map(
        cita => cita.hora
      );

      // Buscar primera libre
    const ahora = new Date();

    const horaDisponible = horariosBase.find(hora => {

    // Si está ocupada
    if (horasOcupadas.includes(hora)) {
        return false;
    }

    // Validar si es HOY
    const esHoy =
        fechaFormateada === formatearFecha(ahora);

    if (!esHoy) {
        return true;
    }

    // Convertir hora AM/PM
    const [horaTexto, periodo] = hora.split(" ");

    let [horas, minutos] = horaTexto.split(":").map(Number);

    if (periodo === "PM" && horas !== 12) {
        horas += 12;
    }

    if (periodo === "AM" && horas === 12) {
        horas = 0;
    }

    // Crear fecha comparativa
    const fechaHoraCita = new Date(fecha);

    fechaHoraCita.setHours(horas);
    fechaHoraCita.setMinutes(minutos);

    // Validar que sea futura
    return fechaHoraCita > ahora;

    });

      // Si encontró
      if (horaDisponible) {

        return res.json({
          ok: true,
          fecha: fechaFormateada,
          hora: horaDisponible
        });

      }

    }

    // Si no encontró
    res.status(404).json({
      ok: false,
      message: "No hay disponibilidad"
    });

  } catch (error) {

    res.status(500).json({
      ok: false,
      error: error.message
    });

  }

});

module.exports = router;