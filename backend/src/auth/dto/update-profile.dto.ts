// users/dto/update-profile.dto.ts
import { IsOptional, IsString, IsEmail, IsNumber } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString()  firstName?:   string;
  @IsOptional() @IsString()  lastName?:    string;
  @IsOptional() @IsEmail()   email?:       string;
  @IsOptional() @IsString()  phone?:       string;
  @IsOptional() @IsString()  jobTitle?:    string;
  @IsOptional() @IsString()  location?:    string;
  @IsOptional() @IsString()  bio?:         string;
  @IsOptional() @IsString()  linkedin?:    string;
  @IsOptional() @IsString()  github?:      string;
  @IsOptional() @IsString()  portfolio?:   string;
  @IsOptional() @IsNumber()  salary?:      number;

  // Campos de objeto (se guardan como JSON en la DB)
  @IsOptional() skills?:     string[];   // habilidades técnicas
  @IsOptional() softSkills?: string[];   // habilidades blandas
  @IsOptional() languages?:  { name: string; level: string }[];
  @IsOptional() experience?: {
    title: string; company: string;
    startDate: string; endDate?: string;
    current: boolean; description?: string;
  }[];
  @IsOptional() education?:  {
    degree: string; institution: string;
    startYear: number; endYear?: number; status: string;
  }[];
}