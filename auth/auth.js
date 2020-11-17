const { getCredentials } = require("../utils/requestUtils");
//const { getUser } = require("../utils/users");
const User = require("../models/user");

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
    
    const userData = getCredentials(request);
    if (userData === null){
        return null;
    }

    //const user = getUser(userData[0], userData[1]);

    const user = await User.findOne({ email: userData[0] }).exec();

    if (user === null) {
        return null;
    } else {
        if (await user.checkPassword(userData[1])) {
            return user;
        } else {
            return null;
        }
    }

    //throw new Error('Not Implemented');
};

module.exports = { getCurrentUser };
