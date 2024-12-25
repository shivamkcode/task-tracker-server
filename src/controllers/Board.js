const Sequelize = require("sequelize");
const { Board, User, Column, Task, Subtask } = require("../models");
const jwt = require("jsonwebtoken");

const createBoard = async (req, res) => {
  const { name, columns } = req.body;
  const token = req.headers.authorization;
  const { userId } = jwt.verify(token, "secretKey");

  try {
    const user = await User.findOne({ where: { id: userId } });
    const board = await Board.create({ name });

    await user.addBoard(board);

    const columnPromises = columns.map((column) => {
      console.log(column);
      return Column.create({ status: column.status, boardId: board.id });
    });
    await Promise.all(columnPromises);

    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getBoards = async (req, res) => {
  const token = req.headers.authorization;
  const { userId } = jwt.verify(token, "secretKey");

  try {
    const user = await User.findOne({
      where: { id: userId },
      include: {
        model: Board,
        include: [
          { model: Column },
          {
            model: Task,
            required: false,
            include: [Subtask],
          },
        ],
      },
    });
    if (user && user.boards) {
      res.json(user.boards);
    } else {
      res.status(404).json({ error: "Board not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateBoard = async (req, res) => {
  const { name, columns } = req.body;
  const { id } = req.params;

  try {
    const board = await Board.findOne({ where: { id } });

    if (!board) {
      return res.status(404).json({ error: "Board not found." });
    }

    board.name = name;
    await board.save();

    const columnIds = columns.map((column) => column.id).filter((id) => id);
    const columnsToDelete = await Column.findAll({
      where: { boardId: id, id: { [Sequelize.Op.notIn]: columnIds } },
    });
    await Column.destroy({
      where: { id: columnsToDelete.map((column) => column.id) },
    });

    const columnPromises = columns.map(async (column) => {
      if (column.id) {
        const existingColumn = await Column.findOne({
          where: { id: column.id },
        });
        if (existingColumn) {
          existingColumn.status = column.status;
          await existingColumn.save();
        }
      } else {
        await Column.create({ status: column.status, boardId: id });
      }
    });
    await Promise.all(columnPromises);

    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteBoard = async (req, res) => {
  const { id } = req.params;

  try {
    const board = await Board.findOne({ where: { id } });

    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    await board.destroy();
    res.json({ message: "Board deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createBoard,
  getBoards,
  updateBoard,
  deleteBoard,
};
