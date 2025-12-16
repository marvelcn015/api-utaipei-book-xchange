import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { FirebaseService } from '../firebase/firebase.service';
import { FIRESTORE_COLLECTIONS } from '../firebase/firebase.constants';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private firebaseService: FirebaseService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const firestore = this.firebaseService.getFirestore();
    const usersCollection = firestore.collection(FIRESTORE_COLLECTIONS.USERS);

    // Check if email already exists
    const existingUser = await usersCollection
      .where('email', '==', registerDto.email)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user document
    const userDoc = usersCollection.doc();
    const now = new Date();

    await userDoc.set({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      department: registerDto.department,
      studentId: registerDto.studentId,
      createdAt: now,
      updatedAt: now,
    });

    return {
      message: 'User registered successfully',
      userId: userDoc.id,
    };
  }

  async login(loginDto: LoginDto) {
    const firestore = this.firebaseService.getFirestore();
    const usersCollection = firestore.collection(FIRESTORE_COLLECTIONS.USERS);

    // Find user by email
    const userSnapshot = await usersCollection
      .where('email', '==', loginDto.email)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      userData.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: userDoc.id,
      email: userData.email,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        department: userData.department,
        studentId: userData.studentId,
      },
    };
  }

  async validateUser(userId: string) {
    const firestore = this.firebaseService.getFirestore();
    const userDoc = await firestore
      .collection(FIRESTORE_COLLECTIONS.USERS)
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    if (!userData) {
      return null;
    }

    return {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      department: userData.department,
      studentId: userData.studentId,
    };
  }
}
