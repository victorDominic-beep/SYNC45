import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { User } from "./User";
import { PostgresRepository } from "../repositories/PostgresRepository";
import { Jwt } from "../shared/utils/Jwt";

const otpStore = new Map<string, { otp: string; createdAt: number; expiresAt: number }>();

export class UserService {
  private readonly users: User[] = [];

  constructor(private readonly postgresRepository?: PostgresRepository) {}

  async create(user: User): Promise<User> {
    this.users.push(user);

    return user;
  }

  async register(payload: any): Promise<any> {
    const email = String(payload.email || "").trim().toLowerCase();
    const name = String(payload.name || "Organization");
    const password = String(payload.password || "");

    if (!email || !password) {
      throw new Error("email and password are required.");
    }

    if (this.postgresRepository) {
      const existing = await this.postgresRepository.findUserByEmail(email);

      if (existing) {
        throw new Error("User already exists.");
      }

      const org = await this.postgresRepository.createOrganization(name, email);
      const id = randomUUID();
      const passwordHash = await bcrypt.hash(password, 10);

      const user = await this.postgresRepository.createUser({
        id,
        organizationId: org.id,
        firstName: payload.firstName || "Sync45",
        lastName: payload.lastName || "Admin",
        email,
        passwordHash,
        provider: "local",
        providerUserId: null,
        role: "ADMIN",
        isActive: true,
      });

      const token = Jwt.sign({
        sub: user.id,
        email: user.email,
        organizationId: org.id,
        role: user.role,
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          organizationId: user.organization_id,
          role: user.role,
        },
      };
    }

    throw new Error("PostgreSQL repository is not configured.");
  }

  async login(payload: any): Promise<any> {
    const email = String(payload.email || "").trim().toLowerCase();
    const password = String(payload.password || "");

    if (!email || !password) {
      throw new Error("email and password are required.");
    }

    if (!this.postgresRepository) {
      throw new Error("PostgreSQL repository is not configured.");
    }

    const user = await this.postgresRepository.findUserByEmail(email);

    if (!user) {
      throw new Error("Invalid credentials.");
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      throw new Error("Invalid credentials.");
    }

    const token = Jwt.sign({
      sub: user.id,
      email: user.email,
      organizationId: user.organization_id,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        organizationId: user.organization_id,
        role: user.role,
      },
    };
  }

  async getMe(userId: string): Promise<any> {
    if (!this.postgresRepository) {
      throw new Error("PostgreSQL repository is not configured.");
    }

    const user = await this.postgresRepository.findUserById(userId);
    return user
      ? {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            organizationId: user.organization_id,
            role: user.role,
          },
        }
      : null;
  }

  async forgotPassword(payload: any): Promise<any> {
    if (!this.postgresRepository) {
      throw new Error("PostgreSQL repository is not configured.");
    }

    const email = String(payload.email || "").trim().toLowerCase();
    if (!email) {
      throw new Error("email is required.");
    }

    const user = await this.postgresRepository.findUserByEmail(email);
    if (!user) {
      throw new Error("If the email exists, an OTP has been sent.");
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const createdAt = Date.now();
    const expiresAt = createdAt + 5 * 60 * 1000;

    otpStore.set(email, { otp, createdAt, expiresAt });

    return {
      success: true,
      message: "OTP sent for password reset.",
      otp,
    };
  }

  async resetPassword(payload: any): Promise<any> {
    if (!this.postgresRepository) {
      throw new Error("PostgreSQL repository is not configured.");
    }

    const email = String(payload.email || "").trim().toLowerCase();
    const otp = String(payload.otp || "");
    const password = String(payload.password || "");

    if (!email || !otp || !password) {
      throw new Error("email, otp, and password are required.");
    }

    const otpRecord = otpStore.get(email);
    if (!otpRecord || otpRecord.otp !== otp || Date.now() > otpRecord.expiresAt) {
      throw new Error("Invalid or expired OTP.");
    }

    const user = await this.postgresRepository.findUserByEmail(email);
    if (!user) {
      throw new Error("Invalid reset request.");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await this.postgresRepository.updateUserPassword(user.id, passwordHash);
    otpStore.delete(email);

    return {
      success: true,
      message: "Password reset successfully.",
    };
  }

  async googleLogin(payload: any): Promise<any> {
    const email = String(payload.email || "").trim().toLowerCase();
    const firstName = String(payload.firstName || "Google");
    const lastName = String(payload.lastName || "User");

    if (!email) {
      throw new Error("Google email is required.");
    }

    if (!this.postgresRepository) {
      throw new Error("PostgreSQL repository is not configured.");
    }

    const existing = await this.postgresRepository.findUserByEmail(email);

    if (existing) {
      return {
        user: {
          id: existing.id,
          email: existing.email,
          firstName: existing.first_name,
          lastName: existing.last_name,
          organizationId: existing.organization_id,
          role: existing.role,
        },
      };
    }

    const org = await this.postgresRepository.createOrganization(
      "Google Organization",
      email
    );
    const id = randomUUID();
    const newUser = await this.postgresRepository.createUser({
      id,
      organizationId: org.id,
      firstName,
      lastName,
      email,
      passwordHash: null,
      provider: "google",
      providerUserId: payload.providerUserId || randomUUID(),
      role: "ADMIN",
      isActive: true,
    });

    const token = Jwt.sign({
      sub: newUser.id,
      email: newUser.email,
      organizationId: newUser.organization_id,
      role: newUser.role,
    });

    return {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        organizationId: newUser.organization_id,
        role: newUser.role,
      },
    };
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.find(
      (user) => user.id === id
    );

    return user ?? null;
  }

  async findByEmail(
    email: string
  ): Promise<User | null> {
    const user = this.users.find(
      (user) => user.email === email
    );

    return user ?? null;
  }

  async findAll(): Promise<User[]> {
    return [...this.users];
  }

  async findByOrganization(
    organizationId: string
  ): Promise<User[]> {
    return this.users.filter(
      (user) => user.organizationId === organizationId
    );
  }

  async update(
    id: string,
    data: Partial<User>
  ): Promise<User | null> {
    const index = this.users.findIndex(
      (user) => user.id === id
    );

    if (index === -1) {
      return null;
    }

    this.users[index] = {
      ...this.users[index],
      ...data,
      updatedAt: new Date(),
    };

    return this.users[index];
  }

  async activate(id: string): Promise<boolean> {
    const user = await this.findById(id);

    if (!user) {
      return false;
    }

    user.isActive = true;
    user.updatedAt = new Date();

    return true;
  }

  async deactivate(id: string): Promise<boolean> {
    const user = await this.findById(id);

    if (!user) {
      return false;
    }

    user.isActive = false;
    user.updatedAt = new Date();

    return true;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.users.findIndex(
      (user) => user.id === id
    );

    if (index === -1) {
      return false;
    }

    this.users.splice(index, 1);

    return true;
  }
}