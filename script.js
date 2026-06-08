// 1. HTML elements ko JavaScript mein select karna
const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const clearBtn = document.getElementById('clear-btn');

// 2. Local Storage se purana data nikalna
const localStorageTransactions = JSON.parse(
  localStorage.getItem('transactions')
);

let transactions =
  localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

// 3. Naya Transaction Add Karna
function addTransaction(e) {
  e.preventDefault();

  if (text.value.trim() === '' || amount.value.trim() === '') {
    alert('Please add a text and amount');
    return;
  }

  const transaction = {
    id: generateID(),
    text: text.value,
    amount: +amount.value // String ko number mein convert karne ke liye + use kiya
  };

  transactions.push(transaction);
  addTransactionDOM(transaction);
  updateValues();
  updateLocalStorage();

  text.value = '';
  amount.value = '';
}

// Random ID generate karne ke liye
function generateID() {
  return Math.floor(Math.random() * 100000000);
}

// 4. Transactions ko Screen (DOM) par dikhana
function addTransactionDOM(transaction) {
  const sign = transaction.amount < 0 ? '-' : '+';
  const item = document.createElement('li');

  // Amount ke hisab se plus/minus class lagana
  item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

  item.innerHTML = `
    ${transaction.text} <span>${sign}₹${Math.abs(transaction.amount)}</span>
    <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
  `;

  list.appendChild(item);
}

// 5. Total Balance, Income, aur Expense update karna
function updateValues() {
  const amounts = transactions.map(transaction => transaction.amount);

  const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);

  const income = amounts
    .filter(item => item > 0)
    .reduce((acc, item) => (acc += item), 0)
    .toFixed(2);

  const expense = (
    amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) *
    -1
  ).toFixed(2);

  balance.innerText = `₹${total}`;
  money_plus.innerText = `+₹${income}`;
  money_minus.innerText = `-₹${expense}`;
}

// 6. Transaction delete karne ke liye
function removeTransaction(id) {
  transactions = transactions.filter(transaction => transaction.id !== id);
  updateLocalStorage();
  init();
}

// 7. Local Storage mein data save rakhna
function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Clear All Functionality
clearBtn.addEventListener('click', () => {
  if (transactions.length === 0) {
    alert("History pehle se hi khali hai!");
    return;
  }
  if (confirm("Kya aap saara data delete karna chahte hain?")) {
    transactions = [];
    updateLocalStorage();
    init();
  }
});

// App ko shuru karne ke liye function
function init() {
  list.innerHTML = '';
  transactions.forEach(addTransactionDOM);
  updateValues();
}

init();

// Form submit event listener
form.addEventListener('submit', addTransaction);