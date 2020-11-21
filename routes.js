const responseUtils = require('./utils/responseUtils');
const { acceptsJson, isJson, parseBodyJson } = require('./utils/requestUtils');
const { renderPublic } = require('./utils/render');
const auth = require('./auth/auth');
const User = require("./models/user");
const usersController = require('./controllers/users');
const productController = require('./controllers/products');


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

  // FilePath matches '/api/users/{id}', 
  if (matchUserId(filePath)) {
    // TODO: 8.5 Implement view, update and delete a single user by ID (GET, PUT, DELETE)

    //get logged in user
    const currUser = await auth.getCurrentUser(request);

    // user not found
    if (currUser === null || typeof currUser === 'undefined') {
      return responseUtils.basicAuthChallenge(response);
    }

    else if (currUser.role === 'customer') {
      responseUtils.forbidden(response);
    }

    else if (currUser.role === 'admin') {
      //find user to be updated
      const userId = request.url.split('/')[3];
      const user = await User.findById(userId).exec();

      //send the user data
      if (method.toUpperCase() === 'GET') {
        await usersController.viewUser(response, userId, currUser);
      }

      //update the user data
      else if (method.toUpperCase() === 'PUT') {
          const userData = await parseBodyJson(request);
          await usersController.updateUser(response, userId, currUser, userData);
      }

      //delete user data
      else if (method.toUpperCase() === 'DELETE') {
          await usersController.deleteUser(response, userId, currUser);
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
    const currentUser = await auth.getCurrentUser(request);
    const users = await User.find({});
    if (currentUser === null) {
      return responseUtils.basicAuthChallenge(response);
    }

    else if (typeof currentUser === 'undefined') {
      return responseUtils.basicAuthChallenge(response);
    }

    else if (currentUser.role === 'customer') {
      responseUtils.forbidden(response);
    }
    else {
      usersController.getAllUsers(response, currentUser);
    }
  }

  // register new user
  if (filePath === '/api/register' && method.toUpperCase() === 'POST') {
    // Fail if not a JSON request
    if (!isJson(request)) {
      return responseUtils.badRequest(response, 'Invalid Content-Type. Expected application/json');
    }

    //get new user from request
    const user = await (parseBodyJson(request));
    const newUser = new User(user);
    // attempt to register new user
    usersController.registerUser(response, newUser);
  }

  // Get products
  if (filePath === '/api/products' && method.toUpperCase() === 'GET') {
    // authenticate user. Allowed roles 'admin' and 'customer'
    const user = await auth.getCurrentUser(request);
    if (user === null || typeof user === 'undefined') {
      return responseUtils.basicAuthChallenge(response);
    }

    else if (user.role === 'customer' || user.role === 'admin') {
      productController.getAllProducts(response);
    }
  }
};

module.exports = { handleRequest };
