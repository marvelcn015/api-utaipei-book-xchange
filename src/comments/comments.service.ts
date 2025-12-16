import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';
import { FIRESTORE_COLLECTIONS } from '../firebase/firebase.constants';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PaginationDto } from '../books/dto/pagination.dto';

@Injectable()
export class CommentsService {
  constructor(
    private firebaseService: FirebaseService,
    private usersService: UsersService,
  ) {}

  async create(bookId: string, userId: string, createCommentDto: CreateCommentDto) {
    const firestore = this.firebaseService.getFirestore();

    // Check if book exists
    const bookDoc = await firestore
      .collection(FIRESTORE_COLLECTIONS.BOOKS)
      .doc(bookId)
      .get();

    if (!bookDoc.exists) {
      throw new NotFoundException('Book not found');
    }

    const commentsCollection = firestore.collection(FIRESTORE_COLLECTIONS.COMMENTS);
    const commentDoc = commentsCollection.doc();
    const now = new Date();

    await commentDoc.set({
      bookId,
      userId,
      content: createCommentDto.content,
      createdAt: now,
      updatedAt: now,
    });

    const userInfo = await this.usersService.getPublicProfile(userId);

    return {
      id: commentDoc.id,
      bookId,
      userId,
      user: userInfo,
      content: createCommentDto.content,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  async findByBookId(bookId: string, paginationDto: PaginationDto) {
    const firestore = this.firebaseService.getFirestore();

    // Check if book exists
    const bookDoc = await firestore
      .collection(FIRESTORE_COLLECTIONS.BOOKS)
      .doc(bookId)
      .get();

    if (!bookDoc.exists) {
      throw new NotFoundException('Book not found');
    }

    let query: any = firestore
      .collection(FIRESTORE_COLLECTIONS.COMMENTS)
      .where('bookId', '==', bookId)
      .orderBy('createdAt', 'asc');

    // Get total count
    const allDocs = await query.get();
    const total = allDocs.size;

    // Apply pagination
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 50;
    const offset = (page - 1) * limit;

    query = query.limit(limit).offset(offset);

    const snapshot = await query.get();
    const comments: any[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const userInfo = await this.usersService.getPublicProfile(data.userId);

      comments.push({
        id: doc.id,
        bookId: data.bookId,
        userId: data.userId,
        user: userInfo,
        content: data.content,
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
      });
    }

    return {
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(commentId: string, userId: string, updateCommentDto: UpdateCommentDto) {
    const firestore = this.firebaseService.getFirestore();
    const commentRef = firestore
      .collection(FIRESTORE_COLLECTIONS.COMMENTS)
      .doc(commentId);

    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) {
      throw new NotFoundException('Comment not found');
    }

    const commentData = commentDoc.data();
    if (!commentData) {
      throw new NotFoundException('Comment not found');
    }

    // Check ownership
    if (commentData.userId !== userId) {
      throw new ForbiddenException('You do not own this comment');
    }

    await commentRef.update({
      content: updateCommentDto.content,
      updatedAt: new Date(),
    });

    const updatedDoc = await commentRef.get();
    const updatedData = updatedDoc.data();
    if (!updatedData) {
      throw new NotFoundException('Comment not found');
    }

    const userInfo = await this.usersService.getPublicProfile(updatedData.userId);

    return {
      id: updatedDoc.id,
      bookId: updatedData.bookId,
      userId: updatedData.userId,
      user: userInfo,
      content: updatedData.content,
      createdAt: updatedData.createdAt?.toDate().toISOString(),
      updatedAt: updatedData.updatedAt?.toDate().toISOString(),
    };
  }

  async delete(commentId: string, userId: string) {
    const firestore = this.firebaseService.getFirestore();
    const commentRef = firestore
      .collection(FIRESTORE_COLLECTIONS.COMMENTS)
      .doc(commentId);

    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) {
      throw new NotFoundException('Comment not found');
    }

    const commentData = commentDoc.data();
    if (!commentData) {
      throw new NotFoundException('Comment not found');
    }

    // Check ownership
    if (commentData.userId !== userId) {
      throw new ForbiddenException('You do not own this comment');
    }

    await commentRef.delete();
  }
}
