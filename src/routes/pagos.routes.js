const express = require("express");

const router = express.Router();

const Pago = require("../models/Pago");


// Endpoint para generar un pago (simulación)
router.post("/generar", async (req, res) => {

    try {

      const {
        documento,
        servicio
      } = req.body;

      const pago =
        await Pago.create({

          documento,
          servicio,
          valor: 100000,
          estado:"PENDIENTE"

        });

      return res.json({

        ok: true,
        id_pago: pago._id,
        estado: pago.estado,
        link_pago: `https://api-reencontrarse.onrender.com/api/pagos/aprobar/${pago._id}`

      });

    } catch (error) {

      return res.status(500).json({

        ok: false,
        error: error.message

      });
    }
  }
);

// Endpoint para aprobar un pago (simulación)
router.get("/aprobar/:id", async (req, res) => {

  try {

    const pago =
      await Pago.findByIdAndUpdate(

        req.params.id,

        {
          estado: "APROBADO"
        },

        {
          new: true
        }

      );

    return res.send(`

      <h2>✅ Pago aprobado exitosamente</h2>

      <p>ID Pago: ${pago._id}</p>

      <p>Estado: ${pago.estado}</p>

      <p>Puedes regresar a WhatsApp para continuar tu agendamiento.</p>

    `);

  } catch (error) {

    return res.status(500).json({

      ok: false,
      error: error.message

    });

  }

});

router.get("/estado/:id", async (req, res) => {

    try {

      const pago =
        await Pago.findById(
          req.params.id
        );

      return res.json({

        ok: true,
        estado: pago.estado

      });

    } catch (error) {

      return res.status(500).json({

        ok: false,
        error: error.message

      });
    }
  }
);

module.exports = router;