"use strict";

const objJobStatus = require("./JobStatus");

module.exports = (objSequelize, objDataTypes) => objSequelize.define(
  "Job",
  {
    Id: {
      type: objDataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    Title: {
      type: objDataTypes.STRING(200),
      allowNull: false
    },
    Status: {
      type: objDataTypes.ENUM(...Object.values(objJobStatus)),
      allowNull: false,
      defaultValue: objJobStatus.Pending
    },
    CreatedAt: {
      type: objDataTypes.DATE,
      allowNull: false,
      defaultValue: objDataTypes.NOW
    },
    AssignedUserId: {
      type: objDataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "Users",
        key: "Id"
      },
      onDelete: "SET NULL"
    }
  },
  {
    tableName: "Jobs",
    timestamps: false
  }
);
