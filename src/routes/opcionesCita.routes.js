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

    // Revisar próximos 30 días
    for (let i = 0; i < 30; i++) {

      const fecha = new Date();

      fecha.setDate(fecha.getDate() + i);

      const fechaFormateada = formatearFecha(fecha);

      const citas = await Cita.find({

        "doctor.especialidad": {
          $regex: servicio,
          $options: "i"
        },

        fecha: fechaFormateada,

        estado: {
            $ne: "cancelada"
        }

      });

      const horasOcupadas = citas.map(
        cita => cita.hora
      );

      for (const hora of horariosBase) {

        // Si ya está ocupada
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
        fechaHora.setSeconds(0);

        // No mostrar horas ya pasadas
        if (fechaHora <= ahora) {
          continue;
        }

        opciones.push({
          id_opcion: opciones.length + 1,
          fecha: fechaFormateada,
          hora
        });

        // Las primeras 3 opciones
        if (opciones.length === 3) {
          break;
        }

      }

      // Si ya tenemos 3 opciones salimos del ciclo principal
      if (opciones.length === 3) {
        break;
      }

    }

    // No encontró disponibilidad
    if (opciones.length === 0) {

      return res.json({

        ok: false,

        cantidad: 0,

        message: "No hay disponibilidad para este servicio"

      });

    }

    // Respuesta amigable para Infobip
    return res.json({

      ok: true,

      cantidad: opciones.length,

      opcion_1: opciones[0]
        ? `${opciones[0].fecha} - ${opciones[0].hora}`
        : "",

      opcion_2: opciones[1]
        ? `${opciones[1].fecha} - ${opciones[1].hora}`
        : "",

      opcion_3: opciones[2]
        ? `${opciones[2].fecha} - ${opciones[2].hora}`
        : "",

      fecha_1: opciones[0]?.fecha || "",
      hora_1: opciones[0]?.hora || "",

      fecha_2: opciones[1]?.fecha || "",
      hora_2: opciones[1]?.hora || "",

      fecha_3: opciones[2]?.fecha || "",
      hora_3: opciones[2]?.hora || ""

    });

  } catch (error) {

    return res.status(500).json({

      ok: false,

      error: error.message

    });

  }

});

module.exports = router;