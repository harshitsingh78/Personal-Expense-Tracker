# 💰 Personal Expense Tracker

A modern and responsive **Personal Expense Tracker** built with **HTML, CSS, JavaScript, Firebase Authentication, and Cloud Firestore**.

The application allows users to securely sign in with Google, add and manage their income and expenses, categorize transactions, search and filter records, and view their financial summary in a clean dashboard.

---

## 🚀 Features

### 🔐 Authentication

* Google Sign-In using Firebase Authentication
* User-specific transaction data
* Secure logout functionality

### 💸 Expense & Income Management

* Add new income or expense transactions
* Edit existing transactions
* Delete individual transactions
* Clear all personal transaction data
* Automatic balance calculation
* Separate income and expense totals

### 🏷️ Categories

Transactions can be organized into categories such as:

* 🍔 Food
* 🛍️ Shopping
* 🚗 Transport
* 💡 Bills
* 💰 Salary
* 📦 Other

### 🔎 Search & Filters

* Search transactions by description
* Search by category
* Filter transactions by category
* Filter transactions by income or expense

### 📊 Dashboard

The dashboard provides:

* Current balance
* Total income
* Total expenses
* Total number of transactions
* Current month's expenses
* Average expense

### 📅 Transaction Dates

* Add a date to every transaction
* Display transaction dates in the history
* Sort transactions by date

### 📱 Responsive Design

* Responsive layout for desktop and mobile devices
* Modern glassmorphism-inspired interface
* Animated financial background elements
* Clean and user-friendly dashboard

---

## 🛠️ Technologies Used

| Technology              | Purpose                                 |
| ----------------------- | --------------------------------------- |
| HTML5                   | Application structure                   |
| CSS3                    | Styling, animations & responsive design |
| JavaScript              | Application logic & DOM manipulation    |
| Firebase Authentication | Google authentication                   |
| Cloud Firestore         | Real-time transaction storage           |
| Git & GitHub            | Version control & project hosting       |

---

## 🏗️ Project Structure

```text
Expense-Tracker/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

---

## 🔥 Firebase Integration

The application uses Firebase for authentication and data storage.

### Firebase Authentication

Google Authentication is used to allow users to securely access their personal expense dashboard.

### Cloud Firestore

Transactions are stored in Firestore and associated with the authenticated user's ID.

Each transaction contains information such as:

```text
userId
text
amount
category
date
createdAt
```

The application also uses Firestore's real-time listener to automatically update the dashboard when transaction data changes.

---

## ⚙️ How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/Expense-Tracker.git
```

### 2. Open the project

```bash
cd Expense-Tracker
```

### 3. Run the application

You can open `index.html` directly in your browser.

For the best development experience, use **VS Code with Live Server**.

---

## 🔑 Firebase Configuration

Before running your own copy of the project, create a Firebase project and configure:

1. Firebase Authentication
2. Google Sign-In provider
3. Cloud Firestore
4. Firestore security rules

Then add your Firebase configuration to:

```text
script.js
```

Example:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

> **Note:** Firebase web configuration values are generally intended to identify the Firebase project; database access should still be protected using proper Firestore Security Rules.

---

## 📸 Application Overview

### Login

Users can sign in using their Google account.

### Dashboard

After authentication, users can view their:

* Balance
* Income
* Expenses
* Transaction count
* Monthly expenses
* Average expense

### Transaction Management

Users can add, edit, search, filter, and delete transactions directly from the dashboard.

---

## 🔄 Application Flow

```text
User
 │
 ▼
Google Authentication
 │
 ▼
Firebase Authentication
 │
 ▼
Expense Dashboard
 │
 ├── Add Transaction
 ├── Edit Transaction
 ├── Delete Transaction
 ├── Search
 ├── Filter
 └── View Statistics
 │
 ▼
Cloud Firestore
 │
 ▼
Real-Time Dashboard Updates
```

---

## 🎯 Future Improvements

Possible future enhancements include:

* 📊 Interactive expense charts
* 📈 Monthly spending analytics
* 🥧 Category-wise expense visualization
* 📅 Custom date-range reports
* 📥 Export transactions to CSV/PDF
* 🌙 Theme customization
* 🔔 Budget and spending alerts
* 💳 Multiple financial accounts
* 📱 Progressive Web App support

---

## 🧠 What I Learned

While developing this project, I worked with:

* JavaScript DOM manipulation
* Event handling
* Firebase Authentication
* Cloud Firestore
* Real-time database listeners
* CRUD operations
* Search and filtering logic
* Responsive web design
* Git and GitHub
* Client-side application state management

---

## 👨‍💻 Author

**Harshit Singh**

B.Tech – Computer Science & Engineering (AI)

---

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.
