// 翻譯字典
const translations = {
    zh: {
        appTitle: "💰 肥蟲記賬本🐛 💰", totalIncome: "總收入", totalExpense: "總支出", 
        viewRange: "📅 查看範圍：", currentBalance: "目前結餘", addTransaction: "➕ 新增交易",
        date: "日期", transactionType: "交易類型", expenseBtn: "支出💸", 
        incomeBtn: "收入💰", 
        // --- 這次新增的翻譯 ---
        category: "用途 / 分類", accountSource: "帳戶 / 來源", amount: "金額",
        amountPlaceholder: "輸入金額 (HKD)", confirmAdd: "確認新增",
        expenseAnalysis: "📈 支出分析", noExpenseData: "目前尚無支出資料可供分析 💸",
        incomeAnalysis: "💰 收入來源分析", noIncomeData: "目前尚無收入資料可供分析 💸",
        recentRecords: "📝 最近交易紀錄", clearAll: "🗑️ 清除所有紀錄",
        feedbackBtn: "💡 給開發者留言回饋 (Feedback)",
        // --- 分析報告專用的字眼 ---
        expenseHighlight: "支出重點", incomeHighlight: "收入重點",
        maxSource: "最大的來源是", totalAmt: "總共", detailRatio: "各項目詳細佔比",
        alertInput: "請填寫正確的日期與金額！", alertDel: "確定要刪除這筆單一紀錄嗎？", alertClear: "確定要清除所有的記帳紀錄嗎？這個動作無法復原喔！",

        // ... 這裡要把所有需要的翻譯寫進去
    },
    en: {
        appTitle: "💰 Web Expense Tracker🐛 💰", totalIncome: "Total Income", totalExpense: "Total Expense",
        viewRange: "📅 View Range: ", currentBalance: "Current Balance", addTransaction: "➕ Add Transaction",
        date: "Date", transactionType: "Transaction Type", expenseBtn: "Expense💸", 
        incomeBtn: "Income💰", 
        // --- 這次新增的翻譯 ---
        category: "Category", accountSource: "Account / Source", amount: "Amount",
        amountPlaceholder: "Enter Amount (HKD)", confirmAdd: "Confirm Add",
        expenseAnalysis: "📈 Expense Analysis", noExpenseData: "No expense data available for analysis 💸",
        incomeAnalysis: "💰 Income Analysis", noIncomeData: "No income data available for analysis 💸",
        recentRecords: "📝 Recent Records", clearAll: "🗑️ Clear All Records",
        feedbackBtn: "💡 Give Feedback",
        // --- 分析報告專用的字眼 ---
        expenseHighlight: "Expense Focus", incomeHighlight: "Income Focus",
        maxSource: "Top source is", totalAmt: "Total", detailRatio: "Detailed Ratio",
        alertInput: "Please enter a valid date and amount!", alertDel: "Are you sure you want to delete this record?", alertClear: "Are you sure you want to clear ALL records? This cannot be undone!",

        // ... (對應的英文翻譯)
    }
};

let currentLang = 'zh'; // 預設語言

// 一鍵切換語言的魔法
function toggleLanguage() {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    
    // 找出所有帶有 data-i18n 標籤的元素，替換它們裡面的文字
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            el.innerText = translations[currentLang][key];
        }
    });

    // 替換輸入框的 placeholder 文字
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[currentLang][key]) {
            el.placeholder = translations[currentLang][key];
        }
    });
    
    updateDashboard(); // 重新整理畫面
}

// 啟動 LocalStorage
let transactions = JSON.parse(localStorage.getItem('myExpenses')) || [];

// 【亮點】準備兩個獨立的變數來存放圖表，避免重疊衝突
let expenseChartInstance = null; 
let incomeChartInstance = null;  

// 設定今日預設日期
document.getElementById('inputDate').valueAsDate = new Date();

// 交易類型按鈕切換邏輯
function setTransactionType(type) {
    document.getElementById('inputType').value = type; // 更新隱藏的值
    
    const btnExp = document.getElementById('btnExpense');
    const btnInc = document.getElementById('btnIncome');
    
    if (type === 'expense') {
        btnExp.classList.add('active');
        btnInc.classList.remove('active');
    } else {
        btnInc.classList.add('active');
        btnExp.classList.remove('active');
    }
}

// 新增交易的主要 Function
function addTransaction() {
    const date = document.getElementById('inputDate').value;
    const type = document.getElementById('inputType').value;
    const account = document.getElementById('inputAccount').value;
    const category = document.getElementById('inputCategory').value;
    const amount = parseFloat(document.getElementById('inputAmount').value);

    if (!date || isNaN(amount) || amount <= 0) {
        alert(translations[currentLang].alertInput);
        return;
    }

    const transaction = {
        id: Date.now(),
        date: date,
        type: type,
        account: account,
        category: category,
        amount: amount
    };

    transactions.push(transaction);
    localStorage.setItem('myExpenses', JSON.stringify(transactions));
    document.getElementById('inputAmount').value = '';
    updateDashboard();
}

// 更新畫面的 Function
function updateDashboard() {
    let totalIncome = 0;
    let totalExpense = 0;
    const listEl = document.getElementById('transactionList');
    listEl.innerHTML = ''; 

    // 準備兩個空箱子，分別收集支出與收入的數據
    const expenseData = {};
    const incomeData = {}; 

    // 1. 抓取目前下拉選單選了什麼模式 ('all', 'month', 'week')
    const filterVal = document.getElementById('filterTime').value;
    const today = new Date(); // 取得今天的真實日期

    // 2. 使用 filter 產生一個「過濾後的新陣列」
    let filteredTransactions = transactions.filter(t => {
        if (filterVal === 'all') return true; // 如果選全部，就通通放行

        const tDate = new Date(t.date); // 把紀錄的日期字串轉成真正的日期格式

        if (filterVal === 'month') {
            // 判斷：年份和月份都要跟「今天」一樣，才放行
            return tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
        }
        
        if (filterVal === 'week') {
            // 判斷：計算日期相差的天數，如果在 0~7 天內，就放行
            const diffTime = today - tDate;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            return diffDays >= 0 && diffDays <= 7;
        }

        if (filterVal === 'custom') {
            const startVal = document.getElementById('customStartDate').value;
            const endVal = document.getElementById('customEndDate').value;
            
            // 如果沒選好開始或結束時間，就當作沒過濾，全部顯示
            if (!startVal || !endVal) return true; 

            const startDate = new Date(startVal);
            startDate.setHours(0, 0, 0, 0); // 設為當天凌晨 00:00
            
            const endDate = new Date(endVal);
            endDate.setHours(23, 59, 59, 999); // 設為當天深夜 23:59

            // 判斷交易日期是否落在這兩天之間
            return tDate >= startDate && tDate <= endDate;
        }
    });

    // 3. ⚠️ 重要修改：把原本的 transactions.forEach 改成我們過濾好的 filteredTransactions.forEach！
    filteredTransactions.forEach(t => {
        if (t.type === 'income' || t.type === 'repay') {
            totalIncome += t.amount;
            
            // 收集收入資料 
            if (incomeData[t.account]) {
                incomeData[t.account] += t.amount;
            } else {
                incomeData[t.account] = t.amount;
            }
            
        } else if (t.type === 'expense' || t.type === 'lend') {
            totalExpense += t.amount;
            
            // 收集支出資料 (使用 category)
            if (t.type === 'expense') {
                if (expenseData[t.category]) {
                    expenseData[t.category] += t.amount;
                } else {
                    expenseData[t.category] = t.amount;
                }
            }
        }

        // 產生清單 HTML (包含單筆刪除按鈕)
        const li = document.createElement('li');
        li.className = (t.type === 'income' || t.type === 'repay') ? 'li-income' : 'li-expense';
        li.innerHTML = `
            <span><strong>${t.date}</strong> | ${t.account} -> ${t.category} (${t.type})</span>
            <span>
                $${t.amount}
                <button class="delete-btn" onclick="deleteTransaction(${t.id})">❌</button>
            </span>
        `;
        listEl.prepend(li); 
    });

    document.getElementById('totalIncome').innerText = totalIncome;
    document.getElementById('totalExpense').innerText = totalExpense;
    document.getElementById('totalBalance').innerText = totalIncome - totalExpense;

    // 【亮點】呼叫同一個繪圖函數，只要傳入不同的畫布 ID 和資料，就能畫出兩張圖！
    expenseChartInstance = drawChart('expenseChart', expenseData, expenseChartInstance);
    incomeChartInstance = drawChart('incomeChart', incomeData, incomeChartInstance);

    // 【亮點】呼叫同一個報告函數，動態生成支出與收入的分析文字
    // 呼叫報告時，傳入當前語系的文字
    generateAnalysis(expenseData, totalExpense, 'analysisReport', translations[currentLang].expenseHighlight, '#dc3545', translations[currentLang].noExpenseData);
    generateAnalysis(incomeData, totalIncome, 'incomeReport', translations[currentLang].incomeHighlight, '#28a745', translations[currentLang].noIncomeData);
}

// 繪製圖表的通用 Function (升級版)
function drawChart(canvasId, dataObj, chartInstance) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (chartInstance) { chartInstance.destroy(); }

    const labels = Object.keys(dataObj);
    const dataValues = Object.values(dataObj);

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#E7E9ED', '#8AC926', '#1982C4'
                ]
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
}

// 產生分析報告的通用 Function (支援多語系)
function generateAnalysis(dataObj, totalAmt, targetId, highlightName, colorHex, emptyMsg) {
    const reportEl = document.getElementById(targetId);
    if (totalAmt === 0 || Object.keys(dataObj).length === 0) {
        reportEl.innerHTML = emptyMsg; // 使用傳進來的空資料訊息
        return;
    }

    let maxCategory = '';
    let maxAmount = 0;
    let detailsHTML = "<ul style='padding-left: 20px; margin-top: 10px;'>";

    for (const category in dataObj) {
        const amount = dataObj[category];
        const percentage = Math.round((amount / totalAmt) * 100);
        detailsHTML += `<li style="margin-bottom: 5px; border-left: none; padding: 0; box-shadow: none; background: none;">
                            <strong>${category}</strong>: $${amount} (${percentage}%)
                        </li>`;
        if (amount > maxAmount) {
            maxAmount = amount;
            maxCategory = category;
        }
    }
    detailsHTML += "</ul>";

    // 從字典抓取其他文字
    const textMaxSource = translations[currentLang].maxSource;
    const textTotalAmt = translations[currentLang].totalAmt;
    const textDetailRatio = translations[currentLang].detailRatio;

    reportEl.innerHTML = `
        <div style="font-size: 16px; margin-bottom: 10px;">
            💡 <strong>${highlightName}：</strong> ${textMaxSource}「<span style="color: ${colorHex}; font-weight: bold;">${maxCategory}</span>」，${textTotalAmt} <strong>$${maxAmount}</strong>！
        </div>
        <div><strong>📊 ${textDetailRatio}：</strong></div>
        ${detailsHTML}
    `;
}

// 單筆刪除的 Function
function deleteTransaction(id) {
    if (confirm(translations[currentLang].alertDel)) {
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem('myExpenses', JSON.stringify(transactions));
        updateDashboard();
    }
}

// 清除所有紀錄的 Function
function clearAllData() {
    if (confirm(translations[currentLang].alertClear)) {
        localStorage.removeItem('myExpenses');
        transactions = [];
        updateDashboard();
    }
}

// 判斷是否要顯示自訂日期輸入框
function handleFilterChange() {
    const filterVal = document.getElementById('filterTime').value;
    const customArea = document.getElementById('customDateArea');
    if (filterVal === 'custom') {
        customArea.style.display = 'block'; // 顯示
    } else {
        customArea.style.display = 'none';  // 隱藏
    }
    updateDashboard(); // 重新整理畫面
}

// 網頁一打開時立刻更新畫面
updateDashboard();