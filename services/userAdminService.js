// src/services/userAdminService.js
const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();

// ============================
// Ruta para obtener todos los usuarios (solo admin)
// ============================
router.get("/get-users-admin", async (req, res) => {
    try {
      const { searchTerm } = req.query;
      let usersRef = db.collection("Users");
  
      if (searchTerm) {
        usersRef = usersRef
          .orderBy("username")
          .where("username", ">=", searchTerm)
          .where("username", "<=", searchTerm + "\uf8ff");
      }
  
      const snapshot = await usersRef.get();
  
      let users = [];
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
  
      res.status(200).json({ success: true, users });
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      res.status(500).json({ success: false, message: "Error en el servidor." });
    }
  });
  
  
  // ============================
  // Ruta para actualizar usuario (sin validación de permisos)
  // ============================
  router.put("/update-user-admin/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { username, email, role } = req.body;
  
      if (!username || !email || !role) {
        return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
      }
  
      const userRef = db.collection("Users").doc(userId);
      await userRef.update({ username, email, rol: role });
  
      res.status(200).json({ success: true, message: "Usuario actualizado correctamente." });
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      res.status(500).json({ success: false, message: "Error en el servidor." });
    }
  });
  
  
  
  // ============================
  // Ruta para eliminar usuario (solo admin)
  // ============================
  router.delete("/delete-user-admin/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
   
      await db.collection("Users").doc(userId).delete();
  
      res.status(200).json({ success: true, message: "Usuario eliminado correctamente." });
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      res.status(500).json({ success: false, message: "Error en el servidor." });
    }
  });
  

  module.exports = router;
