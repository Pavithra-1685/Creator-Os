const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err);
  
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  if (err.name === 'ZodError') {
    status = 400;
    message = 'Validation failed';
    errors = err.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
  }

  res.status(status).json({ success: false, message, errors });
};

module.exports = { errorHandler };
