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
    secret: 'Kq[=7g3QKfDTEpr',
    userProperty: 'user',
    getToken: getTokenFromHeaders,
  }),
  optional: jwt({
    secret: 'Kq[=7g3QKfDTEpr',
    userProperty: 'user',
    getToken: getTokenFromHeaders,
    credentialsRequired: false,
  }),
};

module.exports = auth;