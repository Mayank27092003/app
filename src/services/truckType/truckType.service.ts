import { TruckType } from "../../models/truckTypes";

export class TruckTypeService {
  async list() {
    return await TruckType.query().orderBy("sortIndex", "asc");
  }

  async getById(id: number) {
    return await TruckType.query().findById(id);
  }

  async create(data: Partial<TruckType>) {
    return await TruckType.query().insert(data).returning("*");
  }

  async update(id: number, data: Partial<TruckType>) {
    return await TruckType.query().patchAndFetchById(id, data);
  }

  async delete(id: number) {
    return await TruckType.query().deleteById(id);
  }
}
