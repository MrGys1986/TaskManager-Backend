const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();

// ============================
// Rutas para Tareas
// ============================

// Crear tarea
router.post("/", async (req, res) => {
  try {
    const { NameTask, Description, Category, DeadLine, Status, userId } = req.body;

    if (!NameTask || !Description || !Category || !DeadLine || !Status || !userId) {
      return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
    }

    const tasksRef = db.collection("Tasks");

    await tasksRef.add({
      NameTask,
      Description,
      Category,
      DeadLine: new Date(DeadLine),
      Status,
      userId,
      createdAt: new Date(),
    });

    res.status(201).json({ success: true, message: "Tarea creada exitosamente." });
  } catch (error) {
    console.error("Error al crear tarea:", error);
    res.status(500).json({ success: false, message: "Error en el servidor." });
  }
});

// Obtener tareas por usuario
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId es requerido." });
    }

    const tasksRef = db.collection("Tasks");
    const snapshot = await tasksRef.where("userId", "==", userId).orderBy("createdAt", "desc").get();

    const tasks = [];
    snapshot.forEach(doc => {
      tasks.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error("Error al obtener las tareas:", error);
    res.status(500).json({ success: false, message: "Error al obtener las tareas." });
  }
});

// Actualizar estado de una tarea
router.patch("/update-task-status/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { Status } = req.body;

    if (!Status) {
      return res.status(400).json({ success: false, message: "El nuevo estado es obligatorio." });
    }

    const taskRef = db.collection("Tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ success: false, message: "Tarea no encontrada." });
    }

    await taskRef.update({ Status });

    res.status(200).json({ success: true, message: "Estado de la tarea actualizado correctamente." });
  } catch (error) {
    console.error("Error al actualizar el estado:", error);
    res.status(500).json({ success: false, message: "Error en el servidor." });
  }
});

// Actualizar datos de una tarea (nombre, descripción, categoría, fecha, estado)
router.patch("/update-task/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const { NameTask, Description, Category, DeadLine, Status } = req.body;
  
      // Validar que se envíen datos
      if (!NameTask || !Description || !Category || !DeadLine || !Status) {
        return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
      }
  
      const taskRef = db.collection("Tasks").doc(taskId);
      const taskDoc = await taskRef.get();
  
      if (!taskDoc.exists) {
        return res.status(404).json({ success: false, message: "Tarea no encontrada." });
      }
  
      // Convertir la fecha correctamente
      const formattedDeadline = new Date(DeadLine);
  
      // Actualizar la tarea en Firestore
      await taskRef.update({
        NameTask,
        Description,
        Category,
        DeadLine: formattedDeadline,
        Status
      });
  
      res.status(200).json({ success: true, message: "Tarea actualizada correctamente." });
    } catch (error) {
      console.error("Error al actualizar tarea:", error);
      res.status(500).json({ success: false, message: "Error en el servidor." });
    }
  });
  

// Eliminar una tarea
router.delete("/delete-task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    const taskRef = db.collection("Tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ success: false, message: "Tarea no encontrada." });
    }

    await taskRef.delete();

    res.status(200).json({ success: true, message: "Tarea eliminada exitosamente." });
  } catch (error) {
    console.error("Error al eliminar la tarea:", error);
    res.status(500).json({ success: false, message: "Error en el servidor." });
  }
});

module.exports = router;
