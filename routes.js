const responseUtils = require('./utils/responseUtils');
const { acceptsJson, isJson, parseBodyJson } = require('./utils/requestUtils');
const { renderPublic } = require('./utils/render');
const { emailInUse, getAllUsers, saveNewUser, validateUser, getUserById } = require('./utils/users');
const { getCurrentUser } = require('./auth/auth');
const { basicAuthChallenge, sendJson } = require('./utils/responseUtils');
const auth = require('./auth/auth');
const render = require('./utils/render');
const users = require('./utils/users');
const products = require('./products.json');


/**
 * Known API routes and their allowed methods
 *
 * Used to check allowed methods and also to send correct header value
 * in response to an OPTIONS request by sendOptions() (Access-Control-Allow-Methods)
 */
const allowedMethods = {
  '/api/register': ['POST'],
  '/api/users': ['GET'],
  '/api/products': ['GET']
};

/**
 * Send response to client options request.
 *
 * @param {string} filePath pathname of the request URL
 * @param {http.ServerResponse} response
 */
const sendOptions = (filePath, response) => {
  if (filePath in allowedMethods) {
    response.writeHead(204, {
      'Access-Control-Allow-Methods': allowedMethods[filePath].join(','),
      'Access-Control-Allow-Headers': 'Content-Type,Accept',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Expose-Headers': 'Content-Type,Accept'
    });
    return response.end();
  }

  return responseUtils.notFound(response);
};

/**
 * Does the url have an ID component as its last part? (e.g. /api/users/dsf7844e)
 *
 * @param {string} url filePath
 * @param {string} prefix
 * @returns {boolean}
 */
const matchIdRoute = (url, prefix) => {
  const idPattern = '[0-9a-z]{8,24}';
  const regex = new RegExp(`^(/api)?/${prefix}/${idPattern}$`);
  return regex.test(url);
};

/**
 * Does the URL match /api/users/{id}
 *
 * @param {string} url filePath
 * @returns {boolean}
 */
const matchUserId = url => {
  return matchIdRoute(url, 'users');
};

const handleRequest = async (request, response) => {
  const { url, method, headers } = request;
  const filePath = new URL(url, `http://${headers.host}`).pathname;

  // serve static files from public/ and return immediately
  if (method.toUpperCase() === 'GET' && !filePath.startsWith('/api')) {
    const fileName = filePath === '/' || filePath === '' ? 'index.html' : filePath;
    return renderPublic(fileName, response);
  }

  if (matchUserId(filePath)) {
    // TODO: 8.5 Implement view, update and delete a single user by ID (GET, PUT, DELETE)
    // You can use parseBodyJson(request) from utils/requestUtils.js to parse request body
    // throw new Error('Not Implemented');
      const currUser = await auth.getCurrentUser(request);
      if (currUser === null || typeof currUser === 'undefined') {
          return basicAuthChallenge(response);
      }

      else if (currUser.role === 'customer') {
          responseUtils.forbidden(response);
      }
      else if (currUser.role === 'admin') {
          const user = getUserById(request.url.split('/')[3]);
          if (typeof user !== 'undefined') {

              if (request.method === 'GET') {
                  responseUtils.sendJson(response, user);
              }

              else if (request.method === 'PUT') {
                  //console.log(currUser.role);
                  const body = await parseBodyJson(request);
                  const role = body.role;
                  if (typeof role === 'undefined' || (role !== 'admin' && role !== 'customer')) {
                      responseUtils.badRequest(response);
                  }
                  else {
                      responseUtils.sendJson(response, users.updateUserRole(request.url.split('/')[3], role));
                  }
              }
              else if (request.method === 'DELETE') {
                  
                  responseUtils.sendJson(response, users.deleteUserById(request.url.split('/')[3]));
              }
          }
          else {
              responseUtils.notFound(response);
          }
      }
  }

  // Default to 404 Not Found if unknown url
  if (!(filePath in allowedMethods)) return responseUtils.notFound(response);

  // See: http://restcookbook.com/HTTP%20Methods/options/
  if (method.toUpperCase() === 'OPTIONS') return sendOptions(filePath, response);

  // Check for allowable methods
  if (!allowedMethods[filePath].includes(method.toUpperCase())) {
    return responseUtils.methodNotAllowed(response);
  }

  // Require a correct accept header (require 'application/json' or '*/*')
  if (!acceptsJson(request)) {
    return responseUtils.contentTypeNotAcceptable(response);
  }

  // GET all users
  if (filePath === '/api/users' && method.toUpperCase() === 'GET') {
    // TODO: 8.3 Return all users as JSON
      // TODO: 8.4 Add authentication (only allowed to users with role "admin")
      const user = await auth.getCurrentUser(request);
      if (user === null) {
          return basicAuthChallenge(response);
      }

      else if (typeof user === 'undefined') {
          return basicAuthChallenge(response);
      }

      else if (user.role === 'customer') {
          responseUtils.forbidden(response);
      }
      else {

          return responseUtils.sendJson(response, getAllUsers());

      }
  }

  // register new user
  if (filePath === '/api/register' && method.toUpperCase() === 'POST') {
    // Fail if not a JSON request
    if (!isJson(request)) {
      return responseUtils.badRequest(response, 'Invalid Content-Type. Expected application/json');
    }

    // TODO: 8.3 Implement registration
    // You can use parseBodyJson(request) from utils/requestUtils.js to parse request body
    parseBodyJson(request)
    .then(json => {
      const errs = validateUser(json);
      if ( errs.length === 0 ) {
        if (emailInUse(json.email)) {
          return responseUtils.badRequest(response, 'Email already in use');
        } 
        else {
          return responseUtils.createdResource(response, saveNewUser(json) );
        }
      }
      else {
        return responseUtils.badRequest(response, errs.join('\n'));
      }
    })
    .catch(err => console.log(err));
  }

  // Get products
  if (filePath === '/api/products' && method.toUpperCase() === 'GET') {
    // authenticate user. Allowed roles 'admin' and 'customer'
    const user = await auth.getCurrentUser(request);
    if (user === null || typeof user === 'undefined') {
      return basicAuthChallenge(response);
    }

    else if (user.role === 'customer' || user.role === 'admin') {
      return sendJson(response, products);
    }
  }
};

module.exports = { handleRequest };
