// ==========================================================================
// FIREBASE CONFIGURATION
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


// ==========================================================================
// FIREBASE INITIALIZATION
// ==========================================================================

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();


// ==========================================================================
// DOM ELEMENTS
// ==========================================================================

// Authentication
const authBox = document.getElementById("auth-box");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userProfile = document.getElementById("user-profile");
const userName = document.getElementById("user-name");
const mainDashboard = document.getElementById("main-dashboard");

// Dashboard
const dashboardDate = document.getElementById("dashboard-date");
const balance = document.getElementById("balance");
const moneyPlus = document.getElementById("money-plus");
const moneyMinus = document.getElementById("money-minus");

const transactionCount = document.getElementById("transaction-count");
const monthlyExpense = document.getElementById("monthly-expense");
const averageExpense = document.getElementById("average-expense");

// Search & Filters
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const typeFilter = document.getElementById("type-filter");

// Form
const form = document.getElementById("form");
const formTitle = document.getElementById("form-title");
const formSubtitle = document.getElementById("form-subtitle");

const textInput = document.getElementById("text");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const transactionDateInput = document.getElementById("transaction-date");

const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

// Transaction List
const list = document.getElementById("list");

// Clear Data
const clearBtn = document.getElementById("clear-btn");


// ==========================================================================
// APPLICATION STATE
// ==========================================================================

let transactions = [];

let currentUser = null;

let unsubscribeFromFirestore = null;

let editingTransactionId = null;


// ==========================================================================
// CATEGORY ICONS
// ==========================================================================

const categoryIcons = {
    Food: "🍔",
    Shopping: "🛍️",
    Transport: "🚗",
    Bills: "💡",
    Salary: "💰",
    Other: "📦"
};


// ==========================================================================
// LOCAL STORAGE
// ==========================================================================

function getStorageKey() {
    if (!currentUser) {
        return "expenseTracker_guest";
    }

    return `expenseTracker_${currentUser.uid}`;
}


function saveToLocalStorage() {
    try {
        localStorage.setItem(
            getStorageKey(),
            JSON.stringify(transactions)
        );
    } catch (error) {
        console.error(
            "Unable to save transactions locally:",
            error
        );
    }
}


function loadFromLocalStorage() {
    try {
        const storedData = localStorage.getItem(
            getStorageKey()
        );

        if (!storedData) {
            return [];
        }

        const parsedData = JSON.parse(storedData);

        return Array.isArray(parsedData)
            ? parsedData
            : [];

    } catch (error) {
        console.error(
            "Unable to load local transactions:",
            error
        );

        return [];
    }
}


// ==========================================================================
// GOOGLE LOGIN
// ==========================================================================

loginBtn.addEventListener("click", async () => {

    try {

        const provider =
            new firebase.auth.GoogleAuthProvider();

        await auth.signInWithPopup(provider);

    } catch (error) {

        console.error("Login Error:", error);

        alert(
            "Login failed. Please try again."
        );
    }

});


// ==========================================================================
// LOGOUT
// ==========================================================================

logoutBtn.addEventListener("click", async () => {

    try {

        if (unsubscribeFromFirestore) {
            unsubscribeFromFirestore();
            unsubscribeFromFirestore = null;
        }

        await auth.signOut();

    } catch (error) {

        console.error("Logout Error:", error);

        alert(
            "Logout failed. Please try again."
        );
    }

});


// ==========================================================================
// AUTH STATE
// ==========================================================================

auth.onAuthStateChanged((user) => {

    currentUser = user;

    if (user) {

        // --------------------------------------------------------------
        // USER LOGGED IN
        // --------------------------------------------------------------

        authBox.style.display = "none";

        userProfile.style.display = "flex";

        mainDashboard.style.display = "block";

        userName.textContent =
            `Welcome, ${user.displayName || "User"}`;

        setDashboardDate();

        setDefaultDate();

        loadTransactionsFromFirestore();

    } else {

        // --------------------------------------------------------------
        // USER LOGGED OUT
        // --------------------------------------------------------------

        authBox.style.display = "flex";

        userProfile.style.display = "none";

        mainDashboard.style.display = "none";

        transactions = [];

        editingTransactionId = null;

        list.innerHTML = "";

        resetForm();

    }

});


// ==========================================================================
// LOAD TRANSACTIONS FROM FIRESTORE
// ==========================================================================

function loadTransactionsFromFirestore() {

    if (!currentUser) {
        return;
    }

    // Remove previous listener if one exists
    if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
    }

    unsubscribeFromFirestore = db
        .collection("transactions")
        .where(
            "userId",
            "==",
            currentUser.uid
        )
        .onSnapshot(
            (snapshot) => {

                transactions = [];

                snapshot.forEach((doc) => {

                    const data = doc.data();

                    transactions.push({
                        id: doc.id,

                        text:
                            data.text || "Untitled",

                        amount:
                            Number(data.amount) || 0,

                        category:
                            data.category || "Other",

                        date:
                            data.date || getDateFromTimestamp(
                                data.createdAt
                            ),

                        createdAt:
                            data.createdAt || null
                    });

                });

                saveToLocalStorage();

                updateDashboard();

                renderTransactions();

            },

            (error) => {

                console.error(
                    "Firestore listener error:",
                    error
                );

                // ------------------------------------------------------
                // LOCAL STORAGE FALLBACK
                // ------------------------------------------------------

                const localTransactions =
                    loadFromLocalStorage();

                if (localTransactions.length > 0) {

                    transactions =
                        localTransactions;

                    updateDashboard();

                    renderTransactions();
                }

            }
        );
}


// ==========================================================================
// ADD / UPDATE TRANSACTION
// ==========================================================================

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    const description =
        textInput.value.trim();

    const amount =
        Number(amountInput.value);

    const category =
        categoryInput.value;

    const date =
        transactionDateInput.value;


    // --------------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------------

    if (!description) {

        alert(
            "Please enter a transaction description."
        );

        return;
    }


    if (
        Number.isNaN(amount) ||
        amount === 0
    ) {

        alert(
            "Please enter a valid amount. Amount cannot be zero."
        );

        return;
    }


    if (!category) {

        alert(
            "Please select a category."
        );

        return;
    }


    if (!date) {

        alert(
            "Please select a transaction date."
        );

        return;
    }


    // --------------------------------------------------------------
    // EDIT EXISTING TRANSACTION
    // --------------------------------------------------------------

    if (editingTransactionId) {

        await updateTransaction(
            editingTransactionId,
            description,
            amount,
            category,
            date
        );

        return;
    }


    // --------------------------------------------------------------
    // ADD NEW TRANSACTION
    // --------------------------------------------------------------

    try {

        submitBtn.disabled = true;

        submitBtn.textContent =
            "Adding...";


        const transaction = {

            userId:
                currentUser.uid,

            text:
                description,

            amount:
                amount,

            category:
                category,

            date:
                date,

            createdAt:
                firebase.firestore.FieldValue.serverTimestamp()

        };


        await db
            .collection("transactions")
            .add(transaction);


        resetForm();


    } catch (error) {

        console.error(
            "Add transaction error:",
            error
        );

        alert(
            "Unable to add transaction. Please try again."
        );

    } finally {

        submitBtn.disabled = false;

        if (!editingTransactionId) {

            submitBtn.textContent =
                "+ Add Transaction";
        }

    }

});


// ==========================================================================
// UPDATE TRANSACTION
// ==========================================================================

async function updateTransaction(
    id,
    description,
    amount,
    category,
    date
) {

    try {

        submitBtn.disabled = true;

        submitBtn.textContent =
            "Saving...";


        await db
            .collection("transactions")
            .doc(id)
            .update({

                text:
                    description,

                amount:
                    amount,

                category:
                    category,

                date:
                    date

            });


        alert(
            "Transaction updated successfully."
        );


        resetForm();


    } catch (error) {

        console.error(
            "Update transaction error:",
            error
        );

        alert(
            "Unable to update transaction. Please try again."
        );

    } finally {

        submitBtn.disabled = false;

        submitBtn.textContent =
            "+ Add Transaction";
    }
}


// ==========================================================================
// START EDIT MODE
// ==========================================================================

function startEditTransaction(id) {

    const transaction =
        transactions.find(
            (item) => item.id === id
        );

    if (!transaction) {
        return;
    }


    editingTransactionId =
        transaction.id;


    textInput.value =
        transaction.text || "";


    amountInput.value =
        transaction.amount || "";


    categoryInput.value =
        transaction.category || "Other";


    transactionDateInput.value =
        transaction.date ||
        getTodayDate();


    formTitle.textContent =
        "Edit Transaction";


    formSubtitle.textContent =
        "Update your transaction details";


    submitBtn.textContent =
        "Save Changes";


    cancelEditBtn.style.display =
        "block";


    // Scroll to form
    form.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// ==========================================================================
// CANCEL EDIT
// ==========================================================================

cancelEditBtn.addEventListener(
    "click",
    () => {

        resetForm();

    }
);


// ==========================================================================
// RESET FORM
// ==========================================================================

function resetForm() {

    editingTransactionId = null;

    form.reset();

    formTitle.textContent =
        "Add Transaction";

    formSubtitle.textContent =
        "Record your income or expense";

    submitBtn.textContent =
        "+ Add Transaction";

    cancelEditBtn.style.display =
        "none";

    setDefaultDate();

}


// ==========================================================================
// SET DEFAULT DATE
// ==========================================================================

function setDefaultDate() {

    transactionDateInput.value =
        getTodayDate();

}


// ==========================================================================
// GET TODAY DATE
// FORMAT: YYYY-MM-DD
// ==========================================================================

function getTodayDate() {

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ==========================================================================
// TIMESTAMP → DATE
// ==========================================================================

function getDateFromTimestamp(timestamp) {

    if (!timestamp) {
        return "";
    }

    try {

        let date;

        // Firestore Timestamp
        if (
            typeof timestamp.toDate ===
            "function"
        ) {

            date =
                timestamp.toDate();

        }

        // JavaScript Date
        else if (
            timestamp instanceof Date
        ) {

            date =
                timestamp;

        }

        // Milliseconds
        else if (
            typeof timestamp ===
            "number"
        ) {

            date =
                new Date(timestamp);

        }

        else {
            return "";
        }


        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                date.getDate()
            ).padStart(2, "0");


        return `${year}-${month}-${day}`;

    } catch (error) {

        return "";
    }
}


// ==========================================================================
// DASHBOARD DATE
// ==========================================================================

function setDashboardDate() {

    const today =
        new Date();

    dashboardDate.textContent =
        today.toLocaleDateString(
            "en-IN",
            {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

}


// ==========================================================================
// UPDATE DASHBOARD
// ==========================================================================

function updateDashboard() {

    let totalIncome = 0;

    let totalExpense = 0;

    let expenseCount = 0;


    transactions.forEach(
        (transaction) => {

            const amount =
                Number(transaction.amount) || 0;


            if (amount > 0) {

                totalIncome += amount;

            } else if (amount < 0) {

                totalExpense +=
                    Math.abs(amount);

                expenseCount++;
            }

        }
    );


    const totalBalance =
        totalIncome - totalExpense;


    // --------------------------------------------------------------
    // MAIN BALANCE
    // --------------------------------------------------------------

    balance.textContent =
        formatCurrency(totalBalance);


    // --------------------------------------------------------------
    // INCOME
    // --------------------------------------------------------------

    moneyPlus.textContent =
        `+${formatCurrency(totalIncome)}`;


    // --------------------------------------------------------------
    // EXPENSE
    // --------------------------------------------------------------

    moneyMinus.textContent =
        `-${formatCurrency(totalExpense)}`;


    // --------------------------------------------------------------
    // QUICK STATS
    // --------------------------------------------------------------

    transactionCount.textContent =
        transactions.length;


    monthlyExpense.textContent =
        formatCurrency(
            calculateMonthlyExpense()
        );


    const average =
        expenseCount > 0
            ? totalExpense / expenseCount
            : 0;


    averageExpense.textContent =
        formatCurrency(average);

}


// ==========================================================================
// MONTHLY EXPENSE
// ==========================================================================

function calculateMonthlyExpense() {

    const now =
        new Date();

    const currentYear =
        now.getFullYear();

    const currentMonth =
        now.getMonth();


    let expense = 0;


    transactions.forEach(
        (transaction) => {

            if (
                Number(transaction.amount) >=
                0
            ) {
                return;
            }


            let transactionDate =
                parseTransactionDate(
                    transaction
                );


            if (!transactionDate) {
                return;
            }


            if (
                transactionDate.getFullYear() ===
                    currentYear &&

                transactionDate.getMonth() ===
                    currentMonth
            ) {

                expense +=
                    Math.abs(
                        Number(
                            transaction.amount
                        )
                    );

            }

        }
    );


    return expense;
}


// ==========================================================================
// PARSE TRANSACTION DATE
// ==========================================================================

function parseTransactionDate(transaction) {

    // --------------------------------------------------------------
    // First priority: stored YYYY-MM-DD date
    // --------------------------------------------------------------

    if (transaction.date) {

        const parts =
            transaction.date.split("-");


        if (parts.length === 3) {

            const year =
                Number(parts[0]);

            const month =
                Number(parts[1]) - 1;

            const day =
                Number(parts[2]);


            const parsed =
                new Date(
                    year,
                    month,
                    day
                );


            if (
                !Number.isNaN(
                    parsed.getTime()
                )
            ) {

                return parsed;
            }
        }

    }


    // --------------------------------------------------------------
    // Second priority: Firestore createdAt
    // --------------------------------------------------------------

    if (transaction.createdAt) {

        try {

            if (
                typeof transaction
                    .createdAt
                    .toDate ===
                "function"
            ) {

                return transaction
                    .createdAt
                    .toDate();

            }

        } catch (error) {

            return null;

        }

    }


    return null;
}


// ==========================================================================
// RENDER TRANSACTIONS
// ==========================================================================

function renderTransactions() {

    list.innerHTML = "";


    // --------------------------------------------------------------
    // APPLY FILTERS
    // --------------------------------------------------------------

    const searchTerm =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedCategory =
        categoryFilter.value;


    const selectedType =
        typeFilter.value;


    let filteredTransactions =
        transactions.filter(
            (transaction) => {

                // --------------------------------------------------
                // SEARCH
                // --------------------------------------------------

                const description =
                    (
                        transaction.text ||
                        ""
                    ).toLowerCase();


                const category =
                    (
                        transaction.category ||
                        "Other"
                    ).toLowerCase();


                const matchesSearch =
                    !searchTerm ||

                    description.includes(
                        searchTerm
                    ) ||

                    category.includes(
                        searchTerm
                    );


                if (!matchesSearch) {
                    return false;
                }


                // --------------------------------------------------
                // CATEGORY FILTER
                // --------------------------------------------------

                if (
                    selectedCategory !==
                    "all"
                ) {

                    const transactionCategory =
                        transaction.category ||
                        "Other";


                    if (
                        transactionCategory !==
                        selectedCategory
                    ) {

                        return false;
                    }

                }


                // --------------------------------------------------
                // TYPE FILTER
                // --------------------------------------------------

                const amount =
                    Number(
                        transaction.amount
                    ) || 0;


                if (
                    selectedType ===
                    "income" &&
                    amount <= 0
                ) {

                    return false;
                }


                if (
                    selectedType ===
                    "expense" &&
                    amount >= 0
                ) {

                    return false;
                }


                return true;

            }
        );


    // --------------------------------------------------------------
    // SORT
    // --------------------------------------------------------------

    filteredTransactions.sort(
        compareTransactions
    );


    // --------------------------------------------------------------
    // EMPTY RESULT
    // --------------------------------------------------------------

    if (
        filteredTransactions.length ===
        0
    ) {

        const emptyMessage =
            document.createElement("li");

        emptyMessage.style.display =
            "block";

        emptyMessage.style.textAlign =
            "center";

        emptyMessage.style.padding =
            "30px 15px";

        emptyMessage.style.color =
            "var(--text-secondary)";

        emptyMessage.textContent =
            transactions.length === 0
                ? "No transactions yet. Add your first transaction."
                : "No matching transactions found.";

        list.appendChild(
            emptyMessage
        );

        return;
    }


    // --------------------------------------------------------------
    // CREATE TRANSACTION CARDS
    // --------------------------------------------------------------

    filteredTransactions.forEach(
        (transaction) => {

            const li =
                createTransactionElement(
                    transaction
                );

            list.appendChild(li);

        }
    );

}


// ==========================================================================
// SORT TRANSACTIONS
// ==========================================================================

function compareTransactions(a, b) {

    const dateA =
        parseTransactionDate(a);

    const dateB =
        parseTransactionDate(b);


    // Newer date first
    if (dateA && dateB) {

        const difference =
            dateB.getTime() -
            dateA.getTime();


        if (difference !== 0) {
            return difference;
        }
    }


    // Transactions with a date
    // come before transactions
    // without a date

    if (dateA && !dateB) {
        return -1;
    }

    if (!dateA && dateB) {
        return 1;
    }


    // --------------------------------------------------------------
    // Same date → createdAt
    // --------------------------------------------------------------

    const createdA =
        getCreatedAtTime(a);

    const createdB =
        getCreatedAtTime(b);


    return createdB - createdA;
}


// ==========================================================================
// GET CREATED AT TIME
// ==========================================================================

function getCreatedAtTime(transaction) {

    if (!transaction.createdAt) {
        return 0;
    }


    try {

        if (
            typeof transaction
                .createdAt
                .toDate ===
            "function"
        ) {

            return transaction
                .createdAt
                .toDate()
                .getTime();

        }

    } catch (error) {

        return 0;

    }


    return 0;
}


// ==========================================================================
// CREATE TRANSACTION ELEMENT
// ==========================================================================

function createTransactionElement(
    transaction
) {

    const amount =
        Number(transaction.amount) || 0;


    const isIncome =
        amount > 0;


    const li =
        document.createElement("li");


    li.className =
        isIncome
            ? "plus"
            : "minus";


    // --------------------------------------------------------------
    // TRANSACTION INFO
    // --------------------------------------------------------------

    const transactionInfo =
        document.createElement("div");

    transactionInfo.className =
        "transaction-info";


    // --------------------------------------------------------------
    // CATEGORY ICON
    // --------------------------------------------------------------

    const categoryIcon =
        document.createElement("div");

    categoryIcon.className =
        "transaction-category-icon";


    const category =
        transaction.category ||
        "Other";


    categoryIcon.textContent =
        categoryIcons[category] ||
        "📦";


    // --------------------------------------------------------------
    // DETAILS
    // --------------------------------------------------------------

    const details =
        document.createElement("div");

    details.className =
        "transaction-details";


    // Description
    const description =
        document.createElement("div");

    description.className =
        "transaction-description";

    description.textContent =
        transaction.text ||
        "Untitled";


    // Meta
    const meta =
        document.createElement("div");

    meta.className =
        "transaction-meta";


    const categoryElement =
        document.createElement("span");

    categoryElement.className =
        "transaction-category";

    categoryElement.textContent =
        category;


    const separator =
        document.createElement("span");

    separator.textContent =
        "•";


    const dateElement =
        document.createElement("span");

    dateElement.textContent =
        formatDisplayDate(
            transaction
        );


    meta.appendChild(
        categoryElement
    );

    meta.appendChild(
        separator
    );

    meta.appendChild(
        dateElement
    );


    details.appendChild(
        description
    );

    details.appendChild(
        meta
    );


    transactionInfo.appendChild(
        categoryIcon
    );

    transactionInfo.appendChild(
        details
    );


    // --------------------------------------------------------------
    // AMOUNT
    // --------------------------------------------------------------

    const amountElement =
        document.createElement("div");

    amountElement.className =
        "transaction-amount";


    if (isIncome) {

        amountElement.textContent =
            `+${formatCurrency(amount)}`;

    } else {

        amountElement.textContent =
            `-${formatCurrency(
                Math.abs(amount)
            )}`;

    }


    // --------------------------------------------------------------
    // ACTIONS
    // --------------------------------------------------------------

    const actions =
        document.createElement("div");

    actions.className =
        "transaction-actions";


    // Edit button
    const editButton =
        document.createElement("button");

    editButton.type =
        "button";

    editButton.className =
        "edit-btn";

    editButton.textContent =
        "✏️";

    editButton.title =
        "Edit transaction";


    editButton.addEventListener(
        "click",
        () => {

            startEditTransaction(
                transaction.id
            );

        }
    );


    // Delete button
    const deleteButton =
        document.createElement("button");

    deleteButton.type =
        "button";

    deleteButton.className =
        "delete-btn";

    deleteButton.textContent =
        "🗑️";

    deleteButton.title =
        "Delete transaction";


    deleteButton.addEventListener(
        "click",
        () => {

            deleteTransaction(
                transaction.id
            );

        }
    );


    actions.appendChild(
        editButton
    );

    actions.appendChild(
        deleteButton
    );


    // --------------------------------------------------------------
    // FINAL CARD
    // --------------------------------------------------------------

    li.appendChild(
        transactionInfo
    );

    li.appendChild(
        amountElement
    );

    li.appendChild(
        actions
    );


    return li;
}


// ==========================================================================
// FORMAT DISPLAY DATE
// ==========================================================================

function formatDisplayDate(
    transaction
) {

    const date =
        parseTransactionDate(
            transaction
        );


    if (!date) {
        return "Date unavailable";
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// ==========================================================================
// DELETE TRANSACTION
// ==========================================================================

async function deleteTransaction(id) {

    if (!currentUser) {
        return;
    }


    const transaction =
        transactions.find(
            (item) => item.id === id
        );


    if (!transaction) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${transaction.text}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await db
            .collection("transactions")
            .doc(id)
            .delete();


    } catch (error) {

        console.error(
            "Delete transaction error:",
            error
        );

        alert(
            "Unable to delete transaction. Please try again."
        );

    }

}


// ==========================================================================
// CLEAR ALL USER DATA
// ==========================================================================

clearBtn.addEventListener(
    "click",
    async () => {

        if (!currentUser) {

            alert(
                "Please login first."
            );

            return;
        }


        if (transactions.length === 0) {

            alert(
                "There are no transactions to delete."
            );

            return;
        }


        const confirmed =
            confirm(
                "Are you sure you want to delete ALL your transactions? This cannot be undone."
            );


        if (!confirmed) {
            return;
        }


        try {

            clearBtn.disabled =
                true;

            clearBtn.textContent =
                "Deleting...";


            const snapshot =
                await db
                    .collection("transactions")
                    .where(
                        "userId",
                        "==",
                        currentUser.uid
                    )
                    .get();


            // Firestore batches support
            // up to 500 operations

            let batch =
                db.batch();

            let operationCount = 0;


            for (
                const doc of snapshot.docs
            ) {

                batch.delete(doc.ref);

                operationCount++;


                if (
                    operationCount ===
                    500
                ) {

                    await batch.commit();

                    batch =
                        db.batch();

                    operationCount = 0;

                }

            }


            if (operationCount > 0) {
                await batch.commit();
            }


            transactions = [];

            saveToLocalStorage();

            cancelEdit();

            updateDashboard();

            renderTransactions();


            alert(
                "All your transactions have been deleted."
            );


        } catch (error) {

            console.error(
                "Clear data error:",
                error
            );

            alert(
                "Unable to clear your data. Please try again."
            );

        } finally {

            clearBtn.disabled =
                false;

            clearBtn.textContent =
                "🗑 Clear My Data";

        }

    }
);


// ==========================================================================
// CANCEL EDIT HELPER
// ==========================================================================

function cancelEdit() {

    editingTransactionId = null;

    form.reset();

    formTitle.textContent =
        "Add Transaction";

    formSubtitle.textContent =
        "Record your income or expense";

    submitBtn.textContent =
        "+ Add Transaction";

    cancelEditBtn.style.display =
        "none";

    setDefaultDate();

}


// ==========================================================================
// SEARCH
// ==========================================================================

searchInput.addEventListener(
    "input",
    () => {

        renderTransactions();

    }
);


// ==========================================================================
// CATEGORY FILTER
// ==========================================================================

categoryFilter.addEventListener(
    "change",
    () => {

        renderTransactions();

    }
);


// ==========================================================================
// TYPE FILTER
// ==========================================================================

typeFilter.addEventListener(
    "change",
    () => {

        renderTransactions();

    }
);


// ==========================================================================
// FORMAT CURRENCY
// ==========================================================================

function formatCurrency(value) {

    const number =
        Number(value) || 0;


    return `₹${number.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )}`;

}


// ==========================================================================
// INITIAL DATE
// ==========================================================================

setDashboardDate();

setDefaultDate();