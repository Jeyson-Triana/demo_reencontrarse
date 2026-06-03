const express = require("express");

const router = express.Router();

const Cita = require("../models/Cita");

const horariosBase = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "02:00 PM",
  "03:00 PM"
];

function formatearFecha(fecha) {

  const year = fecha.getFullYear();

  const month = String(
    fecha.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    fecha.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

router.get("/", async (req, res) => {

  try {

    const { servicio } = req.query;

    const opciones = [];

    const ahora = new Date();

    for (let i = 0; i < 30; i++) {

      const fecha = new Date();

      fecha.setDate(fecha.getDate() + i);

      const fechaFormateada = formatearFecha(fecha);

      const citas = await Cita.find({

        "doctor.especialidad": {
          $regex: servicio,
          $options: "i"
        },

        fecha: fechaFormateada

      });

      const horasOcupadas = citas.map(
        cita => cita.hora
      );

      for (const hora of horariosBase) {

        if (horasOcupadas.includes(hora)) {
          continue;
        }

        const [horaTexto, periodo] = hora.split(" ");

        let [horas, minutos] = horaTexto
          .split(":")
          .map(Number);

        if (periodo === "PM" && horas !== 12) {
          horas += 12;
        }

        if (periodo === "AM" && horas === 12) {
          horas = 0;
        }

        const fechaHora = new Date(fecha);

        fechaHora.setHours(horas);
        fechaHora.setMinutes(minutos);

        if (fechaHora <= ahora) {
          continue;
        }

        opciones.push({
          id_opcion: opciones.length + 1,
          fecha: fechaFormateada,
          hora
        });

        if (opciones.length === 3) {

          return res.json({
            ok: true,
            opciones
          });

        }

      }

    }

    return res.json({
      ok: true,
      opciones
    });

  } catch (error) {

    return res.status(500).json({
      ok: false,
      error: error.message
    });

  }

});

module.exports = router;