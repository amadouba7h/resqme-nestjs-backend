import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AlertLocation } from './alert-location.entity';
import { AlertNotification } from './alert-notification.entity';
import { BaseEntity } from '../../common/entities/base.entity';

export enum AlertStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
}

@Entity('sos_alerts')
export class SosAlert extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE,
  })
  status: AlertStatus;

  @Column({ nullable: true })
  description: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.alerts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiredAt: Date;

  @OneToMany(() => AlertLocation, (location) => location.alert)
  locations: AlertLocation[];

  @OneToMany(() => AlertNotification, (notification) => notification.alert)
  notifications: AlertNotification[];
}
