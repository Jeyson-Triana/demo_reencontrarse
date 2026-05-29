const express = require("express");
const router = express.Router();
const Paciente = require("../models/Paciente");

router.post("/", async (req, res) => {

  try {

    const paciente = new Paciente(req.body);
    await paciente.save();

    res.status(201).json({
      ok: true,
      paciente
    });

  } catch (error) {

    res.status(500).json({
      ok: false,
      error: error.message
    });

  }

});

router.get("/:documento", async (req, res) => {

  try {

    const paciente = await Paciente.findOne({
      numero_documento: req.params.documento
    });

    if (!paciente) {

      return res.status(404).json({
        ok: false,
        message: "Paciente no encontrado"
      });

    }

    res.json({
      ok: true,
      paciente
    });

  } catch (error) {

    res.status(500).json({
      ok: false,
      error: error.message
    });

  }

});

module.exports = router;