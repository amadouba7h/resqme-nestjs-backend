import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsPhoneNumber, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Email',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Prénom', example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ description: 'Nom', example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Numéro de téléphone',
    example: '+22370540470',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;
}
