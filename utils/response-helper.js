// utils/response-helper.js

const successResponse = (data, statusCode = 200) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token'
    },
    body: JSON.stringify(data)
  };
};

const errorResponse = (message, statusCode = 500, details = null) => {
  const response = {
    error: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (details) {
    response.details = details;
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token'
    },
    body: JSON.stringify(response)
  };
};

module.exports = {
  successResponse,
  errorResponse
};