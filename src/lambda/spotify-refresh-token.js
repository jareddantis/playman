const queryString = require('querystring');
const axios = require('axios');

export function handler(event, context, callback) {
  // Allow POST requests only
  if (event.httpMethod !== 'POST') {
    return callback(null, {
      statusCode: 405,
      body: '{"error": "Not allowed"}'
    })
  }

  const { refresh_token } = queryString.parse(event.body);
  const { SPID, SPSC } = process.env;
  const AUTH_TOKEN = Buffer.from(`${SPID}:${SPSC}`).toString('base64');
  const AUTH_DATA = {
    grant_type: 'refresh_token',
    refresh_token
  };
  const pass = (body) => {
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(body)
    })
  };

  // Request new auth code
  axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: queryString.stringify(AUTH_DATA),
    headers: {
      'Authorization': `Basic ${AUTH_TOKEN}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then((response) => pass(response.data))
    .catch((err) => pass(err))
}
