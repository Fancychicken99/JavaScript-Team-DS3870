"use strict";

const express = require("express");
const { ValidationError } = require("sequelize");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const { Job, UserRole, JobStatus } = require("../../models");

const objRouter = express.Router();

objRouter.use(authenticate);

objRouter.get("/my-jobs", requireRole(UserRole.Customer), async (req, res, next) => {
  const intUserId = Number(req.objAuthenticatedUser.sub);
  if (!Number.isSafeInteger(intUserId) || intUserId < 1) {
    return res.status(401).json({ message: "Invalid user identity in token." });
  }

  try {
    const lstJobs = await Job.findAll({
      where: { AssignedUserId: intUserId },
      order: [["CreatedAt", "DESC"]]
    });
    return res.status(200).json(lstJobs);
  } catch (error) {
    return next(error);
  }
});

objRouter.patch("/:id/status", requireRole(UserRole.Admin), async (req, res, next) => {
  const intJobId = Number(req.params.id);
  if (!Number.isSafeInteger(intJobId) || intJobId < 1) {
    return res.status(400).json({ message: "Job ID must be a positive integer." });
  }

  const { status } = req.body || {};
  if (typeof status !== "string" || !Object.values(JobStatus).includes(status)) {
    return res.status(400).json({
      message: "Status must be Pending, InProgress, Complete, or Shipped."
    });
  }

  try {
    const objJob = await Job.findByPk(intJobId);
    if (!objJob) {
      return res.status(404).json({ message: "Job not found." });
    }

    objJob.Status = status;
    await objJob.save();
    return res.status(200).json(objJob);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ message: "Invalid job status." });
    }
    return next(error);
  }
});

module.exports = objRouter;
