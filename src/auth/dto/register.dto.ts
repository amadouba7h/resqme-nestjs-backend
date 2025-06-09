import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: "Email de l'utilisateur",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'John',
    description: "Prénom de l'utilisateur",
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: "Nom de l'utilisateur",
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    example: 'password123',
    description: "Mot de passe de l'utilisateur",
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: '+22370540470',
    description: "Numéro de téléphone de l'utilisateur",
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;
}
