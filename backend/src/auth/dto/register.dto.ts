import { IsEmail, IsString, MinLength, IsIn, IsOptional, ValidateIf } from 'class-validator';

export class RegisterDto {
  @IsIn(['candidate', 'company'], { message: 'El rol debe ser "candidate" o "company"' })
  role: 'candidate' | 'company';

  @IsEmail({}, { message: 'Ingresá un correo válido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
  password: string;

  // Solo requeridos si role === 'candidate'
  @ValidateIf(o => o.role === 'candidate')
  @IsString({ message: 'El nombre es requerido' })
  @MinLength(1)
  firstName?: string;

  @ValidateIf(o => o.role === 'candidate')
  @IsString({ message: 'El apellido es requerido' })
  @MinLength(1)
  lastName?: string;

  // Solo requerido si role === 'company'
  @ValidateIf(o => o.role === 'company')
  @IsString({ message: 'El nombre de la empresa es requerido' })
  @MinLength(1)
  companyName?: string;
}
