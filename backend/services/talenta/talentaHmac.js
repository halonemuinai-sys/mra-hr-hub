/**
 * HMAC request signing for the Mekari API (port of the Postman pre-request script in the
 * Talenta Data API docs):
 *   signature = base64( HMAC-SHA256( "date: <RFC 1123 date>\n<METHOD> <path?query> HTTP/1.1", secret ) )
 *   Authorization: hmac username="…", algorithm="hmac-sha256", headers="date request-line", signature="…"
 */
const crypto = require('crypto');

function signRequest({ method, path, username, secret, date = new Date().toUTCString() }) {
  const requestLine = `${method.toUpperCase()} ${path} HTTP/1.1`;
  const signature = crypto.createHmac('sha256', secret).update(`date: ${date}\n${requestLine}`).digest('base64');
  return {
    Authorization: `hmac username="${username}", algorithm="hmac-sha256", headers="date request-line", signature="${signature}"`,
    Date: date
  };
}

module.exports = { signRequest };
