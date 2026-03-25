// 1. 啟動 LocalStorage
let transactions = JSON.parse(localStorage.getItem('myExpenses')) || [];

// 【亮點】準備兩個獨立的變數來存放圖表，避免重疊衝突
let expenseChartInstance = null; 
let incomeChartInstance = null;  

// 2. 設定今日預設日期
document.getElementById('inputDate').valueAsDate = new Date();

// 3. 新增交易的主要 Function
function addTransaction() {
    const date = document.getElementById('inputDate').value;
    const type = document.getElementById('inputType').value;
    const account = document.getElementById('inputAccount').value;
    const category = document.getElementById('inputCategory').value;
    const amount = parseFloat(document.getElementById('inputAmount').value);

    if (!date || isNaN(amount) || amount <= 0) {
        alert("請填寫正確的日期與金額！");
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

// 4. 更新畫面的 Function
function updateDashboard() {
    let totalIncome = 0;
    let totalExpense = 0;
    const listEl = document.getElementById('transactionList');
    listEl.innerHTML = ''; 

    // 準備兩個空箱子，分別收集支出與收入的數據
    const expenseData = {};
    const incomeData = {}; 

    transactions.forEach(t => {
        if (t.type === 'income' || t.type === 'repay') {
            totalIncome += t.amount;
            
            // 收集收入資料 (你的收入選項是 Mum, Salary 等，這些存在 account 裡面)
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
    generateAnalysis(expenseData, totalExpense, 'analysisReport', '支出', '#dc3545');
    generateAnalysis(incomeData, totalIncome, 'incomeReport', '收入', '#28a745');
}

// 5. 繪製圖表的通用 Function (升級版)
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

// 6. 產生分析報告的通用 Function (升級版)
function generateAnalysis(dataObj, totalAmt, targetId, typeName, colorHex) {
    const reportEl = document.getElementById(targetId);
    if (totalAmt === 0 || Object.keys(dataObj).length === 0) {
        reportEl.innerHTML = `目前尚無${typeName}資料可供分析 💸`;
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

    reportEl.innerHTML = `
        <div style="font-size: 16px; margin-bottom: 10px;">
            💡 <strong>${typeName}重點：</strong> 最大的${typeName}來源是「<span style="color: ${colorHex}; font-weight: bold;">${maxCategory}</span>」，總共 <strong>$${maxAmount}</strong>！
        </div>
        <div><strong>📊 各項目詳細佔比：</strong></div>
        ${detailsHTML}
    `;
}

// 7. 單筆刪除的 Function
function deleteTransaction(id) {
    if (confirm("確定要刪除這筆單一紀錄嗎？")) {
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem('myExpenses', JSON.stringify(transactions));
        updateDashboard();
    }
}

// 8. 清除所有紀錄的 Function
function clearAllData() {
    if (confirm("確定要清除所有的記帳紀錄嗎？這個動作無法復原喔！")) {
        localStorage.removeItem('myExpenses');
        transactions = [];
        updateDashboard();
    }
}

// 網頁一打開時立刻更新畫面
updateDashboard();