import { type Request, type Response } from "express";
import { createProject } from "../services/project.service.js";

export const createProjectController = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      });

      return;
    }

    const { name, description } = req.body;

    const project = await createProject({
      name,
      description,
      ownerId: req.user.id
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create project"
    });
  }
};