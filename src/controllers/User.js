const { User, Board } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const signup = async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser =
    (await User.findOne({ where: { email } })) ||
    (await User.findOne({ where: { username } }));

  if (existingUser) {
    res.status(400).json({ error: "Email or username already exists" });
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);

    User.create({ username, email, password: hashedPassword }).then((user) => {
      jwt.sign({ user }, "secretKey", (err, token) => {
        res.json({ token });
      });
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  User.findOne({ where: { email } }).then(async (user) => {
    if (!user) {
      res.status(403).json({ message: 'Email does not exist' });
    } else if (await bcrypt.compare(password, user.password)) {
      jwt.sign({ userId: user.id }, "secretKey", (err, token) => {
        res.json({ token });
      });
    } else {
      res.status(403).json({ message: 'Password is incorrect' });
    }
  });
};

const getUser = async (req, res) => {
  const token = req.headers.authorization;
  const { userId } = jwt.verify(token, "secretKey");

  try {
    const user = await User.findOne({
      where: { id: userId },
      include: Board,
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [updated] = await User.update(req.body, {
      where: { id },
    });
    if (updated) {
      const updatedUser = await User.findByPk(id);
      res.status(200).json({ user: updatedUser });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await User.destroy({
      where: { id },
    });
    if (deleted) {
      res.status(204).send("User deleted");
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  signup,
  login,
  getUser,
  updateUser,
  deleteUser,
};
