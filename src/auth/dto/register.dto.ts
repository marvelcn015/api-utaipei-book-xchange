import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'student@go.utaipei.edu.tw',
    description: 'University email address',
  })
  @IsEmail()
  @Matches(/@go\.utaipei\.edu\.tw$/, {
    message: 'Email must be a valid UTaipei email address (@go.utaipei.edu.tw)',
  })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password (minimum 8 characters)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    example: 'Computer Science',
    description: 'Department name',
  })
  @IsString()
  @MinLength(1)
  department: string;

  @ApiProperty({
    example: '11012345',
    description: 'Student ID number',
  })
  @IsString()
  @MinLength(1)
  studentId: string;
}
