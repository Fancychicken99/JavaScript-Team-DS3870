"use strict";

const objUserRole = require("./UserRole");

module.exports = (objSequelize, objDataTypes) => objSequelize.define(
  "User",
  {
    Id: {
      type: objDataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    Username: {
      type: objDataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    PasswordHash: {
      type: objDataTypes.STRING(255),
      allowNull: false
    },
    Role: {
      type: objDataTypes.ENUM(...Object.values(objUserRole)),
      allowNull: false,
      defaultValue: objUserRole.Customer
    }
  },
  {
    tableName: "Users",
    timestamps: false
  }
);
