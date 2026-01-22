// Date formatting
exports.formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Generate random string
exports.generateRandomString = (length = 32) => {
  return require('crypto').randomBytes(length).toString('hex');
};

// Sanitize user input
exports.sanitizeInput = (input) => {
  return input.trim().replace(/[<>]/g, '');
};

// Calculate pagination
exports.getPagination = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit: parseInt(limit) };
};