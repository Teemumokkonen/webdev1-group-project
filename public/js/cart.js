
/**
 * Renders all the items in the sessionStorage shopping cart
 */
const listAllCartItems = () => {
    const template = document.querySelector('#cart-item-template');
    const cartContainer = document.querySelector('#cart-container');
    cartContainer.innerHTML = '';

    const cart = getAllProductsFromCart();
    if (cart !== null) {
        cart.forEach(item => { 
            const clone = template.content.cloneNode(true);
    
            // Select elements
            const name = clone.querySelector('h3');
            const price = clone.querySelector('p.product-price');
            const amount = clone.querySelector('p.product-amount');
            const buttonPlus = clone.querySelector('.cart-plus-plus-button');
            const buttonMinus = clone.querySelector('.cart-minus-plus-button');
    
            // Edit text content
            name.textContent = item.name;
            price.textContent = item.price;
            amount.textContent = item.amount + 'x';
    
            // Add id attributes
            const id = item._id;
            name.id = `name-${id}`;
            price.id = `price-${id}`;
            amount.id = `amount-${id}`;
            buttonPlus.id = `plus-${id}`;
            buttonMinus.id = `minus-${id}`;

            // Add eventlisters for buttons
            buttonPlus.addEventListener('click', (e) => {
                increaseProductCount(item._id);
            });
            buttonMinus.addEventListener('click', (e) => {
                decreaseProductCount(item._id);
            })
    
            cartContainer.appendChild(clone);
        });
    }
}


/**
 * Increses the amount of product in the session storage shopping cart.
 * 
 * SessionStorage['cart'] is dictonary where 'key' is a product._id
 * and 'value' is product.
 * 
 * Lastly update UI
 * 
 * @param {String} productId 
 */
const increaseProductCount = (productId) => {
    // Update amount in 
    const cart = getAllProductsFromCart();
    const product = cart.find(product => product._id === productId)
    product.amount += 1;
    
    const amount = document.querySelector(`#amount-${productId}`);
    amount.textContent = product.amount + 'x';
    
    sessionStorage.setItem('cart', JSON.stringify(cart));
}

/**
 * Decreases the amount of product in the session storage shopping cart.
 * 
 * SessionStorage['cart'] is dictonary where 'key' is a product._id
 * and 'value' is product.
 * 
 * Lastly update UI
 * 
 * @param {String} productId 
 */
const decreaseProductCount = (productId) => {
    const cart = getAllProductsFromCart();
    const index = cart.findIndex(product => product._id === productId);
    const product = cart[index];
    product.amount -= 1;
    if (product.amount === 0) {
        cart.splice(index, 1);
        const container = document.querySelector(`#amount-${productId}`).parentElement;
        const parent = container.parentElement;
        parent.removeChild(container);
    }
    else {
        const amount = document.querySelector(`#amount-${productId}`);
        amount.textContent = product.amount + 'x';
    }
    sessionStorage.setItem('cart', JSON.stringify(cart));
}


/**
 * Retunrs shopping cart as array
 * 
 * @returns {Array} Dictonary: keys are product ids, and values are products
 */
const getAllProductsFromCart = () => {
    return JSON.parse(sessionStorage.getItem('cart'));
}

/**
 * Clears the SessionStorage shopping cart
 */
const clearCart = () => {
    sessionStorage.removeItem('cart');
}

// Adds evetlistener for the send order button.
document.querySelector('#place-order-button').addEventListener('click', (e) => {
    createNotification('Successfully created an order!', 'notifications-container', true);
    clearCart();
    listAllCartItems();
})

window.onload = listAllCartItems;