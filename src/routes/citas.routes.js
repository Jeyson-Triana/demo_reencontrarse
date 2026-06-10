const express = require("express");
const axios = require("axios");

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
      modalidad,
      orden_medica,
      estado_pago
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
      modalidad,
      orden_medica: orden_medica || "",
      estado_pago: estado_pago || "NO_APLICA"

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
        $in: [
          "Pendiente",
          "Confirmada",
          "Reprogramada"
        ]
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

// Confirmar cita
router.put("/confirmar/:id", async (req, res) => {

  try {

    const { id } = req.params;
    const cita = await Cita.findById(id);

    if (!cita) {
      return res.status(404).json({
        ok: false,
        message: "Cita no encontrada"
      });

    }

    cita.estado = "Confirmada";
    await cita.save();
    return res.json({

      ok: true,
      message: "Cita confirmada exitosamente",
      cita

    });

  } catch (error) {

    return res.status(500).json({
      ok: false,
      error: error.message
    });

  }

});


// Citas pendientes para recordar mañana
router.get("/recordatorios", async (req, res) => {

  try {

    const manana = new Date();

    manana.setDate(
      manana.getDate() + 1
    );

    const fechaManana =
      manana.toISOString().split("T")[0];

    const citas = await Cita.find({

      fecha: fechaManana,

      estado: {
        $in: [
          "Pendiente",
          "Reprogramada"
        ]
      }

    });

    const resultado = [];

    for (const cita of citas) {

      const paciente =
        await Paciente.findOne({

          numero_documento:
            cita.paciente.documento

        });

      resultado.push({

        id_cita: cita._id,
        nombre_paciente: cita.paciente.nombre_completo,
        telefono: paciente?.telefono || "",
        servicio: cita.doctor.especialidad,
        profesional: cita.doctor.nombre_completo,
        fecha: cita.fecha,
        hora: cita.hora,
        estado: cita.estado

      });

    }

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

// Enviar recordatorios de citas
router.post("/enviar-recordatorios", async (req, res) => {

  try {

    const manana = new Date();

    manana.setDate(
      manana.getDate() + 1
    );

    const fechaManana =
      manana.toISOString().split("T")[0];

    const citas = await Cita.find({

      fecha: fechaManana,

      estado: {
        $in: [
          "Pendiente",
          "Reprogramada"
        ]
      }

    });

    const resultado = [];

    for (const cita of citas) {

      try {

        const paciente =
          await Paciente.findOne({

            numero_documento:
              cita.paciente.documento

          });

        const recordatorio = {

          id_cita: cita._id,
          nombre: cita.paciente.nombre_completo,
          telefono: paciente?.telefono || "",
          servicio: cita.doctor.especialidad,
          profesional: cita.doctor.nombre_completo,
          fecha: cita.fecha,
          hora: cita.hora

        };

        if (!recordatorio.telefono) {

          console.warn(
            `⚠️ No se encontró teléfono para ${recordatorio.nombre}`
          );

          continue;

        }

        console.log(
          `📲 Enviando recordatorio a ${recordatorio.nombre} (${recordatorio.telefono})`
        );

        console.log(
          JSON.stringify(
            {
              messages: [
                {
                  from: process.env.INFOBIP_SENDER,
                  to: recordatorio.telefono,
                  content: {
                    templateName: "recordatorio_cita",
                    templateData: {
                      body: {
                        placeholders: [
                          recordatorio.nombre,
                          "Reencontrarse",
                          recordatorio.servicio,
                          recordatorio.profesional,
                          recordatorio.fecha,
                          recordatorio.hora
                        ]
                      },
                      buttons: [
                        {
                          type: "QUICK_REPLY",
                          parameter: "CONFIRMAR"
                        },
                        {
                          type: "QUICK_REPLY",
                          parameter: "REPROGRAMAR"
                        },
                        {
                          type: "QUICK_REPLY",
                          parameter: "CANCELAR"
                        }
                      ]
                    },
                    language: "es_CO"
                  }
                }
              ]
            },
            null,
            2
          )
        );

        const response = await axios.post(

          `${process.env.INFOBIP_BASE_URL}/whatsapp/1/message/template`,

          {
            messages: [
              {
                from: process.env.INFOBIP_SENDER,
                to: recordatorio.telefono,
                
                content: {

                  templateName: "recordatorio_cita",

                  templateData: {

                    body: {

                      placeholders: [

                        recordatorio.nombre,
                        "Reencontrarse",
                        recordatorio.servicio,
                        recordatorio.profesional,
                        recordatorio.fecha,
                        recordatorio.hora

                      ]

                    },

                    buttons: [

                      {
                        type: "QUICK_REPLY",
                        parameter: "CONFIRMAR"
                      },

                      {
                        type: "QUICK_REPLY",
                        parameter: "REPROGRAMAR"
                      },

                      {
                        type: "QUICK_REPLY",
                        parameter: "CANCELAR"
                      }

                    ]

                  },

                  language: "es_CO"

                }

              }
            ]
          },

          {
            headers: {

              Authorization:
                `App ${process.env.INFOBIP_API_KEY}`,

              "Content-Type":
                "application/json"

            }

          }

        );

        console.log(
          `✅ Recordatorio enviado a ${recordatorio.nombre}`
        );

        console.log(
          response.data
        );

        resultado.push(
          recordatorio
        );

      } catch (error) {

        console.error(
          `❌ Error enviando a ${cita.paciente.nombre_completo}`
        );

        console.error(
          "STATUS:",
          error.response?.status
        );

        console.error(
          "DATA:",
          JSON.stringify(
            error.response?.data,
            null,
            2
          )
        );

      }

    }

    return res.json({

      ok: true,
      enviados: resultado.length,
      recordatorios: resultado

    });

  } catch (error) {

    console.error(error);

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
    const { motivo_cancelacion } = req.body;

    const cita = await Cita.findById(id);

    if (!cita) {

      return res.status(404).json({

        ok: false,
        message: "Cita no encontrada"

      });

    }

    cita.estado = "Cancelada";
    cita.motivo_cancelacion = motivo_cancelacion || "";

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