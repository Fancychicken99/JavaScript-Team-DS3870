"use strict";

function requireRole(strRequiredRole) {
  return (req, res, next) => {
    if (!req.objAuthenticatedUser || req.objAuthenticatedUser.role !== strRequiredRole) {
      return res.status(403).json({ message: "You are not authorized to perform this action." });
    }
    return next();
  };
}

module.exports = requireRole;
