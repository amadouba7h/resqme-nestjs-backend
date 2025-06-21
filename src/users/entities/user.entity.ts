import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { TrustedContact } from './trusted-contact.entity';
import { SosAlert } from '../../sos/entities/sos-alert.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  GITHUB = 'github',
  FACEBOOK = 'facebook',
}

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  @Column({ name: 'fcm_token', nullable: true })
  @Exclude()
  fcmToken?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  provider: AuthProvider;

  @Column({ name: 'provider_id', nullable: true })
  providerId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ nullable: true })
  @Exclude()
  password?: string;

  @Column({ name: 'refresh_token', nullable: true, type: 'text' })
  @Exclude()
  refreshToken?: string | null;

  @Column({ name: 'password_reset_token', nullable: true })
  @Exclude()
  passwordResetToken?: string | null;

  @Column({ name: 'password_reset_expires', nullable: true })
  @Exclude()
  passwordResetExpires?: Date | null;

  @OneToMany(() => TrustedContact, (contact) => contact.user)
  trustedContacts: TrustedContact[];

  @OneToMany(() => SosAlert, (alert) => alert.user)
  alerts: SosAlert[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
  }
}
