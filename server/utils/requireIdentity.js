module.exports = function requireIdentity(req, res, next) {
  if (req.user || req.reconnectToken) return next();
  return res.status(401).json({ error: "Unauthorized" });
};
