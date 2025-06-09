import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: "Email de l'utilisateur",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: "Mot de passe de l'utilisateur",
  })
  @IsString()
  @MinLength(6)
  password: string;
}
