import { IsEmail, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Ingresá un correo válido' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'La contraseña no puede estar vacía' })
  password: string;

  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}
