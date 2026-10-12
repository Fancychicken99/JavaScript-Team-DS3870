"use strict";
const objJobStatus = require("./JobStatus");
module.exports = (objSequelize, objDataTypes) => objSequelize.define("Job", {
  // Preserve legacy physical column names so existing jobs remain readable.
  intJobId: { field: "Id", type: objDataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  Title: { type: objDataTypes.STRING(200), allowNull: false, defaultValue: "Project inquiry" },
  strCustomerName: { type: objDataTypes.STRING(100), allowNull: false, defaultValue: "Existing customer" },
  strEmail: { type: objDataTypes.STRING(254), allowNull: false, defaultValue: "" },
  strCompany: { type: objDataTypes.STRING(150), allowNull: false, defaultValue: "" },
  strService: { type: objDataTypes.STRING(40), allowNull: false, defaultValue: "multidisciplinary" },
  strDetails: { type: objDataTypes.TEXT, allowNull: false, defaultValue: "" },
  strStatus: { field: "Status", type: objDataTypes.ENUM(...Object.values(objJobStatus)), allowNull: false, defaultValue: objJobStatus.Pending },
  dteExpectedCompletion: { type: objDataTypes.DATEONLY, allowNull: true },
  dteCreated: { field: "CreatedAt", type: objDataTypes.DATE, allowNull: false, defaultValue: objDataTypes.NOW },
  AssignedUserId: { type: objDataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: "Users", key: "Id" }, onDelete: "SET NULL" }
}, { tableName: "Jobs", timestamps: false, indexes: [{ fields: ["AssignedUserId", "CreatedAt"] }] });
