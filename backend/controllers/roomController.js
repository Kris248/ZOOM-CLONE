const { v4: uuidv4 } = require('uuid');

exports.createRoom = (req, res) => {
  const roomId = uuidv4();
  res.status(201).json({ roomId });
};
