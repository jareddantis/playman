const axios = require('axios');

export function handler(event, context, callback) {
  const { method, access_token, endpoint } = event.queryStringParameters;
  const { API_URL } = process.env;
  const pass = (body) => {
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(body)
    })
  };

  // Build request data
  let AxiosConfig = {
    method,
    url: `${API_URL}/${endpoint}`,
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  };
  if (method === 'post' || method === 'put') {
    data.data = event.queryStringParameters.data;
  }

  // Call Spotify API
  axios(AxiosConfig)
    .then((response) => pass(response.data))
    .catch((err) => pass(err))
}
