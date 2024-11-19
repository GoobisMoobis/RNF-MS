   let currentUser = null;

        document.addEventListener('DOMContentLoaded', function() {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                currentUser = JSON.parse(savedUser);
                showMessageSection();
            }
            // Start listening for messages
            Firebase.listenForMessages(displayMessages);
        });

        function setUsername() {
            const username = document.getElementById('username').value.trim();
            const nameColor = document.getElementById('nameColor').value;
            
            if (!username) {
                alert('Please enter a username!');
                return;
            }

            currentUser = {
                username: username,
                color: nameColor
            };

            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMessageSection();
        }

        function showMessageSection() {
            document.getElementById('usernameSection').classList.remove('active');
            document.getElementById('messageSection').classList.add('active');
            const currentUsernameSpan = document.getElementById('currentUsername');
            currentUsernameSpan.textContent = currentUser.username;
            currentUsernameSpan.style.color = currentUser.color;
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
                    userId: currentUser.username
                });

                document.getElementById('message').value = '';
            } catch (error) {
                alert('Error posting message: ' + error.message);
            }
        }

        async function deleteAccount() {
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
                            color: '#666666'
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
        function displayMessages(messages) {
            // Sort messages by timestamp
            messages.sort((a, b) => b.timestamp - a.timestamp);
            
            const messagesDiv = document.getElementById('messages');
            messagesDiv.innerHTML = messages.map(msg => `
                <div class="message">
                    <span class="username" style="color: ${escapeHTML(msg.color)}">
                        ${escapeHTML(msg.username)}
                    </span>
                    <span class="timestamp">${new Date(msg.timestamp).toLocaleString()}</span>
                    <p>${escapeHTML(msg.message)}</p>
                </div>
            `).join('');
        }

       
        function clearAllData() {
            // Modified to only clear local display
            const messagesDiv = document.getElementById('messages');
            messagesDiv.innerHTML = '';
            hideDeleteModal();
        }

        function showDeleteModal() {
            if (!currentUser) {
                alert('No account to delete!');
                return;
            }
            document.getElementById('deleteModal').style.display = 'block';
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
