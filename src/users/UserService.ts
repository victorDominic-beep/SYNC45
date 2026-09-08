import { User } from "./User";

export class UserService {
  private readonly users: User[] = [];

  async create(user: User): Promise<User> {
    this.users.push(user);

    return user;
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