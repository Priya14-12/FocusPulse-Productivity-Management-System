// validationMiddleware.js - Express Validator Helper
const { validationResult } = require('express-validator');

const validateFields = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => `${err.path || err.param}: ${err.msg}`)
    });
  }
  next();
};

module.exports = { validateFields };
