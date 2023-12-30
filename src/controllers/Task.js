const Sequelize = require("sequelize");
const { Task, Subtask } = require("../models");

const createTask = async (req, res) => {
  const { title, description, status, boardId, subTasks } = req.body;

  try {
    const task = await Task.create({ title, description, status, boardId });

    const subTaskPromises = subTasks.map((subtask) => {
      return Subtask.create({
        title: subtask.title,
        taskId: task.id,
        completed: subtask.completed,
      });
    });
    await Promise.all(subTaskPromises);

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTask = async (req, res) => {
  const { title, description, status, subTasks } = req.body;
  const { id } = req.params;

  try {
    const task = await Task.findOne({ where: { id } });

    if (!task) {
      return res.status(302).json({ error: "Task not found" });
    }

    task.title = title;
    task.description = description;
    task.status = status;
    await task.save();

    const subTaskIds = subTasks.map((subtask) => subtask.id).filter((id) => id);
    const subTasksToDelete = await Subtask.findAll({
      where: { taskId: id, id: { [Sequelize.Op.notIn]: subTaskIds } },
    });
    await Subtask.destroy({
      where: { id: subTasksToDelete.map((subtask) => subtask.id) },
    });

    const subTaskPromises = subTasks.map(async (subtask) => {
      if (subtask.id) {
        const existingSubtask = await Subtask.findOne({
          where: { id: subtask.id },
        });
        if (existingSubtask) {
          existingSubtask.title = subtask.title;
          existingSubtask.completed = subtask.completed;
          await existingSubtask.save();
        }
      } else {
        await Subtask.create({
          title: subtask.title,
          taskId: task.id,
          completed: subtask.completed,
        });
      }
    });
    await Promise.all(subTaskPromises);

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findOne({ where: { id } });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    await task.destroy();
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createTask,
  updateTask,
  deleteTask,
};
