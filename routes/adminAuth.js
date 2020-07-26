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
    secret: '_d3y%~PM.Y)jq?J',
    userProperty: 'admin',
    getToken: getTokenFromHeaders,
  }),
  optional: jwt({
    secret: '_d3y%~PM.Y)jq?J',
    userProperty: 'admin',
    getToken: getTokenFromHeaders,
    credentialsRequired: false,
  }),
};

module.exports = auth;