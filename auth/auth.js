const { getCredentials } = require("../utils/requestUtils");
const { getUser } = require("../utils/users");

/**
 * Get current user based on the request headers
 *
 * @param {http.IncomingMessage} request
 * @returns {Object|null} current authenticated user or null if not yet authenticated
 */
const getCurrentUser = async request => {
  // TODO: 8.4 Implement getting current user based on the "Authorization" request header

  // NOTE: You can use getCredentials(request) function from utils/requestUtils.js
  // and getUser(email, password) function from utils/users.js to get the currently
    // logged in user
    
    var userData = getCredentials(request);
    if (userData === null){
        return userData;
    }
    var user = getUser(userData[0], userData[1]);

    return user;

    

    //throw new Error('Not Implemented');
};

module.exports = { getCurrentUser };
