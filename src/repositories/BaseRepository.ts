export abstract class BaseRepository<T> {
  abstract create(data: T): Promise<T>;

  abstract findById(id: string): Promise<T | null>;

  abstract findAll(): Promise<T[]>;

  abstract update(
    id: string,
    data: Partial<T>
  ): Promise<T | null>;

  abstract delete(id: string): Promise<boolean>;
}