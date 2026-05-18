import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { LoginDTO } from './dto/login.dto';
import { Role } from './constants/role.enum';

type SignInData = { 
  id: number, 
  username: string,
  role: Role;
}

type AuthResult = { 
  id: number, 
  username: string,
  role: Role,
  accessToken: string, 
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async authenticate(loginDto: LoginDTO): Promise<AuthResult> {
    const user = await this.validateUser(loginDto);

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.signIn(user);
  }

  async validateUser(loginDto: LoginDTO): Promise<SignInData | null> {
    const user = await this.usersService.findUserByName(loginDto.username);
    console.log(user)

    if (user && user.password === loginDto.password) {
      return {
        id: user.id,
        username: user.username,
        role: user.role,
      }
    } 

    return null;
  }

  async signIn(user: SignInData): Promise<AuthResult> {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      accessToken,
    }
  }
}
