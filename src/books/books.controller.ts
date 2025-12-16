import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookFilterDto } from './dto/book-filter.dto';
import {
  BookResponseDto,
  BookDetailResponseDto,
  BookListResponseDto,
} from './dto/book-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserPayload } from '../common/types/request.types';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new book listing' })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'title',
        'description',
        'department',
        'course',
        'condition',
        'type',
        'images',
      ],
      properties: {
        title: {
          type: 'string',
          example: 'Introduction to Computer Science',
          description: 'Book title',
        },
        description: {
          type: 'string',
          example: 'Great condition, no markings. Used for one semester.',
          description: 'Book description',
        },
        department: {
          type: 'string',
          example: 'Computer Science',
          description: 'Department',
        },
        course: {
          type: 'string',
          example: 'Introduction to Programming',
          description: 'Course name',
        },
        condition: {
          type: 'number',
          example: 4,
          minimum: 1,
          maximum: 5,
          description: 'Book condition (1-5, where 5 is best)',
        },
        type: {
          type: 'string',
          enum: ['sell', 'exchange', 'both'],
          example: 'sell',
          description: 'Transaction type',
        },
        price: {
          type: 'number',
          example: 450,
          description: 'Price in TWD (required if type is sell or both)',
        },
        exchangeWishlist: {
          type: 'string',
          example: 'Looking for Calculus or Linear Algebra textbooks',
          description: 'Exchange wishlist (required if type is exchange or both)',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          minItems: 1,
          maxItems: 5,
          description: 'Book images (1-5 files, max 5MB each)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Book created successfully',
    type: BookResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: UserPayload,
    @Body() createBookDto: CreateBookDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.booksService.create(user.id, createBookDto, files);
  }

  @Get()
  @ApiOperation({ summary: 'Browse books with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'department', required: false, type: String })
  @ApiQuery({ name: 'course', required: false, type: String })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['sell', 'exchange', 'both'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['available', 'reserved', 'sold'],
  })
  @ApiResponse({
    status: 200,
    description: 'Books retrieved successfully',
    type: BookListResponseDto,
  })
  async findAll(@Query() filterDto: BookFilterDto) {
    return this.booksService.findAll(filterDto);
  }

  @Get('my-listings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user book listings' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['available', 'reserved', 'sold'],
  })
  @ApiResponse({
    status: 200,
    description: 'User books retrieved successfully',
    type: BookListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyListings(
    @CurrentUser() user: UserPayload,
    @Query() filterDto: BookFilterDto,
  ) {
    return this.booksService.findByUserId(user.id, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get book details by ID' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({
    status: 200,
    description: 'Book retrieved successfully',
    type: BookDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async findOne(@Param('id') id: string) {
    return this.booksService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update book listing (owner only)' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          example: 'Introduction to Computer Science',
          description: 'Book title',
        },
        description: {
          type: 'string',
          example: 'Great condition, no markings.',
          description: 'Book description',
        },
        department: {
          type: 'string',
          example: 'Computer Science',
          description: 'Department',
        },
        course: {
          type: 'string',
          example: 'Introduction to Programming',
          description: 'Course name',
        },
        condition: {
          type: 'number',
          example: 4,
          minimum: 1,
          maximum: 5,
          description: 'Book condition (1-5)',
        },
        type: {
          type: 'string',
          enum: ['sell', 'exchange', 'both'],
          example: 'sell',
          description: 'Transaction type',
        },
        price: {
          type: 'number',
          example: 450,
          description: 'Price in TWD',
        },
        exchangeWishlist: {
          type: 'string',
          example: 'Looking for Calculus textbooks',
          description: 'Exchange wishlist',
        },
        status: {
          type: 'string',
          enum: ['available', 'reserved', 'sold'],
          example: 'available',
          description: 'Book availability status',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          maxItems: 5,
          description: 'Book images (optional, max 5 files)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Book updated successfully',
    type: BookResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not book owner' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() updateBookDto: UpdateBookDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.booksService.update(id, user.id, updateBookDto, files);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete book listing (owner only)' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({ status: 204, description: 'Book deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not book owner' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async delete(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.booksService.delete(id, user.id);
  }
}
