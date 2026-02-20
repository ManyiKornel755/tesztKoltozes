require('dotenv').config();

const jwtConfig = {
  secret: process.env.JWT_SECRET || 'default_secret_key_change_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
};

module.exports = jwtConfig;
