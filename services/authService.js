const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Clave secreta para generar tokens JWT
const SECRET_KEY = process.env.JWT_SECRET || "clave_secreta";

// 📌 ✅ Ruta de registro de usuario
router.post("/register", async (req, res) => {
    try {
      let { email, password, username, rol } = req.body;
  
      if (!email || !password || !username) {
        return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
      }
  
      // 🔹 Validación de formato de correo
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: "Formato de correo no válido." });
      }
  
      // 🔹 Validación de contraseña (mínimo 6 caracteres)
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: "La contraseña debe tener al menos 6 caracteres." });
      }
  
      rol = rol || "usuario";
  
      // 🔹 Verificar si el usuario ya existe
      const usersRef = db.collection("Users");
      const existingUser = await usersRef.where("email", "==", email).limit(1).get();
      if (!existingUser.empty) {
        return res.status(400).json({ success: false, message: "El usuario ya está registrado." });
      }
  
      // 🔹 Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // 🔹 Crear usuario en Firestore
      const newUser = await usersRef.add({
        email,
        password: hashedPassword,
        username,
        rol,
        last_login: new Date(),
      });
  
      res.status(201).json({ 
        success: true, 
        message: "Usuario registrado correctamente.", 
        userId: newUser.id // Devuelve el ID del usuario
      });
  
    } catch (error) {
      console.error("❌ Error en el registro:", error);
      res.status(500).json({ success: false, message: "Error en el servidor." });
    }
  });
  
// 📌 ✅ Ruta de inicio de sesión
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Correo y contraseña son obligatorios." });
    }

    const usersRef = db.collection("Users");
    const snapshot = await usersRef.where("email", "==", email).get();

    if (snapshot.empty) {
      return res.status(401).json({ success: false, message: "Usuario no encontrado." });
    }

    let userDoc;
    snapshot.forEach(doc => {
      userDoc = { id: doc.id, ...doc.data() };
    });

    const passwordMatch = await bcrypt.compare(password, userDoc.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Contraseña incorrecta." });
    }

    const token = jwt.sign(
      { userId: userDoc.id, email: userDoc.email, role: userDoc.rol },
      SECRET_KEY,
      { expiresIn: "10m" }
    );

    res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso.",
      token,
      username: userDoc.username,
      userId: userDoc.id,
      role: userDoc.rol,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ success: false, message: "Error en el servidor." });
  }
});

module.exports = router;
