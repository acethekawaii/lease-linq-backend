import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;

  const mockUsersService = {
    findUserByName: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return user data when credentials are correct', async () =>  {
    const loginDto = { username: 'richmondsquare', password: 'admin' };

    mockUsersService.findUserByName.mockResolvedValue({
      id: 1,
      username: 'richmondsquare',
      password: 'admin',
      role: 'admin',
    });

    const result = await authService.validateUser(loginDto);

    expect(result).toEqual({
      id: 1,
      username: 'richmondsquare',
      role: 'admin',
    });

    expect(usersService.findUserByName).toHaveBeenCalledWith('richmondsquare');
  });

  it('should return null when credentials are incorrect', async () => {
    const loginDto = { username: 'richmondsquare', password: 'wrong' };

    mockUsersService.findUserByName.mockResolvedValue({
      id: 1,
      username: 'ace',
      password: '1234',
      role: 'admin',
    });

    const result = await authService.validateUser(loginDto as any);

    expect(result).toBeNull();
  });
});
