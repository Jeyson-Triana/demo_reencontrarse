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
      hora,
      estado: {
        $ne: "cancelada"
      }
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

// Consultar próximas citas por documento
router.get("/proximas/:documento", async (req, res) => {

  try {

    const { documento } = req.params;

    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split("T")[0];

    const citas = await Cita.find({
      "paciente.documento": documento,
      fecha: { $gte: fechaHoy },
      estado: {
        $ne: "cancelada"
      }
    }).sort({
      fecha: 1
    });

    if (!citas.length) {

      return res.json({
        ok: false,
        cantidad: 0,
        message: "No se encontraron citas futuras"
      });

    }

    const resultado = citas.map(cita => ({

      id: cita._id,
      servicio: cita.doctor.especialidad,
      profesional: cita.doctor.nombre_completo,
      fecha: cita.fecha,
      hora: cita.hora,
      estado: cita.estado

    }));

    return res.json({

      ok: true,
      cantidad: resultado.length,
      citas: resultado

    });

  } catch (error) {

    return res.status(500).json({

      ok: false,

      error: error.message

    });

  }

});

// Consultar ultima cita por documento
router.get("/documento/:documento", async (req, res) => {

  try {

    const { documento } = req.params;

    const cita = await Cita.findOne({
      "paciente.documento": documento
    }).sort({
      fecha: 1
    });

    if (!cita) {

      return res.status(404).json({
        ok: false,
        message: "No se encontraron citas"
      });

    }

    return res.json({

      ok: true,
      paciente: cita.paciente.nombre_completo,
      servicio: cita.doctor.especialidad,
      profesional: cita.doctor.nombre_completo,
      fecha: cita.fecha,
      hora: cita.hora,
      estado: cita.estado

    });

  } catch (error) {

    return res.status(500).json({
      ok: false,
      error: error.message
    });

  }

});

// Reprogramar cita
router.put("/reprogramar/:id", async (req, res) => {

  try {

    const { id } = req.params;
    const { fecha, hora } = req.body;
    const cita = await Cita.findById(id);

    if (!cita) {

      return res.status(404).json({
        ok: false,
        message: "Cita no encontrada"
      });

    }

  const horarioOcupado = await Cita.findOne({

    "doctor.nombre_completo": cita.doctor.nombre_completo,

    fecha,
    hora,

    estado: {
      $ne: "Cancelada"
    },

    _id: {
      $ne: id
    }

  });

  if (horarioOcupado) {

    return res.status(400).json({
      ok: false,
      message: "Horario no disponible"
    });

  }

    cita.fecha = fecha;
    cita.hora = hora;
    cita.estado = "Reprogramada";

    await cita.save();

    return res.json({

      ok: true,
      message: "Cita reprogramada exitosamente",
      cita

    });

  } catch (error) {

    return res.status(500).json({

      ok: false,
      error: error.message

    });

  }

});

// Cancelar cita
router.put("/cancelar/:id", async (req, res) => {

  try {

    const { id } = req.params;
    const cita = await Cita.findById(id);

    if (!cita) {

      return res.status(404).json({
        ok: false,
        message: "Cita no encontrada"
      });

    }

    cita.estado = "Cancelada";

    await cita.save();
    return res.json({

      ok: true,
      message: "Cita cancelada exitosamente",
      cita

    });

  } catch (error) {

    return res.status(500).json({

      ok: false,
      error: error.message

    });

  }

});

module.exports = router;