// blockedController.js - Blocked Websites Handlers
const BlockedSite = require('../models/BlockedSite');
const Report = require('../models/Report');

// @desc    Get user's blocked websites
// @route   GET /api/blocked-sites
// @access  Private
const getBlockedSites = async (req, res, next) => {
  try {
    const sites = await BlockedSite.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(sites);
  } catch (error) {
    next(error);
  }
};

// @desc    Add a blocked website
// @route   POST /api/blocked-sites
// @access  Private
const addBlockedSite = async (req, res, next) => {
  const { domain } = req.body;

  if (!domain) {
    res.status(400);
    return next(new Error('Please provide a domain to block'));
  }

  // Normalize domain (lowercase, trim, remove protocol/path if any)
  let normalizedDomain = domain.toLowerCase().trim();
  try {
    // If user passed a full URL, parse it
    if (normalizedDomain.includes('://')) {
      normalizedDomain = new URL(normalizedDomain).hostname;
    } else if (!normalizedDomain.startsWith('http')) {
      // Temp add prefix to use URL parser
      normalizedDomain = new URL('http://' + normalizedDomain).hostname;
    }
  } catch (e) {
    // Fallback to regex or original input
    normalizedDomain = normalizedDomain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  }

  try {
    // Check if already blocked
    const existing = await BlockedSite.findOne({
      userId: req.user._id,
      domain: normalizedDomain
    });

    if (existing) {
      return res.status(200).json(existing); // Return existing instead of throwing error
    }

    const blockedSite = await BlockedSite.create({
      userId: req.user._id,
      domain: normalizedDomain
    });

    res.status(201).json(blockedSite);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a blocked website
// @route   DELETE /api/blocked-sites/:id
// @access  Private
const removeBlockedSite = async (req, res, next) => {
  const { id } = req.params;

  try {
    const blockedSite = await BlockedSite.findOne({ _id: id, userId: req.user._id });

    if (!blockedSite) {
      res.status(404);
      throw new Error('Blocked website not found or unauthorized');
    }

    await blockedSite.deleteOne();
    res.json({ message: 'Website removed from block list', id });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a blocked attempt
// @route   POST /api/blocked-sites/attempt
// @access  Private
const recordBlockedAttempt = async (req, res, next) => {
  const { domain } = req.body;

  if (!domain) {
    res.status(400);
    return next(new Error('Domain is required'));
  }

  let normalizedDomain = domain.toLowerCase().trim();
  normalizedDomain = normalizedDomain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

  try {
    // Find the blocked site or upsert it
    const site = await BlockedSite.findOneAndUpdate(
      { userId: req.user._id, domain: normalizedDomain },
      { $inc: { blockedAttempts: 1 } },
      { new: true, upsert: true } // If not blocked yet but accessed, track attempt
    );

    // Increment today's report count
    const todayStr = new Date().toISOString().split('T')[0];
    await Report.findOneAndUpdate(
      { userId: req.user._id, date: todayStr },
      { $inc: { blockedAttemptsCount: 1 } },
      { upsert: true }
    );

    res.json({ message: 'Blocked attempt tracked', site });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBlockedSites,
  addBlockedSite,
  removeBlockedSite,
  recordBlockedAttempt
};
