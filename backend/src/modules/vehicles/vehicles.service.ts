import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateVehicleDto, CreateVehicleMaintenanceDto, CreateFuelLogDto } from './vehicles.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateVehicleDto) {
    const res = await this.db.query(
      `INSERT INTO vehicles (store_id, plate, brand, model, year, type, capacity_kg, fuel_type)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'TRUCK'), $7, COALESCE($8, 'DIESEL'))
       RETURNING *`,
      [
        dto.storeId,
        dto.plate,
        dto.brand,
        dto.model || null,
        dto.year || null,
        dto.type || null,
        dto.capacityKg || null,
        dto.fuelType || null,
      ],
    );
    return res.rows[0];
  }

  async findAll(storeId: string, status?: string) {
    let sql = `SELECT * FROM vehicles WHERE store_id = $1`;
    const params: any[] = [storeId];

    if (status) {
      sql += ` AND status = $2`;
      params.push(status);
    }

    sql += ' ORDER BY plate ASC';
    const res = await this.db.query(sql, params);
    return res.rows;
  }

  async findOne(id: string) {
    const res = await this.db.query(
      `SELECT * FROM vehicles WHERE id = $1`,
      [id],
    );
    if (res.rowCount === 0) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    const vehicle = res.rows[0];

    const maintenanceRes = await this.db.query(
      `SELECT * FROM vehicle_maintenance WHERE vehicle_id = $1 ORDER BY service_date DESC LIMIT 10`,
      [id],
    );
    const fuelRes = await this.db.query(
      `SELECT * FROM vehicle_fuel_log WHERE vehicle_id = $1 ORDER BY fueled_at DESC LIMIT 10`,
      [id],
    );

    vehicle.maintenance = maintenanceRes.rows;
    vehicle.fuelLogs = fuelRes.rows;
    return vehicle;
  }

  async addMaintenance(dto: CreateVehicleMaintenanceDto) {
    await this.findOne(dto.vehicleId);
    const res = await this.db.query(
      `INSERT INTO vehicle_maintenance (vehicle_id, maintenance_type, description, cost, mileage_at_service, provider, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        dto.vehicleId,
        dto.maintenanceType,
        dto.description,
        dto.cost,
        dto.mileageAtService || null,
        dto.provider || null,
        dto.notes || null,
      ],
    );
    return res.rows[0];
  }

  async addFuelLog(dto: CreateFuelLogDto, userId?: string) {
    await this.findOne(dto.vehicleId);
    const totalCost = dto.liters * dto.costPerLiter;
    const res = await this.db.query(
      `INSERT INTO vehicle_fuel_log (vehicle_id, driver_id, liters, cost_per_liter, total_cost, mileage, station)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        dto.vehicleId,
        userId || null,
        dto.liters,
        dto.costPerLiter,
        totalCost,
        dto.mileage || null,
        dto.station || null,
      ],
    );
    return res.rows[0];
  }
}
