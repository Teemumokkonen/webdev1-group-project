const responseUtils = require('../utils/responseUtils');
const User = require("../models/user");

/**
 * Send all users as JSON
 *
 * @param {http.ServerResponse} response 
 */
const getAllUsers = async (response) => {
  // TODO: 10.1 Implement this
 
  const users = await User.find({});
  return responseUtils.sendJson(response, users);
};

/**
 * Delete user and send deleted user as JSON
 *
 * @param {http.ServerResponse} response
 * @param {string} userId
 * @param {Object} currentUser 
 */
const deleteUser = async (response, userId, currentUser) => {
  // TODO: 10.1 Implement this
 
  if (currentUser.id === userId) {
    return responseUtils.badRequest(response, 'Deleting own data is not allowed');
  }

  const user = await User.findById(userId).exec();
  if (user !== null) {
    const deletedUser = await User.findOneAndDelete({ _id: user._id}).exec();
    return responseUtils.sendJson(response, deletedUser);
  }
  else {
    return responseUtils.notFound(response);
  }
};

/**
 * Update user and send updated user as JSON
 *
 * @param {http.ServerResponse} response
 * @param {string} userId
 * @param {Object} currentUser (mongoose document object)
 * @param {Object} userData JSON data from request body
 */
const updateUser = async (response, userId, currentUser, userData) => {
  // TODO: 10.1 Implement this

  // User cant change their own role
  if (currentUser.id === userId) {
    return responseUtils.badRequest(response, 'Updating own data is not allowed');
  }

  // user not found
  const user = await User.findById(userId).exec();
  if (user === null) {
    return responseUtils.notFound(response);
  }
  
  const role = userData.role;
  if (typeof role === 'undefined' || (role !== 'admin' && role !== 'customer')) {
    return responseUtils.badRequest(response);
  }
  else {
    user.role = role;
    await user.save();
    return responseUtils.sendJson(response, user);
  }
  
};

/**
 * Send user data as JSON
 *
 * @param {http.ServerResponse} response
 * @param {string} userId
 * @param {Object} currentUser (mongoose document object)
 */
const viewUser = async (response, userId, currentUser) => {
  // TODO: 10.1 Implement this
  const user = await User.findById(userId).exec();
  if (user !== null) {
    responseUtils.sendJson(response, user);
  }
  else {
    responseUtils.notFound(response);
  }
};

/**
 * Register new user and send created user back as JSON
 *
 * @param {http.ServerResponse} response
 * @param {Object} userData JSON data from request body
 */
const registerUser = async (response, userData) => {
  // attempt to register new user (save the document)
  // all newly registered users should be customers
  const newUser = new User(userData);
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

};

module.exports = { getAllUsers, registerUser, deleteUser, viewUser, updateUser };
