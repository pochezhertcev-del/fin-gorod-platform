import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, Role, Wallet } from '../../entities';

const BCRYPT_COST = 12; // section 2.1

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Wallet) private readonly walletRepo: Repository<Wallet>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Hash password with bcrypt (cost factor 12).
   * Pure function for testability.
   */
  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_COST);
  }

  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    parentId?: number;
  }): Promise<AuthTokens & { user: Partial<User> }> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const role = await this.roleRepo.findOne({ where: { name: dto.role } });
    if (!role) {
      throw new ConflictException('Role not found');
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.userRepo.save({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      roleId: role.id,
      parentId: dto.parentId ?? null,
      consentGiven: dto.role !== UserRole.STUDENT, // student consent given by parent
    });

    // Auto-create wallet for students
    if (dto.role === UserRole.STUDENT) {
      await this.walletRepo.save({ userId: user.id, balance: 0 });
    }

    const tokens = this.generateTokens({
      sub: user.id,
      email: user.email,
      role: dto.role,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['role'],
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account disabled');
    }

    const valid = await this.verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role.name as UserRole,
    });
  }

  generateTokens(payload: JwtPayload): AuthTokens {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET,
    });
    return { accessToken, refreshToken };
  }
}
