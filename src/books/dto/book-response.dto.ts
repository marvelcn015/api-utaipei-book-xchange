import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from './pagination.dto';

export class BookOwnerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  department: string;
}

export class BookResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  department: string;

  @ApiProperty()
  course: string;

  @ApiProperty()
  condition: number;

  @ApiProperty()
  type: string;

  @ApiProperty({ nullable: true })
  price: number | null;

  @ApiProperty({ nullable: true })
  exchangeWishlist: string | null;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class BookDetailResponseDto extends BookResponseDto {
  @ApiProperty({ type: BookOwnerDto })
  user: BookOwnerDto;
}

export class BookListResponseDto {
  @ApiProperty({ type: [BookDetailResponseDto] })
  data: BookDetailResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination: PaginationMetaDto;
}
