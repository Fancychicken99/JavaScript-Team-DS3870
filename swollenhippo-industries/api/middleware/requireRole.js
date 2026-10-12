"use strict";
module.exports = function fnRequireRole(strRequiredRole) {
  return (objRequest, objResponse, fnNext) => {
    if (objRequest.objAuthenticatedUser?.role !== strRequiredRole) return objResponse.status(403).json({ message: "You are not authorized to perform this action." });
    return fnNext();
  };
};
