export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  AUDITOR = "AUDITOR",
  VIEWER = "VIEWER",
}

export interface User {
  id: string;

  organizationId: string;

  firstName: string;

  lastName: string;

  email: string;

  password: string;

  role: UserRole;

  isActive: boolean;

  createdAt: Date;

  updatedAt: Date;
}