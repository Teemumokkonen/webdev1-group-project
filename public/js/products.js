const API_PRODUCTS = '/api/products';


/**
 * Lists all products using <template id='products-template'> in products.html
 * 
 * Adds following ids for the elements.
 *      name-${id} for the h3
 *      description-${id} for the p with class of product-description
 *      price-${id} for the p with class of product-price
 *      add-to-cart-${id} for the Add to cart button
 */
const listAllProducts = () => {
    const productsContainer = document.querySelector('#products-container');
    const template = document.querySelector('#product-template');

    // clear products container
    productsContainer.innerHTML = '';

    // Render products
    getJSON(API_PRODUCTS)
    .then(json => { json.forEach( product => {
        const clone = template.content.cloneNode(true);
        
        // select fields
        const name = clone.querySelector('h3.product-name');
        const description = clone.querySelector('p.product-description');
        const price = clone.querySelector('p.product-price');
        const buttonAdd = clone.querySelector('button');

        // Edit text content
        name.textContent = product['name'];
        description.textContent = product['description'];
        price.textContent = product['price'];

        // Add id attributes
        const id = product['_id'];
        name.id = `name-${id}`;
        description.id = `description-${id}`;
        price.id = `price-${id}`;
        buttonAdd.id = `add-to-cart-${id}`;
        //clone.querySelector('div.item-row').id = product['_id'];

        // Add event lister to the button
        buttonAdd.addEventListener('click', () => {
            addProductToCart(product);
        });

        productsContainer.appendChild(clone);
    })}).catch(err => console.log(err));
    
}

/**
 * Adds the product to sessionStorage shopping cart.
 * Removes the description attribute from the product object.
 * 
 * If product is already in the cart increases the product.amount.
 * Else adds {product._id, product} key value pair to the cart. 
 * 
 * @param {Object} product 
 */
const addProductToCart = (product) => {
    delete product.description;
    const id = product._id;
    // If there is no cart object create a cart and adds product to the cart.
    if(!sessionStorage.getItem('cart')) {
        product.amount = 1;
        cart = [product];

        createNotification(`Added ${product.name} to cart!`, 
                           'notifications-container', true);
        sessionStorage.setItem('cart', JSON.stringify(cart));
    }
    else  {
        const cart = JSON.parse(sessionStorage.getItem('cart'));
        cartItem = cart.find(product => product._id === id);
        if (typeof cartItem === 'undefined') {
            product.amount = 1;
            cart.push( product );
        } else {
            cartItem.amount += 1;
        }
        createNotification(`Added ${product.name} to cart!`, 
                           'notifications-container', true);
        sessionStorage.setItem('cart', JSON.stringify(cart));
    }

    //console.log(JSON.parse(sessionStorage.getItem('cart')));
}

window.onload = listAllProducts;