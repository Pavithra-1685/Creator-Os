const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
   console.error(err); // <-- temporary for debugging

  logger.error(err.stack || err.message || JSON.stringify(err));
  
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
