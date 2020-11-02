const API_REGISTER = '/api/register';

const ERROR_PASSWORDS_DONT_MATCH = 'Password and confirmation password dont match.';
const SUCCESS_REGISTER = 'Registered succesfully.';


/**
 * TODO: 8.3 Register new user
 *       - Handle registration form submission
 *       - Prevent registration when password and passwordConfirmation do not match
 *       - Use createNotification() function from utils.js to show user messages of
 *       - error conditions and successful registration
 *       - Reset the form back to empty after successful registration
 *       - Use postOrPutJSON() function from utils.js to send your data back to server
 */
const registerUser = (e) => {
    e.preventDefault();

    const registerForm = document.querySelector('#register-form');
    const formData = getFormDataAsJson(registerForm);

    if (formData.password !== formData.passwordConfirmation) {
        createNotification(ERROR_PASSWORDS_DONT_MATCH, 'notifications-container', false);
    }
    else {
        postOrPutJSON(API_REGISTER, 'POST', formData)
            .then(userJson => {
                registerForm.reset();
                createNotification(SUCCESS_REGISTER, 'notifications-container', true);
            })
            .catch(err => console.log(err));
    }
};

/** Gets the form input data, and returns the data back as JSON.
 * 
 * @param {Element} form form 
 * @return {Object} data from the from as JSON.
 */
const getFormDataAsJson = (form) => {
    const data = {};
    const inputs = form.querySelectorAll('input');
    inputs.forEach(inp => {
        data[inp.name] = inp.value;
    });
    return data;
};

document.querySelector('#register-form').onsubmit = registerUser;