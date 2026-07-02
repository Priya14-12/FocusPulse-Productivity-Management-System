// reportController.js - Reports Handlers
const Report = require('../models/Report');
const Activity = require('../models/Activity');
const FocusSession = require('../models/FocusSession');
const Setting = require('../models/Setting');
const BlockedSite = require('../models/BlockedSite');

// @desc    Generate report for a specific date
// @route   POST /api/reports/generate
// @access  Private
const generateReport = async (req, res, next) => {
  const { date } = req.body; // format 'YYYY-MM-DD'
  const userId = req.user._id;

  if (!date) {
    res.status(400);
    return next(new Error('Please provide a date (YYYY-MM-DD) for report generation'));
  }

  try {
    // Set up range for date
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    // 1. Gather all activities on this day
    const activities = await Activity.find({
      userId,
      startTime: { $gte: startOfDay, $lte: endOfDay }
    });

    let totalTime = 0;
    let productiveTime = 0;
    let neutralTime = 0;
    let distractingTime = 0;
    const domainMap = {};

    activities.forEach(act => {
      const dur = act.duration;
      totalTime += dur;
      if (act.category === 'productive') productiveTime += dur;
      else if (act.category === 'neutral') neutralTime += dur;
      else if (act.category === 'distracting') distractingTime += dur;

      domainMap[act.domain] = (domainMap[act.domain] || 0) + dur;
    });

    // Find most visited website
    let mostVisitedSite = '';
    let maxDur = 0;
    for (const [domain, dur] of Object.entries(domainMap)) {
      if (dur > maxDur) {
        maxDur = dur;
        mostVisitedSite = domain;
      }
    }

    // 2. Fetch focus sessions on this day
    const focusSessions = await FocusSession.find({
      userId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      completed: true
    });
    const focusSessionsCount = focusSessions.length;

    // 3. Fetch user settings for goals comparison
    let settings = await Setting.findOne({ userId });
    if (!settings) {
      settings = await Setting.create({ userId });
    }

    // 4. Check daily goal completions
    const productiveGoalMet = productiveTime >= settings.dailyGoalProductive;
    const distractingGoalMet = distractingTime <= settings.dailyGoalDistracting;
    const focusSessionsGoalMet = focusSessionsCount >= settings.dailyGoalFocusSessions;

    // Goals met count
    let goalsMetCount = 0;
    if (productiveGoalMet) goalsMetCount++;
    if (distractingGoalMet) goalsMetCount++;
    if (focusSessionsGoalMet) goalsMetCount++;

    // Calculate Productivity Score (0 - 100)
    // Formula: 
    // - Ratio score (up to 70 pts): (Productive / (Productive + Distracting + 1)) * 70
    // - Focus Session score (up to 20 pts): min(focusSessionsCount, 2) * 10
    // - Goals met score (up to 10 pts): (goalsMetCount / 3) * 10
    const ratioDenominator = productiveTime + distractingTime;
    const ratioScore = ratioDenominator > 0 
      ? (productiveTime / ratioDenominator) * 70
      : (productiveTime > 0 ? 70 : 35); // Default to 35 if no tracked productive/distracting time

    const focusScore = Math.min(focusSessionsCount, 2) * 10;
    const goalsScore = (goalsMetCount / 3) * 10;

    let productivityScore = Math.round(ratioScore + focusScore + goalsScore);
    productivityScore = Math.max(0, Math.min(100, productivityScore));

    // 5. Fetch existing blocked attempts count for today's report
    // In order to preserve the attempts count during recalculations:
    const existingReport = await Report.findOne({ userId, date });
    const blockedAttemptsCount = existingReport ? existingReport.blockedAttemptsCount : 0;

    // 6. Update or Create the daily report
    const report = await Report.findOneAndUpdate(
      { userId, date },
      {
        totalTime,
        productiveTime,
        neutralTime,
        distractingTime,
        mostVisitedSite,
        productivityScore,
        focusSessionsCount,
        blockedAttemptsCount
      },
      { new: true, upsert: true }
    );

    res.json(report);
  } catch (error) {
    next(error);
  }
};

// @desc    Get reports history
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res, next) => {
  const { startDate, endDate, search } = req.query;

  try {
    const query = { userId: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    let reports = await Report.find(query).sort({ date: -1 });

    // Filter by mostVisitedSite search keyword if provided
    if (search) {
      const searchLower = search.toLowerCase();
      reports = reports.filter(r => r.mostVisitedSite && r.mostVisitedSite.toLowerCase().includes(searchLower));
    }

    res.json(reports);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateReport,
  getReports
};
