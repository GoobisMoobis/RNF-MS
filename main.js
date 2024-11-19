let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMessageSection();
    }
    
    // Start listening for messages
    Firebase.listenForMessages(displayMessages);

    // Add server clear button for Uncle GoobisMoobis2
    addServerClearButton();

    // Restore messages from local storage on page reload
    const savedMessages = localStorage.getItem('savedMessages');
    if (savedMessages) {
        displayMessages(JSON.parse(savedMessages));
    }
});

async function setUsername() {
    const username = document.getElementById('username').value.trim();
    const nameColor = document.getElementById('nameColor').value;
    
    if (!username) {
        alert('Please enter a username!');
        return;
    }

    // Check if username already exists
    const usernameExists = await Firebase.checkUsernameExists(username);
    if (usernameExists) {
        alert('Username is already taken. Please choose a different username.');
        return;
    }

    currentUser = {
        username: username,
        color: nameColor,
        isRainbow: username === "Uncle GoobisMoobis2"
    };

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showMessageSection();
}

function showMessageSection() {
    document.getElementById('usernameSection').classList.remove('active');
    document.getElementById('messageSection').classList.add('active');
    const currentUsernameSpan = document.getElementById('currentUsername');
    
    // Special rainbow effect for Uncle GoobisMoobis2
    if (currentUser.isRainbow) {
        currentUsernameSpan.classList.add('rainbow-text');
    } else {
        currentUsernameSpan.classList.remove('rainbow-text');
        currentUsernameSpan.style.color = currentUser.color;
    }
    
    currentUsernameSpan.textContent = currentUser.username;
}

function addServerClearButton() {
    if (currentUser && currentUser.username === "Uncle GoobisMoobis2") {
        const serverClearButton = document.createElement('button');
        serverClearButton.textContent = 'Clear Server Messages';
        serverClearButton.id = 'serverClearButton';
        serverClearButton.style.position = 'fixed';
        serverClearButton.style.bottom = '10px';
        serverClearButton.style.left = '10px';
        serverClearButton.onclick = clearServerMessages;
        document.body.appendChild(serverClearButton);
    }
}

async function clearServerMessages() {
    if (currentUser && currentUser.username === "Uncle GoobisMoobis2") {
        const confirmClear = confirm('Are you sure you want to clear ALL messages on the server?');
        if (confirmClear) {
            try {
                await Firebase.clearServerMessages();
                alert('All server messages have been cleared.');
                
                // Clear local storage messages as well
                localStorage.removeItem('savedMessages');
                localStorage.removeItem('lastMessageTimestamp');
                document.getElementById('messages').innerHTML = '';
            } catch (error) {
                alert('Error clearing server messages: ' + error.message);
            }
        }
    }
}

async function postMessage() {
    if (!currentUser) {
        alert('Please set a username first!');
        return;
    }

    const message = document.getElementById('message').value.trim();
    
    if (!message) {
        alert('Please enter a message!');
        return;
    }

    try {
        await Firebase.postMessage({
            username: currentUser.username,
            color: currentUser.color,
            message: message,
            timestamp: Date.now(),
            userId: currentUser.username,
            isRainbow: currentUser.isRainbow || false
        });

        document.getElementById('message').value = '';
    } catch (error) {
        alert('Error posting message: ' + error.message);
    }
}

async function deleteAccount() {
    if (!currentUser) {
        alert('No account to delete!');
        return;
    }

    const deletedUsername = currentUser.username;
    
    try {
        const messagesRef = Firebase.ref(Firebase.database, 'messages');
        const snapshot = await Firebase.get(messagesRef);
        
        const updates = {};
        snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val();
            if (message.username === deletedUsername) {
                updates[childSnapshot.key] = {
                    ...message,
                    username: 'Deleted User',
                    color: '#666666',
                    isRainbow: false
                };
            }
        });

        if (Object.keys(updates).length > 0) {
            await Firebase.update(messagesRef, updates);
        }

        localStorage.removeItem('currentUser');
        currentUser = null;

        document.getElementById('username').value = '';
        document.getElementById('nameColor').value = '#4CAF50';
        document.getElementById('messageSection').classList.remove('active');
        document.getElementById('usernameSection').classList.add('active');
        
        hideDeleteModal();
    } catch (error) {
        alert('Error deleting account: ' + error.message);
    }
}

function showDeleteModal() {
    document.getElementById('deleteModal').style.display = 'block';
}

function clearAllData() {
    // Modify the local storage to prevent messages from reappearing
    localStorage.removeItem('lastMessageTimestamp');
    localStorage.removeItem('savedMessages');
    
    // Clear messages from the display
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';
    
    hideDeleteModal();
}

function displayMessages(messages) {
    // Ensure messages is always an array
    messages = messages || [];

    // Sort messages by timestamp
    messages.sort((a, b) => b.timestamp - a.timestamp);
    
    const messagesDiv = document.getElementById('messages');
    
    // Always save ALL messages to local storage
    localStorage.setItem('savedMessages', JSON.stringify(messages));

    // Generate HTML for ALL messages
    const messagesHTML = messages.map(msg => `
        <div class="message">
            <span class="username ${msg.isRainbow ? 'rainbow-text' : ''}" style="color: ${msg.isRainbow ? '' : escapeHTML(msg.color)}">
                ${escapeHTML(msg.username)}
            </span>
            <span class="timestamp">${new Date(msg.timestamp).toLocaleString()}</span>
            <p>${escapeHTML(msg.message)}</p>
        </div>
    `).join('');

    // Set the entire innerHTML to all messages
    messagesDiv.innerHTML = messagesHTML;

    // Update the last message timestamp
    if (messages.length > 0) {
        localStorage.setItem('lastMessageTimestamp', 
            Math.max(...messages.map(msg => msg.timestamp)).toString()
        );
    }
}

function hideDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

window.onclick = function(event) {
    const modal = document.getElementById('deleteModal');
    if (event.target === modal) {
        hideDeleteModal();
    }
}