// settings.test.js - Backend Settings Integration Tests
const request = require('supertest');
const app = require('../src/server');
const Setting = require('../src/models/Setting');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');

jest.mock('../src/models/Setting');
jest.mock('../src/models/User');

describe('Settings API Endpoints', () => {
  let mockToken;
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockToken = jwt.sign(
      { id: mockUser._id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here_make_it_long_and_secure',
      { expiresIn: '1h' }
    );
    
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });
  });

  describe('GET /api/settings', () => {
    it('should retrieve user settings', async () => {
      const mockSettings = {
        userId: mockUser._id,
        dailyGoalProductive: 14400,
        dailyGoalDistracting: 3600,
        dailyGoalFocusSessions: 3,
        focusDuration: 25,
        notificationsEnabled: true,
        theme: 'dark'
      };

      Setting.findOne.mockResolvedValue(mockSettings);

      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body.dailyGoalProductive).toBe(14400);
      expect(response.body.theme).toBe('dark');
    });
  });

  describe('PUT /api/settings', () => {
    it('should update and save settings variables', async () => {
      const mockSettingsInstance = {
        userId: mockUser._id,
        dailyGoalProductive: 14400,
        dailyGoalDistracting: 3600,
        theme: 'dark',
        save: jest.fn().mockResolvedValue(true)
      };

      Setting.findOne.mockResolvedValue(mockSettingsInstance);

      const response = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          dailyGoalProductive: 18000,
          theme: 'light'
        });

      expect(response.status).toBe(200);
      expect(mockSettingsInstance.dailyGoalProductive).toBe(18000);
      expect(mockSettingsInstance.theme).toBe('light');
      expect(mockSettingsInstance.save).toHaveBeenCalled();
    });
  });
});
