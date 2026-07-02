// report.test.js - Backend Reports Integration Tests
const request = require('supertest');
const app = require('../src/server');
const Report = require('../src/models/Report');
const Activity = require('../src/models/Activity');
const FocusSession = require('../src/models/FocusSession');
const Setting = require('../src/models/Setting');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');

jest.mock('../src/models/Report');
jest.mock('../src/models/Activity');
jest.mock('../src/models/FocusSession');
jest.mock('../src/models/Setting');
jest.mock('../src/models/User');

describe('Reports API Endpoints', () => {
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

  describe('POST /api/reports/generate', () => {
    it('should calculate productivity scores and generate today report successfully', async () => {
      // Mock active sessions details
      const mockActivities = [
        { domain: 'github.com', duration: 1800, category: 'productive' },
        { domain: 'youtube.com', duration: 600, category: 'distracting' }
      ];
      Activity.find.mockResolvedValue(mockActivities);

      // Mock completed focus sessions
      const mockFocusSessions = [{ _id: '1', completed: true }];
      FocusSession.find.mockResolvedValue(mockFocusSessions);

      // Mock user goals
      Setting.findOne.mockResolvedValue({
        dailyGoalProductive: 14400,
        dailyGoalDistracting: 3600,
        dailyGoalFocusSessions: 3
      });

      // Mock report output
      const mockGeneratedReport = {
        userId: mockUser._id,
        date: '2026-06-29',
        totalTime: 2400,
        productiveTime: 1800,
        neutralTime: 0,
        distractingTime: 600,
        mostVisitedSite: 'github.com',
        productivityScore: 75,
        focusSessionsCount: 1,
        blockedAttemptsCount: 0
      };
      Report.findOneAndUpdate.mockResolvedValue(mockGeneratedReport);

      const response = await request(app)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ date: '2026-06-29' });

      expect(response.status).toBe(200);
      expect(response.body.totalTime).toBe(2400);
      expect(response.body.mostVisitedSite).toBe('github.com');
      expect(response.body.productivityScore).toBe(75);
    });

    it('should fail generation if date is missing in payload', async () => {
      const response = await request(app)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({}); // empty body

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Please provide a date (YYYY-MM-DD) for report generation');
    });
  });

  describe('GET /api/reports', () => {
    it('should return list of aggregated historical reports', async () => {
      const mockReportsList = [
        { date: '2026-06-28', totalTime: 3600, productivityScore: 80 }
      ];

      Report.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockReportsList)
      });

      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].productivityScore).toBe(80);
    });
  });
});
