const responseUtils = require('./utils/responseUtils');
const { acceptsJson, isJson, parseBodyJson } = require('./utils/requestUtils');
const { renderPublic } = require('./utils/render');
const { emailInUse, getAllUsers, saveNewUser, validateUser, getUserById } = require('./utils/users');
const { getCurrentUser } = require('./auth/auth');
const { basicAuthChallenge, sendJson } = require('./utils/responseUtils');
const auth = require('./auth/auth');
//const users = require('./utils/users');
const User = require("./models/user");
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

      //get logged in user
      const currUser = await getCurrentUser(request);
      //console.log(currUser.role);

      // user found
      if (currUser === null || typeof currUser === 'undefined') {
          
          return basicAuthChallenge(response);
      }

      else if (currUser.role === 'customer') {
          responseUtils.forbidden(response);
      }
      else if (currUser.role === 'admin') {
          //find user to be updated
          const user = await User.findById(request.url.split('/')[3]).exec();
          if (user !== null) {

              //send the user data
              if (request.method === 'GET') {
                  responseUtils.sendJson(response, user);
              }

              //update the user data
              else if (request.method === 'PUT') {
                  //console.log(currUser.role);
                  const body = await parseBodyJson(request);
                  const role = body.role;
                  if (typeof role === 'undefined' || (role !== 'admin' && role !== 'customer')) {
                      responseUtils.badRequest(response);
                  }
                  else {
                      user.role = role;
                      await user.save();
                      responseUtils.sendJson(response, user);
                  }
              }
              //delete user data
              else if (request.method === 'DELETE') {
                  const deletedUser = await User.findOneAndDelete({ _id: user._id}).exec();
                  responseUtils.sendJson(response, deletedUser);
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
          const users = await User.find({});
          return responseUtils.sendJson(response, users);

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
      if (!isJson(request)) {
          return responseUtils.badRequest(response, 'Invalid Content-Type. Expected application/json');
      }
      //get new user from request
      const user = await (parseBodyJson(request));
      const newUser = new User(user);
      // attempt to register new user (save the document)
      // all newly registered users should be customers
      const emailUser = await User.findOne({ email: newUser.email }).exec();
      if (emailUser !== null) {
          return responseUtils.badRequest(response, '400 Bad Request');
      }
      try {
          newUser.role = "customer";
          const registereduser = await newUser.save();
          return responseUtils.createdResource(response, registereduser);
          // error in registering user
      }
      catch (error) {
          return responseUtils.badRequest(response, '400 Bad Request');
      }
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
