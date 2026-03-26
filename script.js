// 翻譯字典
const translations = {
    zh: {
        appTitle: "💰 肥蟲記賬本🐛 💰", totalIncome: "總收入", totalExpense: "總支出", 
        viewRange: "📅 查看範圍：", currentBalance: "目前結餘", addTransaction: "➕ 新增交易",
        date: "日期", transactionType: "交易類型", expenseBtn: "支出💸", 
        incomeBtn: "收入💰", 
        category: "用途 / 分類", accountSource: "帳戶 / 來源", amount: "金額",
        amountPlaceholder: "輸入金額 (HKD)", confirmAdd: "確認新增",
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
        date: "Date", transactionType: "Transaction Type", expenseBtn: "Expense💸", 
        incomeBtn: "Income💰", 
        category: "Category", accountSource: "Account / Source", amount: "Amount",
        amountPlaceholder: "Enter Amount (HKD)", confirmAdd: "Confirm Add",
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
let isDarkMode = localStorage.getItem('darkMode') === 'false';

// 1. 一鍵切換語言的魔法
function toggleLanguage() {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            el.innerText = translations[currentLang][key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[currentLang][key]) {
            el.placeholder = translations[currentLang][key];
        }
    });
    
    updateDashboard(); 
    applyTheme(); 
}

// 啟動 LocalStorage
let transactions = JSON.parse(localStorage.getItem('myExpenses')) || [];

let expenseChartInstance = null; 
let incomeChartInstance = null;  

// 設定今日預設日期
document.getElementById('inputDate').valueAsDate = new Date();

// 2. 交易類型按鈕切換邏輯 (✨ 加入了選單自動連動顯示/隱藏的魔法)
function setTransactionType(type) {
    document.getElementById('inputType').value = type; 
    
    const btnExp = document.getElementById('btnExpense');
    const btnInc = document.getElementById('btnIncome');
    
    // 抓取 HTML 裡的分類群組
    const optExp = document.getElementById('optExpense');
    const optInc = document.getElementById('optIncome');
    
    if (type === 'expense') {
        btnExp.classList.add('active');
        btnInc.classList.remove('active');
        // 顯示支出選項，隱藏收入選項
        if(optExp) optExp.style.display = 'block';
        if(optInc) optInc.style.display = 'none';
        document.getElementById('inputCategory').value = 'Meal'; // 自動切回預設支出
    } else {
        btnInc.classList.add('active');
        btnExp.classList.remove('active');
        // 顯示收入選項，隱藏支出選項
        if(optExp) optExp.style.display = 'none';
        if(optInc) optInc.style.display = 'block';
        document.getElementById('inputCategory').value = 'Income'; // 自動切回預設收入
    }
}

// 3. 交易的主要 Function
function addTransaction() {
    const date = document.getElementById('inputDate').value;
    const type = document.getElementById('inputType').value;
    const account = document.getElementById('inputAccount').value;
    const category = document.getElementById('inputCategory').value;
    const amount = Math.round(parseFloat(document.getElementById('inputAmount').value) * 100) / 100;
    const remark = document.getElementById('inputRemark').value;

    if (!date || isNaN(amount) || amount <= 0) {
        alert(translations[currentLang].alertInput);
        return;
    }

    const transaction = {
        id: Date.now(),
        date: date,
        type: type, // 現在只有 'expense' 或 'income'
        account: account,
        category: category,
        amount: amount,
        remark: remark,
    };

    transactions.push(transaction);
    localStorage.setItem('myExpenses', JSON.stringify(transactions));

    document.getElementById('inputAmount').value = '';
    document.getElementById('inputRemark').value = '';

    updateDashboard();
}

// 4. 更新畫面的 Function 
function updateDashboard() {
    let totalIncome = 0;
    let totalExpense = 0;
    const listEl = document.getElementById('transactionList');
    listEl.innerHTML = ''; 

    const expenseData = {};
    const incomeData = {}; 

    const filterVal = document.getElementById('filterTime').value;
    const today = new Date(); 

    let filteredTransactions = transactions.filter(t => {
        if (filterVal === 'all') return true; 

        const tDate = new Date(t.date); 

        if (filterVal === 'month') {
            return tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
        }
        
        if (filterVal === 'week') {
            const diffTime = today - tDate;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            return diffDays >= 0 && diffDays <= 7;
        }

        if (filterVal === 'custom') {
            const startVal = document.getElementById('customStartDate').value;
            const endVal = document.getElementById('customEndDate').value;
            if (!startVal || !endVal) return true; 

            const startDate = new Date(startVal);
            startDate.setHours(0, 0, 0, 0); 
            const endDate = new Date(endVal);
            endDate.setHours(23, 59, 59, 999); 
            return tDate >= startDate && tDate <= endDate;
        }
    });

    filteredTransactions.forEach(t => {
        if (t.type === 'income') {
            totalIncome += t.amount;
            // 收入圖表：根據「帳戶/來源」來分類 (例如：Salary, Mum)
            if (incomeData[t.account]) {
                incomeData[t.account] += t.amount;
            } else {
                incomeData[t.account] = t.amount;
            }
            
        } else if (t.type === 'expense') {
            totalExpense += t.amount;
            // 支出圖表：根據「用途/分類」來分類 (例如：Breakfast, Shopping)
            if (expenseData[t.category]) {
                expenseData[t.category] += t.amount;
            } else {
                expenseData[t.category] = t.amount;
            }
        }

        const li = document.createElement('li');
        li.className = (t.type === 'income') ? 'li-income' : 'li-expense';
        
        const remarkText = t.remark ? `<br><small style="color: #6c757d; margin-top: 4px; display: inline-block;">📝 ${t.remark}</small>` : '';

        li.innerHTML = `
            <span>
                <strong>${formatDate(t.date)}</strong> | ${t.account} -> ${t.category}
                ${remarkText} </span>
            <span>
                $${formatMoney(t.amount)} <button class="delete-btn" onclick="deleteTransaction(${t.id})">❌</button>
            </span>
        `;
        listEl.prepend(li); 
    });

    document.getElementById('totalIncome').innerText = formatMoney(totalIncome);
    document.getElementById('totalExpense').innerText = formatMoney(totalExpense);
    document.getElementById('totalBalance').innerText = formatMoney(totalIncome - totalExpense);

    expenseChartInstance = drawChart('expenseChart', expenseData, expenseChartInstance);
    incomeChartInstance = drawChart('incomeChart', incomeData, incomeChartInstance);

    generateAnalysis(expenseData, totalExpense, 'analysisReport', translations[currentLang].expenseHighlight, '#dc3545', translations[currentLang].noExpenseData);
    generateAnalysis(incomeData, totalIncome, 'incomeReport', translations[currentLang].incomeHighlight, '#28a745', translations[currentLang].noIncomeData);
}

// 5. 繪製圖表的通用 Function 
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
                    '#FF9F40', '#E7E9ED', '#8AC926', '#1982C4', '#F15BB5',
                    '#00F5D4', '#9B5DE5', '#FEE440'
                ]
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
}

// 6. 產生分析報告
function generateAnalysis(dataObj, totalAmt, targetId, highlightName, colorHex, emptyMsg) {
    const reportEl = document.getElementById(targetId);
    if (totalAmt === 0 || Object.keys(dataObj).length === 0) {
        reportEl.innerHTML = emptyMsg; 
        return;
    }

    let maxCategory = '';
    let maxAmount = 0;
    let detailsHTML = "<ul style='padding-left: 20px; margin-top: 10px;'>";

    for (const category in dataObj) {
        const amount = parseFloat(dataObj[category].toFixed(2));
        const percentage = Math.round((amount / totalAmt) * 100);
        detailsHTML += `<li style="margin-bottom: 5px; border-left: none; padding: 0; box-shadow: none; background: none;">
                            <strong>${category}</strong>: $${amount} (${percentage}%)
                        </li>`;
        if (amount > maxAmount) {
            maxAmount = amount;
            maxCategory = category;
        }
    }

    const amount = dataObj[category];
    const percentage = Math.round((amount / totalAmt) * 100);
    detailsHTML += `<li style="margin-bottom: 5px; border-left: none; padding: 0; box-shadow: none; background: none;">
                        <strong>${category}</strong>: $${formatMoney(amount)} (${percentage}%)
                    </li>`;

    const textMaxSource = translations[currentLang].maxSource;
    const textTotalAmt = translations[currentLang].totalAmt;
    const textDetailRatio = translations[currentLang].detailRatio;

    reportEl.innerHTML = `
        <div style="font-size: 16px; margin-bottom: 10px;">
            💡 <strong>${highlightName}：</strong> ${textMaxSource}「<span style="color: ${colorHex}; font-weight: bold;">${maxCategory}</span>」，${textTotalAmt} <strong>$${formatMoney(maxAmount)}</strong>！
        </div>
        <div><strong>📊 ${textDetailRatio}：</strong></div>
        ${detailsHTML}
    `;
}

// 7. 單筆刪除
function deleteTransaction(id) {
    if (confirm(translations[currentLang].alertDel)) {
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem('myExpenses', JSON.stringify(transactions));
        updateDashboard();
    }
}

// 8. 清除所有
function clearAllData() {
    if (confirm(translations[currentLang].alertClear)) {
        localStorage.removeItem('myExpenses');
        transactions = [];
        updateDashboard();
    }
}

// 9. 自訂日期顯示
function handleFilterChange() {
    const filterVal = document.getElementById('filterTime').value;
    const customArea = document.getElementById('customDateArea');
    if (filterVal === 'custom') {
        customArea.style.display = 'block'; 
    } else {
        customArea.style.display = 'none';  
    }
    updateDashboard(); 
}

// 10. 應用主題
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

// 11. 切換主題
function toggleTheme() {
    isDarkMode = !isDarkMode; 
    localStorage.setItem('darkMode', isDarkMode); 
    applyTheme();
}

// 12. 讀取並應用儲存的背景圖片
function applyBackground() {
    const savedBg = localStorage.getItem('myBgImage');
    if (savedBg) {
        document.body.style.backgroundImage = `url(${savedBg})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundPosition = 'center';
    } else {
        document.body.style.backgroundImage = 'none';
    }
}

// 13. 處理使用者上傳圖片
function changeBackground(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader(); // 召喚可以讀取檔案的魔法
        reader.onload = function(e) {
            const base64Data = e.target.result; // 將圖片轉成超長字串
            try {
                // 嘗試存入大腦 (LocalStorage)
                localStorage.setItem('myBgImage', base64Data);
                applyBackground(); // 立刻套用背景
            } catch (err) {
                // ⚠️ 防呆機制：LocalStorage 最大只能存 5MB
                alert(translations[currentLang].alertBgSize);
                document.getElementById('bgInput').value = ''; // 清空輸入框
            }
        };
        reader.readAsDataURL(file); // 開始讀取檔案
    }
}

// 14. 清除背景
function clearBackground() {
    localStorage.removeItem('myBgImage'); // 從大腦刪除
    document.getElementById('bgInput').value = ''; // 清空輸入框
    applyBackground(); // 重新套用（這時會變回原本的單色背景）
}

// 15. 金錢格式化小工具 (自動加上千位逗號，並處理好小數點)
function formatMoney(num) {
    return parseFloat(num.toFixed(2)).toLocaleString('en-US');
}

// 16. 英式日期轉換小工具 (把 YYYY-MM-DD 變成 DD/MM/YYYY)
function formatDate(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-'); // 把日期用「-」切開
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`; // 重新排列成 日/月/年
    }
    return dateString;
}

// 網頁一打開時，記得呼叫套用背景
applyBackground();

// 初始化啟動區
applyTheme();
setTransactionType('expense'); // 網頁打開時，確保選單預設狀態是支出
updateDashboard();

