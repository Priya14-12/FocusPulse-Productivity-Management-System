// auth.test.js - Backend Authentication Integration Tests
const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');
const Setting = require('../src/models/Setting');

// Mock User and Setting mongoose models
jest.mock('../src/models/User');
jest.mock('../src/models/Setting');

describe('Auth API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and generate a token', async () => {
      // Mock findOne to return null (user doesn't exist)
      User.findOne.mockResolvedValue(null);
      
      // Mock create to return a new user
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        createdAt: new Date()
      };
      User.create.mockResolvedValue(mockUser);
      Setting.create.mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'securepassword123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.email).toBe('test@example.com');
      expect(response.body._id).toBe(mockUser._id);
    });

    it('should fail registration with invalid email input validation', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123' // too short
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in an existing user with correct credentials', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        matchPassword: jest.fn().mockResolvedValue(true)
      };

      // Mock chain query for select('+password')
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'securepassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.email).toBe('test@example.com');
    });

    it('should deny access for invalid password credentials', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        matchPassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });
  });
});
