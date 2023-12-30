const { Invite, User, Board } = require("../models");

const sendInvite = async (req, res) => {
  const { inviterId, inviteeEmail, boardId } = req.body;

  try {
    const invitee = await User.findOne({ where: { email: inviteeEmail } });
    if (!invitee) {
      return res.status(404).json({ error: "Invitee not found" });
    }

    const invite = await Invite.create({
      inviterId,
      inviteeId: invitee.id,
      boardId,
      status: "pending",
    });
    res.json(invite);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const acceptRejectInvite = async (req, res) => {
  const { id, task } = req.params;
  console.log(req)
  
  try {
    const invite = await Invite.findOne({ where: { id } });
    if (!invite) {
      return res.status(320).json({ error: "Invite not found" });
    }

    if (task === "accept") {
      invite.status = "accepted";
      await invite.save();
    } else if (task === "reject") {
      invite.status = "rejected";
      await invite.save();
    }

    const user = await User.findOne({ where: { id: invite.inviteeId } });
    const board = await Board.findOne({ where: { id: invite.boardId } });

    const memberships = await user.getBoards();
    const isMember = memberships.some(
      (membership) => membership.id === board.id
    );

    if (!isMember) {
      await user.addBoard(board);
    }

    res.json(invite);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSentInvites = async (req, res) => {
  const { id } = req.params;

  try {
    const invites = await Invite.findAll({
      where: { inviterId: id },
      include: [
        { model: User, as: "Inviter", attributes: ["username"] },
        { model: User, as: "Invitee", attributes: ["username"] },
        { model: Board, attributes: ["name"] },
      ],
    });
    res.json(invites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getReceivedInvites = async (req, res) => {
  const { id } = req.params;

  try {
    const invites = await Invite.findAll({
      where: { inviteeId: id },
      include: [
        { model: User, as: "Inviter", attributes: ["username"] },
        { model: User, as: "Invitee", attributes: ["username"] },
        { model: Board, attributes: ["name"] },
      ],
    });
    res.json(invites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  sendInvite,
  acceptRejectInvite,
  getSentInvites,
  getReceivedInvites,
};
