const express = require("express");

const router = express.Router();

const Cita = require("../models/Cita");

// Endpoint disponibilidad
router.get("/", async (req, res) => {

  try {

    const { especialidad, fecha } = req.query;

    // Horarios base demo
    const horariosBase = [
      "08:00 AM",
      "09:00 AM",
      "10:00 AM",
      "11:00 AM",
      "02:00 PM",
      "03:00 PM"
    ];

    // Buscar citas ocupadas
    const citas = await Cita.find({
      "doctor.especialidad": {
        $regex: especialidad,
        $options: "i"
      },
      fecha
    });

    // Sacar horas ocupadas
    const horariosOcupados = citas.map(cita => cita.hora);

    // Filtrar disponibles
    const horariosDisponibles = horariosBase.filter(
      hora => !horariosOcupados.includes(hora)
    );

    res.json({
      ok: true,
      horarios_disponibles: horariosDisponibles
    });

  } catch (error) {

    res.status(500).json({
      ok: false,
      error: error.message
    });

  }

});

module.exports = router;