const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  const errors = err.errors || [];
  res.status(status).json({ success: false, message, errors });
};

module.exports = { errorHandler };
