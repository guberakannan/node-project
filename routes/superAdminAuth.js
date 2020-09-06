const jwt = require('express-jwt');

const getTokenFromHeaders = (req) => {
  const { headers: { authorization } } = req;

  if(authorization && authorization.split(' ')[0] === 'Token') {
    return authorization.split(' ')[1];
  }
  return null;
};

const auth = {
  required: jwt({
    secret: 'VS7LYaW9L#54mDXz',
    userProperty: 'superadmin',
    getToken: getTokenFromHeaders,
  }),
  optional: jwt({
    secret: 'VS7LYaW9L#54mDXz',
    userProperty: 'superadmin',
    getToken: getTokenFromHeaders,
    credentialsRequired: false,
  }),
};

module.exports = auth;