// ==========================================
// 🔥 Firebase 雲端基地初始化
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDfczo3Rkwe0OXijJUynLMM1Fb9c1FctSI",
    authDomain: "web-expense-tracker-1dbb4.firebaseapp.com",
    databaseURL: "https://web-expense-tracker-1dbb4-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "web-expense-tracker-1dbb4",
    storageBucket: "web-expense-tracker-1dbb4.firebasestorage.app",
    messagingSenderId: "749226836398",
    appId: "1:749226836398:web:7a5d5995ab85394fccc83f"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null; 
let transactions = [];  
let editingId = null; // 追蹤目前正在修改哪一筆資料

let expenseChartInstance = null; 
let incomeChartInstance = null;  

document.getElementById('inputDate').valueAsDate = new Date();

// ==========================================
// 🌍 翻譯字典與狀態設定
// ==========================================
const translations = {
    zh: {
        appTitle: "💰 肥蟲記賬本🐛 💰", totalIncome: "總收入", totalExpense: "總支出", 
        viewRange: "📅 查看範圍：", currentBalance: "目前結餘", addTransaction: "➕ 新增交易",
        date: "日期", transactionType: "交易類型", expenseBtn: "支出💸", incomeBtn: "收入💰", 
        category: "用途 / 分類", accountSource: "帳戶 / 來源", amount: "金額",
        amountPlaceholder: "輸入金額 (HKD)", confirmAdd: "確認新增", confirmEdit: "💾 儲存修改",
        expenseAnalysis: "📈 支出分析", noExpenseData: "目前尚無支出資料可供分析 💸",
        incomeAnalysis: "💰 收入來源分析", noIncomeData: "目前尚無收入資料可供分析 💰",
        recentRecords: "📝 最近交易紀錄", clearAll: "🗑️ 清除所有紀錄",
        feedbackBtn: "💡 給開發者留言回饋 (Feedback)",
        expenseHighlight: "支出重點", incomeHighlight: "收入重點",
        maxSource: "最大的來源是", totalAmt: "總共", detailRatio: "各項目詳細佔比",
        alertInput: "請填寫正確的日期與金額！", alertDel: "確定要刪除這筆單一紀錄嗎？", alertClear: "確定要清除所有的記帳紀錄嗎？這個動作無法復原喔！",
        remark: "備註 (選填)", remarkPlaceholder: "輸入備註細節...",
        customBg: "自訂背景圖片：", clearBg: "清除背景", alertBgSize: "圖片檔案太大，無法儲存！請選擇小於 2MB 的圖片。",
    },
    en: {
        appTitle: "💰 Web Expense Tracker🐛 💰", totalIncome: "Total Income", totalExpense: "Total Expense",
        viewRange: "📅 View Range: ", currentBalance: "Current Balance", addTransaction: "➕ Add Transaction",
        date: "Date", transactionType: "Transaction Type", expenseBtn: "Expense💸", incomeBtn: "Income💰", 
        category: "Category", accountSource: "Account / Source", amount: "Amount",
        amountPlaceholder: "Enter Amount (HKD)", confirmAdd: "Confirm Add", confirmEdit: "💾 Save Changes",
        expenseAnalysis: "📈 Expense Analysis", noExpenseData: "No expense data available for analysis 💸",
        incomeAnalysis: "💰 Income Analysis", noIncomeData: "No income data available for analysis 💰",
        recentRecords: "📝 Recent Records", clearAll: "🗑️ Clear All Records",
        feedbackBtn: "💡 Give Feedback",
        expenseHighlight: "Expense Focus", incomeHighlight: "Income Focus",
        maxSource: "Top source is", totalAmt: "Total", detailRatio: "Detailed Ratio",
        alertInput: "Please enter a valid date and amount!", alertDel: "Are you sure you want to delete this record?", alertClear: "Are you sure you want to clear ALL records? This cannot be undone!",
        remark: "Remarks (Optional)", remarkPlaceholder: "Enter details...",
        customBg: "Custom Background: ", clearBg: "Clear Background", alertBgSize: "Image file is too large to save! Please choose an image smaller than 2MB.",
    }
};

let currentLang = 'zh'; 
let isDarkMode = localStorage.getItem('darkMode') !== 'false';

// ==========================================
// 🔐 Google 登入系統與雲端連線
// ==========================================
function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => alert("登入失敗：" + error.message));
}
function logout() { auth.signOut(); }

auth.onAuthStateChanged((user) => {
    const userInfoDiv = document.getElementById('userInfo');
    if (user) {
        currentUser = user;
        userInfoDiv.innerHTML = `
            <span style="margin-right: 15px;">👋 Hi, ${user.displayName}</span>
            <button onclick="logout()" class="theme-btn" style="background: #dc3545; color: white; border: none;">登出 (Logout)</button>
        `;
        fetchTransactionsFromCloud(); 
    } else {
        currentUser = null; transactions = []; updateDashboard();
        userInfoDiv.innerHTML = `
            <button onclick="loginWithGoogle()" class="theme-btn" style="background: #4285F4; color: white; border: none; box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3) !important;">
                🔒 Google 登入 (Login)
            </button>
        `;
    }
});

async function fetchTransactionsFromCloud() {
    if (!currentUser) return;
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid).collection('transactions').get();
        transactions = snapshot.docs.map(doc => { const data = doc.data(); data.id = doc.id; return data; });
        updateDashboard();
    } catch (error) { console.error("讀取資料失敗：", error); }
}

// ==========================================
// 🚀 核心功能：新增/修改、刪除、清空 (雲端版)
// ==========================================
async function addTransaction() {
    if (!currentUser) { alert("請先登入 Google 帳號才能記帳喔！"); return; }

    const date = document.getElementById('inputDate').value;
    const type = document.getElementById('inputType').value;
    const account = document.getElementById('inputAccount').value;
    const category = document.getElementById('inputCategory').value;
    const amount = Math.round(parseFloat(document.getElementById('inputAmount').value) * 100) / 100;
    const remark = document.getElementById('inputRemark').value;

    if (!date || isNaN(amount) || amount <= 0) { alert(translations[currentLang].alertInput); return; }

    const transactionData = { date, type, account, category, amount, remark };
    const btn = document.querySelector('button[onclick="addTransaction()"]');
    btn.innerText = "⏳ 雲端同步中..."; btn.disabled = true;

    try {
        if (editingId) {
            // 🔄 修改模式
            await db.collection('users').doc(currentUser.uid).collection('transactions').doc(editingId).update(transactionData);
            const index = transactions.findIndex(t => t.id === editingId);
            transactions[index] = { ...transactionData, id: editingId };
            editingId = null; 
            btn.style.background = ""; // 恢復按鈕顏色
        } else {
            // ➕ 新增模式
            const docRef = await db.collection('users').doc(currentUser.uid).collection('transactions').add(transactionData);
            transactionData.id = docRef.id;
            transactions.push(transactionData);
        }
        document.getElementById('inputAmount').value = '';
        document.getElementById('inputRemark').value = '';
        updateDashboard();
    } catch (error) { alert("操作失敗：" + error.message); } 
    finally {
        btn.innerText = translations[currentLang].confirmAdd;
        btn.disabled = false;
    }
}

async function deleteTransaction(id) {
    if (!currentUser) return;
    if (confirm(translations[currentLang].alertDel)) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('transactions').doc(id).delete();
            transactions = transactions.filter(t => t.id !== id);
            updateDashboard();
        } catch(error) { alert("刪除失敗：" + error.message); }
    }
}

async function clearAllData() {
    if (!currentUser) return;
    if (confirm(translations[currentLang].alertClear)) {
        try {
            const snapshot = await db.collection('users').doc(currentUser.uid).collection('transactions').get();
            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit(); 
            transactions = []; updateDashboard();
        } catch(error) { alert("清除失敗：" + error.message); }
    }
}

// ✏️ 進入修改模式
function editTransaction(id) {
    const t = transactions.find(x => x.id === id);
    if (!t) return;
    
    document.getElementById('inputDate').value = t.date;
    setTransactionType(t.type); 
    
    // 檢查下拉選單有沒有這個選項，沒有就暫時補上
    if (!Array.from(document.getElementById('inputAccount').options).some(o => o.value === t.account)) {
        document.getElementById('inputAccount').add(new Option(t.account, t.account), 0);
    }
    if (!Array.from(document.getElementById('inputCategory').options).some(o => o.value === t.category)) {
        document.getElementById('inputCategory').add(new Option(t.category, t.category), 0);
    }

    document.getElementById('inputAccount').value = t.account;
    document.getElementById('inputCategory').value = t.category;
    document.getElementById('inputAmount').value = t.amount;
    document.getElementById('inputRemark').value = t.remark || '';
    
    editingId = id; 
    const btn = document.querySelector('button[onclick="addTransaction()"]');
    btn.innerHTML = translations[currentLang].confirmEdit;
    btn.style.background = "#ffc107"; btn.style.color = "#000"; // 變成醒目的黃色
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
}

// ==========================================
// 🎨 UI 渲染與畫面更新
// ==========================================
function updateDashboard() {
    let totalIncome = 0; let totalExpense = 0;
    const listEl = document.getElementById('transactionList'); listEl.innerHTML = ''; 

    const expenseData = {}; const incomeData = {}; 
    let accountTotals = {}; // 👈 紀錄各帳戶結餘

    const filterVal = document.getElementById('filterTime').value;
    const today = new Date(); 

    let filteredTransactions = transactions.filter(t => {
        if (filterVal === 'all') return true; 
        const tDate = new Date(t.date); 
        if (filterVal === 'today') {
            return tDate.toDateString() === today.toDateString(); // 👈 本日篩選邏輯
        }
        if (filterVal === 'month') {
            return tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
        }
        if (filterVal === 'week') {
            const diffTime = today - tDate; const diffDays = diffTime / (1000 * 60 * 60 * 24);
            return diffDays >= 0 && diffDays <= 7;
        }
        if (filterVal === 'custom') {
            const startVal = document.getElementById('customStartDate').value;
            const endVal = document.getElementById('customEndDate').value;
            if (!startVal || !endVal) return true; 
            const startDate = new Date(startVal); startDate.setHours(0, 0, 0, 0); 
            const endDate = new Date(endVal); endDate.setHours(23, 59, 59, 999); 
            return tDate >= startDate && tDate <= endDate;
        }
    });

    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    filteredTransactions.forEach(t => {
        if (t.type === 'income') {
            totalIncome += t.amount; incomeData[t.account] = (incomeData[t.account] || 0) + t.amount;
        } else if (t.type === 'expense') {
            totalExpense += t.amount; expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
        }

        // 👈 計算各帳戶餘額
        if (!accountTotals[t.account]) accountTotals[t.account] = 0;
        accountTotals[t.account] += (t.type === 'income' ? t.amount : -t.amount);

        const li = document.createElement('li');
        li.className = (t.type === 'income') ? 'li-income' : 'li-expense';
        const remarkText = t.remark ? `<br><small style="color: #6c757d; margin-top: 4px; display: inline-block;">📝 ${t.remark}</small>` : '';

        // 👈 加入修改按鈕 (✏️)
        li.innerHTML = `
            <span><strong>${formatDate(t.date)}</strong> | ${t.account} -> ${t.category} ${remarkText}</span>
            <span>
                $${formatMoney(t.amount)} 
                <button class="theme-btn" style="padding: 2px 8px; font-size: 14px; background: #ffc107; color: #000; border: none; min-width: auto; margin-left: 10px;" onclick="editTransaction('${t.id}')">✏️</button>
                <button class="delete-btn" style="min-width: auto; margin-left: 5px;" onclick="deleteTransaction('${t.id}')">❌</button>
            </span>
        `;
        listEl.appendChild(li); 
    });

    document.getElementById('totalIncome').innerText = formatMoney(totalIncome);
    document.getElementById('totalExpense').innerText = formatMoney(totalExpense);
    document.getElementById('totalBalance').innerText = formatMoney(totalIncome - totalExpense);

    // 👈 渲染各帳戶結餘到畫面上
    const accBalDiv = document.getElementById('accountBalances');
    if (accBalDiv) {
        accBalDiv.innerHTML = Object.keys(accountTotals)
            .map(acc => `<div style="display:flex; justify-content:space-between; margin-bottom: 4px;"><span>🏦 ${acc}</span><span style="font-weight:bold; color: ${accountTotals[acc] < 0 ? '#dc3545' : '#28a745'};">$${formatMoney(accountTotals[acc])}</span></div>`)
            .join('');
    }

    expenseChartInstance = drawChart('expenseChart', expenseData, expenseChartInstance);
    incomeChartInstance = drawChart('incomeChart', incomeData, incomeChartInstance);

    generateAnalysis(expenseData, totalExpense, 'analysisReport', translations[currentLang].expenseHighlight, '#dc3545', translations[currentLang].noExpenseData);
    generateAnalysis(incomeData, totalIncome, 'incomeReport', translations[currentLang].incomeHighlight, '#28a745', translations[currentLang].noIncomeData);

    localStorage.setItem('myExpenses', JSON.stringify(transactions));
}

function drawChart(canvasId, dataObj, chartInstance) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (chartInstance) { chartInstance.destroy(); }
    
    const textColor = isDarkMode ? '#ffffff' : '#666666';
    const borderColor = isDarkMode ? '#1e1e1e' : '#ffffff'; 

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(dataObj),
            datasets: [{
                data: Object.values(dataObj),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#8AC926', '#1982C4', '#F15BB5', '#00F5D4', '#9B5DE5', '#FEE440'],
                borderColor: borderColor, borderWidth: 2
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: textColor } } } }
    });
}

function generateAnalysis(dataObj, totalAmt, targetId, highlightName, colorHex, emptyMsg) {
    const reportEl = document.getElementById(targetId);
    if (totalAmt === 0 || Object.keys(dataObj).length === 0) { reportEl.innerHTML = emptyMsg; return; }
    let maxCategory = '', maxAmount = 0, detailsHTML = "<ul style='padding-left: 20px; margin-top: 10px;'>";
    for (const category in dataObj) {
        const amount = parseFloat(dataObj[category].toFixed(2));
        const percentage = Math.round((amount / totalAmt) * 100);
        detailsHTML += `<li style="margin-bottom: 5px; border-left: none; padding: 0; box-shadow: none; background: none;"><strong>${category}</strong>: $${formatMoney(amount)} (${percentage}%)</li>`;
        if (amount > maxAmount) { maxAmount = amount; maxCategory = category; }
    }
    reportEl.innerHTML = `<div style="font-size: 16px; margin-bottom: 10px;">💡 <strong>${highlightName}：</strong> ${translations[currentLang].maxSource}「<span style="color: ${colorHex}; font-weight: bold;">${maxCategory}</span>」，${translations[currentLang].totalAmt} <strong>$${formatMoney(maxAmount)}</strong>！</div><div><strong>📊 ${translations[currentLang].detailRatio}：</strong></div>${detailsHTML}`;
}

// ==========================================
// ⚙️ 其他輔助與自訂選項工具
// ==========================================
function handleCustomOption(selectEl, storageKey) {
    if (selectEl.value === 'custom') {
        const newVal = prompt(currentLang === 'zh' ? "請輸入新選項名稱：" : "Enter custom option name:");
        if (newVal && newVal.trim() !== '') {
            const cleanVal = newVal.trim();
            const opt = document.createElement('option');
            opt.value = cleanVal; opt.text = cleanVal;
            selectEl.insertBefore(opt, selectEl.options[selectEl.options.length - 1]);
            selectEl.value = cleanVal;
            
            let saved = JSON.parse(localStorage.getItem(storageKey)) || [];
            if (!saved.includes(cleanVal)) {
                saved.push(cleanVal);
                localStorage.setItem(storageKey, JSON.stringify(saved));
            }
        } else { selectEl.selectedIndex = 0; }
    }
}

function loadCustomOptions() {
    ['inputAccount', 'inputCategory'].forEach(id => {
        const key = id === 'inputAccount' ? 'customAccounts' : 'customCategories';
        const saved = JSON.parse(localStorage.getItem(key)) || [];
        const selectEl = document.getElementById(id);
        saved.forEach(val => {
            const opt = document.createElement('option'); opt.value = val; opt.text = val;
            selectEl.insertBefore(opt, selectEl.options[selectEl.options.length - 1]);
        });
    });
}

function toggleLanguage() {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) el.innerText = translations[currentLang][key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[currentLang][key]) el.placeholder = translations[currentLang][key];
    });
    updateDashboard(); applyTheme(); 
}

function setTransactionType(type) {
    document.getElementById('inputType').value = type; 
    const btnExp = document.getElementById('btnExpense'), btnInc = document.getElementById('btnIncome');
    const optExp = document.getElementById('optExpense'), optInc = document.getElementById('optIncome');
    if (type === 'expense') {
        btnExp.classList.add('active'); btnInc.classList.remove('active');
        if(optExp) optExp.style.display = 'block'; if(optInc) optInc.style.display = 'none';
        document.getElementById('inputCategory').value = 'Meal';
    } else {
        btnInc.classList.add('active'); btnExp.classList.remove('active');
        if(optExp) optExp.style.display = 'none'; if(optInc) optInc.style.display = 'block';
        document.getElementById('inputCategory').value = 'Salary'; 
    }
}

function handleFilterChange() {
    document.getElementById('customDateArea').style.display = (document.getElementById('filterTime').value === 'custom') ? 'block' : 'none';
    updateDashboard(); 
}

function applyTheme() {
    const themeBtn = document.getElementById('themeBtn');
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeBtn.innerText = currentLang === 'zh' ? '☀️ 淺色模式' : '☀️ Light Mode';
    } else {
        document.body.classList.remove('dark-mode');
        themeBtn.innerText = currentLang === 'zh' ? '🌙 暗色模式' : '🌙 Dark Mode';
    }
}

function toggleTheme() {
    isDarkMode = !isDarkMode; localStorage.setItem('darkMode', isDarkMode); 
    applyTheme(); updateDashboard();
}

function applyBackground() {
    const savedBg = localStorage.getItem('myBgImage');
    if (savedBg) {
        document.body.style.backgroundImage = `url(${savedBg})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundPosition = 'center';
    } else { document.body.style.backgroundImage = 'none'; }
}

function changeBackground(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try { localStorage.setItem('myBgImage', e.target.result); applyBackground(); } 
            catch (err) { alert(translations[currentLang].alertBgSize); document.getElementById('bgInput').value = ''; }
        };
        reader.readAsDataURL(file); 
    }
}

function clearBackground() { localStorage.removeItem('myBgImage'); document.getElementById('bgInput').value = ''; applyBackground(); }
function formatMoney(num) { return parseFloat(num.toFixed(2)).toLocaleString('en-US'); }
function formatDate(dateString) {
    if (!dateString) return ''; const parts = dateString.split('-'); 
    return (parts.length === 3) ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateString;
}

// 初始化啟動
applyBackground();
applyTheme();
setTransactionType('expense');
loadCustomOptions(); // 👈 啟動時自動載入你存過的自訂選項