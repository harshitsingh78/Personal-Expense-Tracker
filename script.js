// ==========================================================================
// 1. FIREBASE CONFIGURATION & INITIALIZATION
// ==========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDyMhkMK5I-UeYCfnigaheNXEVR7_J9bxs",
  authDomain: "personal-expense-tracker-8ad60.firebaseapp.com",
  projectId: "personal-expense-tracker-8ad60",
  storageBucket: "personal-expense-tracker-8ad60.firebasestorage.app",
  messagingSenderId: "394065928943",
  appId: "1:394065928943:web:0ac5621cfb2d3de9e1311a",
  measurementId: "G-40CWP42WRX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==========================================================================
// 2. HTML ELEMENTS SELECTION
// ==========================================================================
const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const clearBtn = document.getElementById('clear-btn');

// Premium Auth DOM Elements (Mapped with your new index.html)
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userName = document.getElementById('user-name');
const mainDashboard = document.getElementById('main-dashboard');
const authBox = document.getElementById('auth-box');
const userProfile = document.getElementById('user-profile');

// Global State Variables
let transactions = [];
let currentUser = null;
let unsubscribeFromFirestore = null;

// ==========================================================================
// 3. FIREBASE AUTHENTICATION (Login / Logout Management)
// ==========================================================================

// Google Sign-In Trigger
loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .catch(error => console.error("Login System Error:", error));
});

// Logout Trigger
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Auth State Observer: Handles dynamic state switching cleanly
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        userName.innerText = `Welcome, ${user.displayName}`;
        
        // Dynamic UI Toggling for Premium Layout
        authBox.style.display = 'none';        // Premium Login Card Chhip jayega
        userProfile.style.display = 'flex';     // Top Welcome/Logout Bar dikhegi
        mainDashboard.style.display = 'block';  // Dashboard visible hoga
        
        // Real-time data loading strictly for logged-in user (Secure separation)
        loadFirebaseTransactions(user.uid);
    } else {
        currentUser = null;
        userName.innerText = '';
        
        // Resetting back to Welcome screen layout
        authBox.style.display = 'flex';         // Premium Card wapas dikhega
        userProfile.style.display = 'none';     // Top Bar chhip jayegi
        mainDashboard.style.display = 'none';   // Dashboard hide ho jayega
        
        transactions = [];
        list.innerHTML = '';
        
        // Memory clean up: Unsubscribe from old listener stream
        if (unsubscribeFromFirestore) unsubscribeFromFirestore();
    }
});

// ==========================================================================
// 4. REAL-TIME FIRESTORE DATA SYNC
// ==========================================================================
function loadFirebaseTransactions(uid) {
    // Interview Context: `.where()` implements multi-tenant logical routing boundary
    unsubscribeFromFirestore = db.collection('transactions')
        .where('userId', '==', uid)
        .onSnapshot(snapshot => {
            transactions = [];
            snapshot.forEach(doc => {
                transactions.push({
                    id: doc.id, // Using Firestore alphanumeric hash ID
                    text: doc.data().text,
                    amount: doc.data().amount
                });
            });
            init(); // Re-render the list dynamically on data changes
        }, error => {
            console.error("Firestore Read Error:", error);
        });
}

// ==========================================================================
// 5. ADD NEW TRANSACTION (Core Business Logic)
// ==========================================================================
function addTransaction(e) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '') {
        alert('Please add a text and amount');
        return;
    }

    if (!currentUser) {
        alert("Session Expired! Please login again.");
        return;
    }

    // Creating document object structure mapped securely via backend tokens
    const transaction = {
        userId: currentUser.uid, // <--- LINKING RECORD TO UNIQUE USER ACCOUNT
        text: text.value,
        amount: +amount.value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp() // Server timestamp strategy
    };

    db.collection('transactions').add(transaction)
        .then(() => {
            text.value = '';
            amount.value = '';
        })
        .catch(err => console.error("Firestore Write Error: ", err));
}

// ==========================================================================
// 6. RENDER DATA TO SCREEN (DOM Manipulation)
// ==========================================================================
function addTransactionDOM(transaction) {
    const sign = transaction.amount < 0 ? '-' : '+';
    const item = document.createElement('li');

    // CSS styling selection based on data polarity boundaries
    item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

    // Sanitized document parsing mapping string literal token keys
    item.innerHTML = `
        ${transaction.text} <span>${sign}₹${Math.abs(transaction.amount)}</span>
        <button class="delete-btn" onclick="removeTransaction('${transaction.id}')">x</button>
    `;

    list.appendChild(item);
}

// ==========================================================================
// 7. COMPUTE SUMMARY VALUES (Total, Income, Expense)
// ==========================================================================
function updateValues() {
    const amounts = transactions.map(transaction => transaction.amount);

    const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);

    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc += item), 0)
        .toFixed(2);

    const expense = (
        amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1
    ).toFixed(2);

    balance.innerText = `₹${total}`;
    money_plus.innerText = `+₹${income}`;
    money_minus.innerText = `-₹${expense}`;
}

// ==========================================================================
// 8. DATA DELETION / DESTRUCTION METHODS
// ==========================================================================

// Remove Single Item via Doc Target Allocation
function removeTransaction(id) {
    db.collection('transactions').doc(id).delete()
        .catch(err => console.error("Firestore Delete Error: ", err));
}

// Wipe Out User specific data batch atomically
clearBtn.addEventListener('click', () => {
    if (transactions.length === 0) {
        alert("History pehle se hi khali hai!");
        return;
    }
    
    if (confirm("Kya aap saara data delete karna chahte hain?")) {
        db.collection('transactions')
            .where('userId', '==', currentUser.uid)
            .get()
            .then(snapshot => {
                const batch = db.batch();
                snapshot.forEach(doc => batch.delete(doc.ref));
                return batch.commit(); // Single pipeline network request atomic operation
            })
            .catch(err => console.error("Firestore Batch Wipe Error: ", err));
    }
});

// Initialize UI layout engine
function init() {
    list.innerHTML = '';
    transactions.forEach(addTransactionDOM);
    updateValues();
}

// Form Interceptor Setup
form.addEventListener('submit', addTransaction);