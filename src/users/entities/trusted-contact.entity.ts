import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('trusted_contacts')
export class TrustedContact extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Identifiant unique du contact de confiance',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Column()
  @ApiProperty({
    description: 'Nom du contact de confiance',
    example: 'Marie Martin',
  })
  name: string;

  @Column()
  @ApiProperty({
    description: 'Email du contact de confiance',
    example: 'trusted.contact@example.com',
  })
  email: string;

  @Column()
  @ApiProperty({
    description: 'Numéro de téléphone du contact de confiance',
    example: '+22370540470',
  })
  phoneNumber: string;

  @Column('jsonb', { nullable: true })
  @ApiProperty({
    description: 'Préférences de notification',
    example: {
      email: true,
      sms: false,
      push: false,
    },
  })
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };

  @ManyToOne(() => User, (user) => user.trustedContacts)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
