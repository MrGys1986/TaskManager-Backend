const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();

// ============================
// Rutas para Grupos
// ============================

// Crear grupo
router.post('/create-group', async (req, res) => {
    const { name, createdBy, members } = req.body;
  
    if (!name || !createdBy || !members || !Array.isArray(members)) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }
  
    try {
      const groupsRef = db.collection('Groups');
      await groupsRef.add({
        name,
        createdBy,
        members, // Almacena los IDs de los miembros
        createdAt: new Date()
      });
  
      res.status(201).json({ success: true, message: 'Grupo creado exitosamente.' });
    } catch (error) {
      console.error('Error al crear grupo:', error);
      res.status(500).json({ success: false, message: 'Error al crear el grupo.' });
    }
  });


// Agregar usuario a grupo
router.patch("/add-user-to-group", async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    if (!groupId || !userId) {
      return res.status(400).json({ success: false, message: "groupId y userId son obligatorios." });
    }

    const groupRef = db.collection("Groups").doc(groupId);
    await groupRef.update({
      members: admin.firestore.FieldValue.arrayUnion(userId),
    });

    res.status(200).json({ success: true, message: "Usuario agregado al grupo." });
  } catch (error) {
    console.error("Error al agregar usuario al grupo:", error);
    res.status(500).json({ success: false, message: "Error en el servidor." });
  }
});

// Obtener grupos del usuario
router.get('/', async (req, res) => {

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId es requerido.' });
  }

  try {
    const groupsRef = db.collection('Groups');
    const snapshot = await groupsRef.where('members', 'array-contains', userId).get();

    const groups = [];
    snapshot.forEach(doc => {
      groups.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json({ success: true, groups });
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener grupos.' });
  }
});

// Ruta para obtener usuarios por correo
router.get('/get-users', async (req, res) => {  // 🔹 Corregida la ruta con "/"
    const { query } = req.query;
  
    if (!query) {
      return res.status(400).json({ success: false, message: "Se requiere un término de búsqueda." });
    }
  
    try {
      const usersRef = db.collection("Users");
      const snapshot = await usersRef
        .orderBy("email")  // 🔹 Se ordena por email para que funcione correctamente
        .where("email", ">=", query)
        .where("email", "<=", query + "\uf8ff")
        .limit(10) // 🔹 Limita los resultados para evitar sobrecarga
        .get();
  
      if (snapshot.empty) {
        return res.status(404).json({ success: false, message: "No se encontraron usuarios." });
      }
  
      const users = [];
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, email: doc.data().email });
      });
  
      res.status(200).json({ success: true, users });
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      res.status(500).json({ success: false, message: "Error al obtener usuarios." });
    }
});

// Obtener detalles del grupo y sus miembros
router.get("/get-group-details/:groupId", async (req, res) => {
    const { groupId } = req.params;
  
    try {
      const groupRef = db.collection("Groups").doc(groupId);
      const groupDoc = await groupRef.get();
  
      if (!groupDoc.exists) {
        return res.status(404).json({ success: false, message: "Grupo no encontrado." });
      }
  
      const groupData = groupDoc.data();
  
      // Obtener detalles de los miembros
      const usersRef = db.collection("Users");
      const membersSnapshot = await usersRef.where(admin.firestore.FieldPath.documentId(), "in", groupData.members).get();
  
      const members = [];
      membersSnapshot.forEach(doc => {
        members.push({ id: doc.id, ...doc.data() });
      });
  
      res.status(200).json({ success: true, group: groupData, members });
    } catch (error) {
      console.error("Error al obtener detalles del grupo:", error);
      res.status(500).json({ success: false, message: "Error al obtener detalles del grupo." });
    }
  });

// ============================
// Rutas para Tareas Colaborativas
// ============================

// Crear tarea en grupo
router.post('/create-group-task', async (req, res) => {
    const { groupId, name, description, assignedTo, createdBy } = req.body;
  
    if (!groupId || !name || !description || !assignedTo || !createdBy) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }
  
    try {
      // Verificar si el usuario es el creador del grupo
      const groupRef = db.collection('Groups').doc(groupId);
      const groupDoc = await groupRef.get();
  
      if (!groupDoc.exists) {
        return res.status(404).json({ success: false, message: 'Grupo no encontrado.' });
      }
  
      if (groupDoc.data().createdBy !== createdBy) {
        return res.status(403).json({ success: false, message: 'No tienes permiso para crear tareas en este grupo.' });
      }
  
      // Crear la tarea en "To Do" por defecto
      const tasksRef = db.collection('GroupTasks');
      const newTask = {
        groupId,
        name,
        description,
        assignedTo,
        createdBy,
        status: 'To Do',
        createdAt: admin.firestore.Timestamp.now(), // ⏳ Usa Timestamp de Firestore
      };
  
      const docRef = await tasksRef.add(newTask);
  
      res.status(201).json({ success: true, message: 'Tarea creada exitosamente.', taskId: docRef.id });
    } catch (error) {
      console.error('Error al crear tarea:', error);
      res.status(500).json({ success: false, message: 'Error al crear la tarea.' });
    }
  });
  


// Obtener tareas del grupo
router.get("/get-group-tasks", async (req, res) => {
    try {
      const { groupId } = req.query;
  
      if (!groupId) {
        return res.status(400).json({ success: false, message: "groupId es obligatorio." });
      }
  
      const tasksSnapshot = await db.collection("GroupTasks").where("groupId", "==", groupId).get();
  
      const tasks = [];
      tasksSnapshot.forEach(doc => {
        tasks.push({ id: doc.id, ...doc.data() });
      });
  
      res.status(200).json({ success: true, tasks });
    } catch (error) {
      console.error("Error al obtener tareas del grupo:", error);
      res.status(500).json({ success: false, message: "Error en el servidor." });
    }
  });

// Actualizar estado de tarea en grupo
// Actualizar estado de tarea en grupo
router.put("/update-group-task-status/:taskId", async (req, res) => {
    const { taskId } = req.params;
    const { status, userId } = req.body;
  
    try {
      const taskRef = db.collection("GroupTasks").doc(taskId);
      const taskDoc = await taskRef.get();
  
      if (!taskDoc.exists) {
        return res.status(404).json({ success: false, message: "Tarea no encontrada." });
      }
  
      const taskData = taskDoc.data();
  
      // Verificar si el usuario tiene permisos para cambiar el estatus
      const groupRef = db.collection("Groups").doc(taskData.groupId);
      const groupDoc = await groupRef.get();
  
      if (!groupDoc.exists) {
        return res.status(404).json({ success: false, message: "Grupo no encontrado." });
      }
  
      const isCreator = groupDoc.data().createdBy === userId;
      const isAssignedUser = taskData.assignedTo === userId;
  
      if (!isCreator && !isAssignedUser) {
        return res.status(403).json({ success: false, message: "No tienes permiso para cambiar el estatus de esta tarea." });
      }
  
      // Actualizar el estatus de la tarea
      await taskRef.update({ status });
  
      res.status(200).json({ success: true, message: "Estatus actualizado correctamente." });
    } catch (error) {
      console.error("Error al actualizar estatus:", error);
      res.status(500).json({ success: false, message: "Error al actualizar el estatus." });
    }
  });
  

module.exports = router;
