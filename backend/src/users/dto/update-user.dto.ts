import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

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
  @IsOptional() @IsNumber() salary?: number;
  @IsOptional() @IsString() availability?: string;
  @IsOptional() @IsString() modality?: string;
  @IsOptional() @IsArray() skills?: string[];
  @IsOptional() @IsArray() softSkills?: string[];
  @IsOptional() @IsArray() languages?: any[];
  @IsOptional() @IsArray() experience?: any[];
  @IsOptional() @IsArray() education?: any[];
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsString() companySize?: string;
  @IsOptional() @IsString() website?: string;
}
