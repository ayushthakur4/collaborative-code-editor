import { prisma } from "../config/prisma.js";

interface CreateProjectInput {
  name: string;
  description?: string;
  ownerId: string;
}

export const createProject = async (
  data: CreateProjectInput
) => {
  return prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      ownerId: data.ownerId
    }
  });
};