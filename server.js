require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

// 🔹 Cargar credenciales de Firebase desde variables de entorno
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // ✅ CORREGIDO
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
};

// 🔹 Inicializar Firebase Admin con credenciales
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

// 🔹 Inicializar Express
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(bodyParser.json());

// 🔹 Importar y montar routers
const authService = require("./services/authService");
const taskService = require("./services/taskService");
const groupService = require("./services/groupService");
const userAdminService = require("./services/userAdminService");

app.use("/api/auth", authService);
app.use("/api/tasks", taskService);
app.use("/api/groups", groupService);
app.use("/api/users", userAdminService);

// Ruta de prueba
app.get("/", (req, res) => res.send("Servidor funcionando correctamente 🚀"));

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en el puerto ${PORT}`));

