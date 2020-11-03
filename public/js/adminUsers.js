
const API_USERS = '/api/users';
const theParent = document.getElementById('users-container');
const formloc = document.getElementById('modify-user');

/**
 * TODO: 8.3 List all users (use <template id="user-template"> in users.html)
 *       - Each user should be put inside a clone of the template fragment
 *       - Each individual user HTML should look like this
 *         (notice the id attributes and values, replace "{userId}" with the actual user id)
 *
 *         <div class="item-row" id="user-{userId}">
 *           <h3 class="user-name" id="name-{userId}">Admin</h3>
 *           <p class="user-email" id="email-{userId}">admin@email.com</p>
 *           <p class="user-role" id="role-{userId}">admin</p>
 *           <button class="modify-button" id="modify-{userId}">Modify</button>
 *           <button class="delete-button" id="delete-{userId}">Delete</button>
 *         </div>
 *
 *       - Each cloned template fragment should be appended to <div id="users-container">
 *       - Use getJSON() function from utils.js to fetch user data from server
 */
const listAllUsers = () => {
    const usersContainer = document.querySelector('#users-container');
    const template = document.querySelector('#user-template');

    usersContainer.innerHTML = '';
    getJSON(API_USERS)
        .then(users => users.forEach(user => {
            const clone = template.content.cloneNode(true);

            // select elements
            const name = clone.querySelector('h3');
            const email = clone.querySelector('p.user-email');
            const role = clone.querySelector('p.user-role');

            // Edit text content
            name.textContent = user['name'];
            email.textContent = user['email'];
            role.textContent = user['role'];

            // Add id attributes
            clone.querySelector('div.item-row').id = `user-${user['_id']}`;
            clone.querySelector('.modify-button').id = `modify-${user['_id']}`;
            clone.querySelector('.delete-button').id = `delete-${user['_id']}`;
            name.id = `name-${user['_id']}`;
            email.id = `email-${user['_id']}`;
            role.id = `role-${user['_id']}`;

            usersContainer.appendChild(clone);
        }))
        .catch(err => console.log(err));
};
/**
 * TODO: 8.5 Updating/modifying and deleting existing users
 *       - Use postOrPutJSON() function from utils.js to send your data back to server
 *       - Use deleteResource() function from utils.js to delete user from servers
 *       - Clicking "Delete" button of a user will delete the user and update the listing accordingly
 *       - Clicking "Modify" button of a user will use <template id="form-template"> to
 *         show an editing form populated with the values of the selected user
 *       - The edit form should appear inside <div id="modify-user">
 *       - Afted successful edit of user the form should be removed and the listing updated accordingly
 *       - You can use removeElement() from utils.js to remove the form.
 *       - Remove edit form from the DOM after successful edit or replace it with a new form when another
 *         user's "Modify" button is clicked. There should never be more than one form visible at any time.
 *         (Notice that the edit form has an id "edit-user-form" which should be unique in the DOM at all times.)
 *       - Also remove the edit form when a user is deleted regardless of which user is deleted.
 *       - Modifying a user successfully should show a notification message "Updated user {User Name}"
 *       - Deleting a user successfully should show a notification message "Deleted user {User Name}"
 *       - Use createNotification() function from utils.js to create notifications
 */


//Getting pushaction if element is button is pushed.
//the pushed item is saved in variable button.


theParent.addEventListener('click', function (e) {
    if (e.target !== e.currentTarget) {
        console.log(e.target);
        const clickedItem = e.target;
        //get parent element for the button
        const parentContainer = clickedItem.parentElement;
        const userNameElement = parentContainer.querySelector('h3');
        const formContainer = document.querySelector('#modify-user');

        //clear from if there is one before new form.
        const form = formContainer.querySelector('#edit-user-form');
        if (form !== null && (clickedItem.id.split('-')[0] === 'modify' || clickedItem.id.split('-')[0] === 'delete')) {
            formContainer.removeChild(form);
        }

        //action for modify button
        if (clickedItem.id.split('-')[0] === 'modify') {
            //clone form template
            const formContainer = document.querySelector('#modify-user');
            const template = document.querySelector('#form-template');
            const clone = template.content.cloneNode(true);


            //get form fields
            const id = clone.querySelector('#id-input');
            const name = clone.querySelector('#name-input');
            const email = clone.querySelector('#email-input');
            const role = clone.querySelector('#role-input');

            //user information
            const userName = userNameElement.innerText;
            const userId = parentContainer.id;
            const userEmail = parentContainer.querySelector('.user-email').innerText;
            const userRole = parentContainer.querySelector('.user-role').innerText;

            //change form values
            id.value = userId.split('-')[1];
            name.value = userName;
            email.value = userEmail;
            role.value = userRole;

            //change template user name
            //This might have easier way to do but it works :D
            const headlineName = clone.querySelector('h2');
            headlineName.innerHTML = headlineName.innerHTML.replace('{User Name}', userName);
            formContainer.appendChild(clone);

        }
        //action for delete button 
        else if (clickedItem.id.split('-')[0] === 'delete') {
            //removing the user that belongs to that element
            const greatParentContainer = parentContainer.parentElement;
            deleteResourse(API_USERS + '/' + parentContainer.id.split('-')[1]);
            createNotification('Deleted user' + ' ' + userNameElement.innerText, 'notifications-container');
            greatParentContainer.removeChild(parentContainer);
        }
    }
});
    


formloc.addEventListener('submit', function (e) {
    //prevent default event
    e.preventDefault();
    //get form results
    const formReturn = this.querySelector('form');
    const role = formReturn.querySelector('#role-input').value;
    //Update api
    postOrPutJSON(API_USERS + '/' + formReturn.querySelector('#id-input').value, 'PUT', { "role": role });
    const formContainer = document.querySelector('#modify-user');
    const form = formContainer.querySelector('#edit-user-form');
    //change element status
    const userEl = document.querySelector('#user-' + formReturn.querySelector('#id-input').value);
    userEl.querySelector('.user-role').innerHTML = role;

    //close form and set noticication
    formContainer.removeChild(form);
    createNotification('Updated user' + ' ' + formReturn.querySelector('#name-input').value, 'notifications-container');
    
});



 window.onload = listAllUsers;