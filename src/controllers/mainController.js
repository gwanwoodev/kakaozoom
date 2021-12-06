export const index = (req, res) => {
  return res.render("index");
};

export const room = (req, res) => {
  const { id } = req.params;
  return res.render("room", { roomId: id });
};
