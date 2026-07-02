// activity.test.js - Backend Activity Sync Integration Tests
const request = require('supertest');
const app = require('../src/server');
const Activity = require('../src/models/Activity');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');

jest.mock('../src/models/Activity');
jest.mock('../src/models/User');

describe('Activity API Endpoints', () => {
  let mockToken;
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Generate valid testing token
    mockToken = jwt.sign(
      { id: mockUser._id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here_make_it_long_and_secure',
      { expiresIn: '1h' }
    );
    
    // Mock user identification in protect middleware
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });
  });

  describe('POST /api/activities/sync', () => {
    it('should sync an array of activities successfully', async () => {
      const mockActivities = [
        {
          domain: 'github.com',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 300,
          category: 'productive'
        }
      ];

      Activity.insertMany.mockResolvedValue(mockActivities);

      const response = await request(app)
        .post('/api/activities/sync')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ activities: mockActivities });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Activities synchronized successfully');
      expect(response.body.count).toBe(1);
    });

    it('should return 400 bad request if activities is not an array', async () => {
      const response = await request(app)
        .post('/api/activities/sync')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ activities: 'not-an-array' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid sync data. Please provide an array of activities.');
    });
  });

  describe('GET /api/activities', () => {
    it('should retrieve activities for authenticated user', async () => {
      const mockList = [
        { domain: 'google.com', duration: 120, category: 'neutral' }
      ];

      // Mock chain sort method
      Activity.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockList)
      });

      const response = await request(app)
        .get('/api/activities')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].domain).toBe('google.com');
    });
  });
});
