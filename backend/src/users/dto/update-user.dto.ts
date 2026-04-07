import { IsOptional, IsString, IsNumber, IsArray, Allow } from 'class-validator';
import { Transform } from 'class-transformer';

// Convierte undefined → undefined, null → null, string → string trimmed
const trimStr = () => Transform(({ value }) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value).trim();
});

export class UpdateUserDto {
  // Strings: aceptan valor vacío "" para borrar el campo
  @IsOptional() @IsString() @trimStr() firstName?: string;
  @IsOptional() @IsString() @trimStr() lastName?: string;
  @IsOptional() @IsString() @trimStr() phone?: string;
  @IsOptional() @IsString() @trimStr() jobTitle?: string;
  @IsOptional() @IsString() @trimStr() location?: string;
  @IsOptional() @IsString() @trimStr() bio?: string;
  @IsOptional() @IsString() @trimStr() linkedin?: string;
  @IsOptional() @IsString() @trimStr() github?: string;
  @IsOptional() @IsString() @trimStr() portfolio?: string;
  @IsOptional() @IsString() @trimStr() availability?: string;
  @IsOptional() @IsString() @trimStr() modality?: string;
  @IsOptional() @IsString() @trimStr() companyName?: string;
  @IsOptional() @IsString() @trimStr() industry?: string;
  @IsOptional() @IsString() @trimStr() companySize?: string;
  @IsOptional() @IsString() @trimStr() website?: string;

  // Número: null borra el campo
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return isNaN(n) ? null : n;
  })
  salary?: number | null;

  // Arrays: [] limpia el campo
  @IsOptional() @IsArray() skills?: string[];
  @IsOptional() @IsArray() softSkills?: string[];
  @IsOptional() @IsArray() languages?: any[];
  @IsOptional() @IsArray() experience?: any[];
  @IsOptional() @IsArray() education?: any[];
}