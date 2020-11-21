const responsesUtils = require('../utils/responseUtils');
const products = require('../products.json');

/**
 * Send all products as JSON
 *
 * @param {http.ServerResponse} response
 */
const getAllProducts = async response => {
  // TODO: 10.1 Implement this
  responsesUtils.sendJson(response, products);
};

module.exports = { getAllProducts };
