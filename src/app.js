const express = require("express");
const cors = require("cors");

const pacientesRoutes = require("./routes/pacientes.routes");
const citasRoutes = require("./routes/citas.routes");
const disponibilidadRoutes = require("./routes/disponibilidad.routes");
const proximaDisponibilidadRoutes = require("./routes/proximaDisponibilidad.routes");
const opcionesCitaRoutes = require("./routes/opcionesCita.routes");
const pagosRoutes = require("./routes/pagos.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API Reencontrarse funcionando");
});

app.use("/api/pacientes", pacientesRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/disponibilidad", disponibilidadRoutes);
app.use("/api/proxima-disponibilidad", proximaDisponibilidadRoutes);
app.use("/api/opciones-cita", opcionesCitaRoutes);
app.use("/api/pagos", pagosRoutes);

module.exports = app;