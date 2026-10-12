"use strict";
const objBcrypt = require("bcryptjs");
const { UniqueConstraintError: clsUniqueConstraintError } = require("sequelize");
function fnTestEnvironment() {
  process.env.JWT_SECRET = "test-only-secret-with-at-least-64-bytes-0123456789-abcdefghijklmnopqrstuvwxyz";
  process.env.JWT_ISSUER = "SwollenHippo.Api"; process.env.JWT_AUDIENCE = "SwollenHippo.Client";
}
function fnTestDatabase() {
  const arrUsers = [
    { Id: 1, Username: "customer", PasswordHash: objBcrypt.hashSync("customer-password", 4), Role: "Customer" },
    { Id: 2, Username: "administrator", PasswordHash: objBcrypt.hashSync("administrator-password", 4), Role: "Admin" },
    { Id: 3, Username: "other-customer", PasswordHash: objBcrypt.hashSync("other-password", 4), Role: "Customer" }
  ];
  const arrJobs = [];
  return {
    arrUsers, arrJobs, UserRole: require("../../models/UserRole"), JobStatus: require("../../models/JobStatus"),
    User: {
      async findOne(objOptions) { return arrUsers.find((objUser) => objUser.Username === objOptions.where.Username) || null; },
      async findByPk(intId) { return arrUsers.find((objUser) => objUser.Id === intId) || null; },
      async create(objValues) {
        if (arrUsers.some((objUser) => objUser.Username === objValues.Username)) throw new clsUniqueConstraintError({ errors: [] });
        const objUser = { Id: arrUsers.length + 1, ...objValues }; arrUsers.push(objUser); return objUser;
      }
    },
    Job: {
      async create(objValues) {
        const objJob = { intJobId: arrJobs.length + 1, dteCreated: new Date().toISOString(), ...objValues,
          async save() { return this; } }; arrJobs.push(objJob); return objJob;
      },
      async findByPk(intId) { return arrJobs.find((objJob) => objJob.intJobId === intId) || null; },
      async findAll(objOptions) {
        return arrJobs.filter((objJob) => objOptions.where.AssignedUserId === undefined || objJob.AssignedUserId === objOptions.where.AssignedUserId)
          .sort((objFirst, objSecond) => objSecond.intJobId - objFirst.intJobId).slice(objOptions.offset, objOptions.offset + objOptions.limit);
      }
    }
  };
}
module.exports = { fnTestEnvironment, fnTestDatabase };
