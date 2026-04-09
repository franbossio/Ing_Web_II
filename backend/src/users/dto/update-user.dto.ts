import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() jobTitle?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() linkedin?: string;
  @IsOptional() @IsString() github?: string;
  @IsOptional() @IsString() portfolio?: string;
  @IsOptional() @IsNumber() @Type(() => Number) salary?: number;
  @IsOptional() @IsString() availability?: string;
  @IsOptional() @IsString() modality?: string;

  // Arrays de strings
  @IsOptional() @IsArray() skills?: string[];
  @IsOptional() @IsArray() softSkills?: string[];

  // Arrays de objetos — usar any[] sin validación anidada
  // para que el ValidationPipe no los filtre
  @IsOptional() experience?: any[];
  @IsOptional() education?: any[];
  @IsOptional() languages?: any[];

  // Company
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsString() companySize?: string;
  @IsOptional() @IsString() website?: string;

  // CV
  @IsOptional() @IsString() cvFileName?: string;
  @IsOptional() @IsString() cvUrl?: string;
  @IsOptional() @IsString() cvAnalysis?: string;
}
