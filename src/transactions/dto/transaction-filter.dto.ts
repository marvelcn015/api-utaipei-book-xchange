import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { PaginationDto } from '../../books/dto/pagination.dto';

export enum TransactionStatus {
  NEGOTIATING = 'negotiating',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
}

export enum TransactionRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ALL = 'all',
}

export class TransactionFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: TransactionRole,
    example: TransactionRole.ALL,
    description: 'Filter by user role',
    default: TransactionRole.ALL,
  })
  @IsOptional()
  @IsEnum(TransactionRole)
  role?: TransactionRole = TransactionRole.ALL;

  @ApiPropertyOptional({
    enum: TransactionStatus,
    example: TransactionStatus.NEGOTIATING,
    description: 'Filter by transaction status',
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;
}
