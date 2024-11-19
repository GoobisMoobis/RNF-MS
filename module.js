                // Import the functions you need from the SDKs you need
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
        import { getDatabase, ref, push, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

        // Your web app's Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyCW3OKu2QvNKlMPMqTcsUtjcMM2VaN4qD8",
            authDomain: "msgnrts.firebaseapp.com",
            databaseURL: "https://msgnrts-default-rtdb.firebaseio.com",
            projectId: "msgnrts",
            storageBucket: "msgnrts.firebasestorage.app",
            messagingSenderId: "124811044741",
            appId: "1:124811044741:web:62a701cf205a5b898d06ec",
            measurementId: "G-1JET3WPTW1"
        };

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const database = getDatabase(app);

        // Create a global Firebase object to store all Firebase-related functions
        window.Firebase = {
            database: database,
            ref: ref,
            push: push,
            onValue: onValue,
            remove: remove,
            update: update,
            get: get,
            
            // Helper methods
            postMessage: function(messageData) {
                return push(ref(database, 'messages'), messageData);
            },
            
            listenForMessages: function(callback) {
                const messagesRef = ref(database, 'messages');
                onValue(messagesRef, (snapshot) => {
                    const messages = [];
                    snapshot.forEach((childSnapshot) => {
                        messages.push({
                            id: childSnapshot.key,
                            ...childSnapshot.val()
                        });
                    });
                    callback(messages);
                });
            },
            
            updateMessage: function(messageId, updates) {
                return update(ref(database, `messages/${messageId}`), updates);
            },
            
            deleteAllMessages: function() {
                return remove(ref(database, 'messages'));
            }
        };
