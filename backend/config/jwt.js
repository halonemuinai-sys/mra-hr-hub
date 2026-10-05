/**
 * JWT settings. There is deliberately no fallback secret: a default value in the
 * source would let anyone forge login tokens if JWT_SECRET is missing on a server.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET is missing or shorter than 32 characters. Set it in backend/.env before starting the server.');
}

module.exports = { JWT_SECRET, JWT_EXPIRES_IN: '7d' };
