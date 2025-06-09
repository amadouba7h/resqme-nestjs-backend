import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { SosAlert, AlertStatus } from '../sos/entities/sos-alert.entity';
import { AlertLocation } from '../sos/entities/alert-location.entity';
import { AlertNotification } from '../sos/entities/alert-notification.entity';
import { TrustedContact } from '../users/entities/trusted-contact.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(SosAlert)
    private alertsRepository: Repository<SosAlert>,
    @InjectRepository(AlertLocation)
    private locationsRepository: Repository<AlertLocation>,
    @InjectRepository(AlertNotification)
    private notificationsRepository: Repository<AlertNotification>,
    @InjectRepository(TrustedContact)
    private contactsRepository: Repository<TrustedContact>,
  ) {}

  // User Management
  async getAllUsers(
    page = 1,
    limit = 10,
  ): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.usersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { users, total };
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['trustedContacts'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUserRole(id: string, role: UserRole): Promise<User> {
    const user = await this.getUserById(id);
    user.role = role;
    return this.usersRepository.save(user);
  }

  async toggleUserStatus(id: string): Promise<User> {
    const user = await this.getUserById(id);
    user.isActive = !user.isActive;
    return this.usersRepository.save(user);
  }

  // Alert Management
  async getAllAlerts(
    page = 1,
    limit = 10,
    status?: AlertStatus,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ alerts: SosAlert[]; total: number }> {
    const query = this.alertsRepository
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.user', 'user')
      .leftJoinAndSelect('alert.locations', 'locations')
      .leftJoinAndSelect('alert.notifications', 'notifications');

    if (status) {
      query.andWhere('alert.status = :status', { status });
    }

    if (startDate && endDate) {
      query.andWhere('alert.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const [alerts, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('alert.createdAt', 'DESC')
      .getManyAndCount();

    return { alerts, total };
  }

  async getAlertById(id: string): Promise<SosAlert> {
    const alert = await this.alertsRepository.findOne({
      where: { id },
      relations: ['user', 'locations', 'notifications'],
    });
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }
    return alert;
  }

  async resolveAlert(id: string): Promise<SosAlert> {
    const alert = await this.getAlertById(id);
    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();
    return this.alertsRepository.save(alert);
  }

  // Statistics
  async getDashboardStats(): Promise<{
    totalUsers: number;
    activeAlerts: number;
    resolvedAlerts: number;
    totalAlerts: number;
    alertsByStatus: Record<AlertStatus, number>;
    alertsByDay: { date: string; count: number }[];
  }> {
    const [
      totalUsers,
      activeAlerts,
      resolvedAlerts,
      totalAlerts,
      alertsByStatus,
    ] = await Promise.all([
      this.usersRepository.count(),
      this.alertsRepository.count({ where: { status: AlertStatus.ACTIVE } }),
      this.alertsRepository.count({ where: { status: AlertStatus.RESOLVED } }),
      this.alertsRepository.count(),
      this.alertsRepository
        .createQueryBuilder('alert')
        .select('alert.status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('alert.status')
        .getRawMany(),
    ]);

    // Get alerts by day for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const alertsByDay = await this.alertsRepository
      .createQueryBuilder('alert')
      .select('DATE(alert.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('alert.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      totalUsers,
      activeAlerts,
      resolvedAlerts,
      totalAlerts,
      alertsByStatus: alertsByStatus.reduce(
        (acc, curr) => {
          acc[curr.alert_status] = parseInt(curr.count);
          return acc;
        },
        {} as Record<AlertStatus, number>,
      ),
      alertsByDay: alertsByDay.map((day) => ({
        date: day.date,
        count: parseInt(day.count),
      })),
    };
  }
}
