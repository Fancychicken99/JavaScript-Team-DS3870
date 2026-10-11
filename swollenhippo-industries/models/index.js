"use strict";

const objSequelizePackage = require("sequelize");
const objUserRole = require("./UserRole");
const objJobStatus = require("./JobStatus");
const fnDefineUser = require("./User");
const fnDefineJob = require("./Job");

const strConnectionString = process.env.MARIADB_URL;
if (!strConnectionString) {
  throw new Error("MARIADB_URL must be configured before loading the database models.");
}

const objSequelize = new objSequelizePackage.Sequelize(strConnectionString, {
  dialect: "mariadb",
  logging: false
});

const objUser = fnDefineUser(objSequelize, objSequelizePackage.DataTypes);
const objJob = fnDefineJob(objSequelize, objSequelizePackage.DataTypes);

objUser.hasMany(objJob, {
  as: "AssignedJobs",
  foreignKey: "AssignedUserId"
});
objJob.belongsTo(objUser, {
  as: "AssignedUser",
  foreignKey: "AssignedUserId"
});

module.exports = {
  objSequelize,
  User: objUser,
  Job: objJob,
  UserRole: objUserRole,
  JobStatus: objJobStatus
};
