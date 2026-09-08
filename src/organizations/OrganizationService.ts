import { Organization } from "./Organization";

export class OrganizationService {
  private readonly organizations: Organization[] = [];

  async create(
    organization: Organization
  ): Promise<Organization> {
    this.organizations.push(organization);

    return organization;
  }

  async findById(
    id: string
  ): Promise<Organization | null> {
    const organization = this.organizations.find(
      (organization) => organization.id === id
    );

    return organization ?? null;
  }

  async findAll(): Promise<Organization[]> {
    return [...this.organizations];
  }

  async update(
    id: string,
    data: Partial<Organization>
  ): Promise<Organization | null> {
    const index = this.organizations.findIndex(
      (organization) => organization.id === id
    );

    if (index === -1) {
      return null;
    }

    this.organizations[index] = {
      ...this.organizations[index],
      ...data,
      updatedAt: new Date(),
    };

    return this.organizations[index];
  }

  async activate(id: string): Promise<boolean> {
    const organization = await this.findById(id);

    if (!organization) {
      return false;
    }

    organization.isActive = true;
    organization.updatedAt = new Date();

    return true;
  }

  async deactivate(id: string): Promise<boolean> {
    const organization = await this.findById(id);

    if (!organization) {
      return false;
    }

    organization.isActive = false;
    organization.updatedAt = new Date();

    return true;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.organizations.findIndex(
      (organization) => organization.id === id
    );

    if (index === -1) {
      return false;
    }

    this.organizations.splice(index, 1);

    return true;
  }
}