const express = require("express");

const router = express.Router();

const Cita = require("../models/Cita");
const Paciente = require("../models/Paciente");
const Doctor = require("../models/Doctor");

router.post("/", async (req, res) => {

  try {

    const {
      documento,
      especialidad,
      fecha,
      hora,
      modalidad
    } = req.body;

    // Buscar paciente

    const paciente = await Paciente.findOne({
      numero_documento: documento
    });

    if (!paciente) {

      return res.status(404).json({
        ok: false,
        message: "Paciente no encontrado"
      });

    }

    // Buscar doctor por especialidad
    const doctor = await Doctor.findOne({
    especialidad: {
        $regex: especialidad.trim(),
        $options: "i"
    }
    });

    console.log("Doctor encontrado:", doctor);
    
    if (!doctor) {

      return res.status(404).json({
        ok: false,
        message: "Doctor no encontrado"
      });

    }

    // Validar si horario ya existe
    const citaExistente = await Cita.findOne({
      "doctor.nombre_completo": doctor.nombre_completo,
      fecha,
      hora
    });

    if (citaExistente) {

      return res.status(400).json({
        ok: false,
        message: "Horario no disponible"
      });

    }

    // Crear cita
    const nuevaCita = new Cita({

      paciente: {
        nombre_completo: paciente.nombre_completo,
        documento: paciente.numero_documento
      },

      doctor: {
        nombre_completo: doctor.nombre_completo,
        especialidad: doctor.especialidad
      },

      fecha,
      hora,
      modalidad

    });

    await nuevaCita.save();

    res.status(201).json({
      ok: true,
      message: "Cita creada exitosamente",
      cita: nuevaCita
    });

  } catch (error) {

    res.status(500).json({
      ok: false,
      error: error.message
    });

  }

});

// Consultar todas las citas
router.get("/", async (req, res) => {

  try {

    const citas = await Cita.find();

    res.json({
      ok: true,
      citas
    });

  } catch (error) {

    res.status(500).json({
      ok: false,
      error: error.message
    });

  }

});

// Consultar citas por documento
router.get("/paciente/:documento", async (req, res) => {

  try {

    const citas = await Cita.find({
      "paciente.documento": req.params.documento
    });

    res.json({
      ok: true,
      citas
    });

  } catch (error) {

    res.status(500).json({
      ok: false,
      error: error.message
    });

  }

});

module.exports = router;