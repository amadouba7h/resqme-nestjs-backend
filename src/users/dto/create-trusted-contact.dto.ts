import {
  IsEmail,
  IsString,
  IsPhoneNumber,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTrustedContactDto {
  @ApiProperty({
    example: 'Marie Martin',
    description: 'Nom du contact de confiance',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'trusted.contact@example.com',
    description: 'Email du contact de confiance',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '+22370540470',
    description: 'Numéro de téléphone du contact de confiance',
  })
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    example: true,
    description: "Indique si le contact est un utilisateur de l'application",
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isAppUser?: boolean;

  @ApiProperty({
    example: {
      email: true,
      push: false,
    },
    description: 'Préférences de notification',
    required: false,
  })
  @IsOptional()
  notificationPreferences?: {
    email?: boolean;
    push?: boolean;
  };
}
