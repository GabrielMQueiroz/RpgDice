// --- Global Variables ---
let rollChartInstance = null;
let allHistoryItems = [];

// Tab logic
let nexusInitialized = false;

// DOM Elements: Dice Roller
const numDiceInput = document.getElementById('numDice');
const diceTypeInput = document.getElementById('diceType');
const rollButton = document.getElementById('rollButton');
const rollButtonLabel = document.getElementById('rollButtonLabel');
const currentRollResultDiv = document.getElementById('currentRollResult');
const rollTotalSpan = document.getElementById('rollTotal');
const individualRollsSpan = document.getElementById('individualRolls');
const rollHistoryDiv = document.getElementById('rollHistory');
const noHistoryMessage = document.getElementById('noHistoryMessage');
const clearHistoryButton = document.getElementById('clearHistoryButton');
const historyCountSpan = document.getElementById('historyCount');
const visualizeDiceTypeSelect = document.getElementById('visualizeDiceType');
const visualizationTitle = document.getElementById('visualizationTitle');
const rollChartElement = document.getElementById('rollChart'); 
const rollChartContext = rollChartElement ? rollChartElement.getContext('2d') : null; 
const noChartDataMessage = document.getElementById('noChartDataMessage');
const totalRollsForChart = document.getElementById('totalRollsForChart');

// DOM Elements: Modals and Loading
const loadingIndicator = document.getElementById('loadingIndicator');
const messageModal = document.getElementById('messageModal');
const modalTitleEl = document.getElementById('modalTitle'); 
const modalMessageEl = document.getElementById('modalMessage'); 
const modalConfirmButton = document.getElementById('modalConfirmButton');
const modalCancelButton = document.getElementById('modalCancelButton');
let confirmCallback = null;

// --- Tab Switching Logic ---
function switchTab(tabId) {
    const tabs = ['roller', 'nexus'];
    tabs.forEach(t => {
        document.getElementById(`tab-${t}`).classList.add('hidden');
        document.getElementById(`tab-${t}`).classList.remove('active');
        
        const btn = document.getElementById(`tab-btn-${t}`);
        if (t === tabId) {
            btn.classList.add('border-indigo-500', 'text-indigo-400');
            btn.classList.remove('border-transparent', 'text-gray-400');
        } else {
            btn.classList.remove('border-indigo-500', 'text-indigo-400');
            btn.classList.add('border-transparent', 'text-gray-400');
        }
    });

    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    document.getElementById(`tab-${tabId}`).classList.add('active');

    // Lazy init Nexus
    if (tabId === 'nexus' && !nexusInitialized) {
        initNexus();
        nexusInitialized = true;
    }
}


// --- Utility Functions (Modal and Loading) ---
function showLoading(message = "Loading...") { 
    loadingIndicator.textContent = message;
    loadingIndicator.classList.remove('hidden');
}

function hideLoading() {
    loadingIndicator.classList.add('hidden');
}

function showModal(title, message, isConfirm = false, onConfirm = null) {
    modalTitleEl.textContent = title;
    modalMessageEl.textContent = message;
    modalCancelButton.classList.toggle('hidden', !isConfirm);
    confirmCallback = isConfirm ? onConfirm : null;
    
    messageModal.classList.remove('hidden', 'opacity-0');
    modalConfirmButton.onclick = () => {
        hideModal();
        if (isConfirm && typeof confirmCallback === 'function') {
            confirmCallback();
        }
    };
    modalCancelButton.onclick = hideModal;
}

function hideModal() {
    messageModal.classList.add('opacity-0');
    setTimeout(() => messageModal.classList.add('hidden'), 300);
}

// --- Dice Rolling Logic ---
function rollDice(numDice, diceType) {
    const rolls = [];
    let total = 0;
    for (let i = 0; i < numDice; i++) {
        rolls.push(Math.floor(Math.random() * diceType) + 1);
        total += rolls[i];
    }
    return { rolls, total };
}

// --- Local Storage History Management ---
const HISTORY_KEY = 'diceRollHistory';

function getLocalHistory() {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    if (historyJson) {
        try {
            return JSON.parse(historyJson);
        } catch (e) {
            console.error("Error parsing local history:", e);
            return []; 
        }
    }
    return [];
}

function saveLocalHistory(historyItems) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(historyItems));
    } catch (e) {
        console.error("Error saving to local history:", e);
        showModal("Storage Error", "Could not save history. Your browser's local storage might be full or disabled.");
    }
}

async function handleRoll() {
    const numDice = parseInt(numDiceInput.value);
    const diceType = parseInt(diceTypeInput.value);

    if (isNaN(numDice) || numDice < 1 || numDice > 1000) {
        showModal("Invalid Input", "Number of dice must be between 1 and 1000.");
        numDiceInput.focus();
        return;
    }
    if (isNaN(diceType) || diceType < 2) {
        showModal("Invalid Input", "Type of dice (sides) must be 2 or greater.");
        diceTypeInput.focus();
        return;
    }

    const { rolls, total } = rollDice(numDice, diceType);
    
    // Add brief animation class
    rollTotalSpan.classList.remove('animate-bounce');
    void rollTotalSpan.offsetWidth; // trigger reflow
    rollTotalSpan.classList.add('animate-bounce');
    
    currentRollResultDiv.classList.remove('hidden');
    rollTotalSpan.textContent = total;
    individualRollsSpan.textContent = rolls.join(', ');

    // Save to Local Storage
    const newRoll = {
        numDice,
        diceType,
        rolls,
        total,
        timestamp: new Date().toISOString() 
    };

    const currentHistory = getLocalHistory();
    currentHistory.push(newRoll);
    saveLocalHistory(currentHistory);
    
    loadHistory(); // Reload and display updated history
}

function displayHistory(historyItems) {
    allHistoryItems = historyItems; // Update cache
    rollHistoryDiv.innerHTML = '';
    const uniqueDiceTypes = new Set();

    if (historyCountSpan) {
        historyCountSpan.textContent = historyItems.length > 0 ? `(${historyItems.length} rolls)` : '';
    }

    if (historyItems.length === 0) {
        noHistoryMessage.classList.remove('hidden');
        visualizeDiceTypeSelect.innerHTML = '<option value="">Select Dice Type</option>';
        updateVisualization();
        return;
    }
    noHistoryMessage.classList.add('hidden');

    // Sort by timestamp descending (newest first).
    historyItems.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    historyItems.forEach(item => {
        const historyElement = document.createElement('div');
        historyElement.classList.add('history-item');
        const date = new Date(item.timestamp).toLocaleString(); 
        const rollsString = Array.isArray(item.rolls) ? item.rolls.join(', ') : 'N/A';
        historyElement.innerHTML = `
            <span>
                <strong class="text-indigo-400">${item.numDice}d${item.diceType}</strong> = ${item.total}
                <span class="text-xs text-gray-500 ml-1">(${rollsString})</span>
            </span>
            <span class="text-xs text-gray-500">${date}</span>`;
        rollHistoryDiv.appendChild(historyElement);
        uniqueDiceTypes.add(item.diceType);
    });

    const currentSelectedVizType = visualizeDiceTypeSelect.value;
    visualizeDiceTypeSelect.innerHTML = '<option value="">Select Dice Type</option>';
    Array.from(uniqueDiceTypes).sort((a, b) => a - b).forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = `d${type}`;
        visualizeDiceTypeSelect.appendChild(option);
    });

    if (uniqueDiceTypes.has(parseInt(currentSelectedVizType))) {
        visualizeDiceTypeSelect.value = currentSelectedVizType;
    } else if (visualizeDiceTypeSelect.options.length > 1) {
        visualizeDiceTypeSelect.value = visualizeDiceTypeSelect.options[1].value;
    }
    updateVisualization();
}

function loadHistory() {
    const localHistory = getLocalHistory();
    displayHistory(localHistory);
}

function clearHistory() {
    showModal("Confirm Clear", "Are you sure you want to delete all local roll history? This action cannot be undone.", true, () => {
        localStorage.removeItem(HISTORY_KEY);
        allHistoryItems = []; // Clear cache
        displayHistory([]); // Update UI to show empty history
        visualizeDiceTypeSelect.value = ""; // Reset visualization dropdown
        updateVisualization(); // Update/clear chart
    });
}

function updateVisualization() {
    const selectedDiceType = parseInt(visualizeDiceTypeSelect.value);
    visualizationTitle.textContent = `Roll Distribution (Histogram)`;

    if (rollChartInstance) {
        rollChartInstance.destroy();
        rollChartInstance = null;
    }

    if (isNaN(selectedDiceType) || allHistoryItems.length === 0) {
        noChartDataMessage.classList.remove('hidden');
        totalRollsForChart.textContent = "Total rolls: 0";
        rollChartElement.style.display = 'none'; 
        return;
    }

    const rollsForType = allHistoryItems
        .filter(item => item.diceType === selectedDiceType)
        .flatMap(item => Array.isArray(item.rolls) ? item.rolls : []);

    if (rollsForType.length === 0) {
        noChartDataMessage.classList.remove('hidden');
        totalRollsForChart.textContent = `Total d${selectedDiceType} rolls: 0`;
        rollChartElement.style.display = 'none';
        return;
    }
    
    rollChartElement.style.display = 'block'; 
    noChartDataMessage.classList.add('hidden');
    totalRollsForChart.textContent = `Total d${selectedDiceType} rolls: ${rollsForType.length}`;

    // Compute frequencies for histogram
    const frequencies = {};
    for (let i = 1; i <= selectedDiceType; i++) {
        frequencies[i] = 0;
    }
    rollsForType.forEach(val => {
        if (frequencies[val] !== undefined) frequencies[val]++;
    });
    
    const labels = Object.keys(frequencies);
    const data = Object.values(frequencies);

    // Global defaults for dark mode chart
    Chart.defaults.color = '#9ca3af';
    Chart.defaults.font.family = 'Inter, ui-sans-serif, system-ui, sans-serif';

    rollChartInstance = new Chart(rollChartContext, { 
        type: 'bar',
        data: {
            labels: labels, 
            datasets: [{
                label: `Frequency of d${selectedDiceType} rolls`,
                data: data, 
                backgroundColor: 'rgba(99, 102, 241, 0.5)', 
                borderColor: 'rgba(99, 102, 241, 1)',  
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false, 
            scales: {
                x: { 
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    title: { 
                        display: true,
                        text: 'Roll Value', 
                        color: '#e2e8f0'
                    }
                },
                y: { 
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    title: {
                        display: true,
                        text: 'Frequency',
                        color: '#e2e8f0'
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: 'rgba(17, 24, 39, 0.9)' }
            }
        }
    });
}

function updateRollButtonLabel() {
    const num = numDiceInput.value || 'N';
    const type = diceTypeInput.value || 'D';
    rollButtonLabel.textContent = `${num}d${type}`;
}

function handleInputEnter(event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
        event.preventDefault(); 
        rollButton.click();
    }
}

// Setup listeners for Dice Roller
if (numDiceInput && diceTypeInput && rollButton) {
    numDiceInput.addEventListener('input', updateRollButtonLabel);
    diceTypeInput.addEventListener('input', updateRollButtonLabel);
    numDiceInput.addEventListener('keypress', handleInputEnter);
    diceTypeInput.addEventListener('keypress', handleInputEnter);
    rollButton.addEventListener('click', handleRoll);
    clearHistoryButton.addEventListener('click', clearHistory);
    visualizeDiceTypeSelect.addEventListener('change', updateVisualization);
}


// ==========================================
// NEXUS DE ENTIDADES LOGIC
// ==========================================

const rawData = [
    {
        id: 'gabriel', name: 'Gabriel', class: 'Shou-Gao I*', level: 600, color: '#f59e0b', // Amber
        attributes: { Força: 30, Constituição: 30, Destreza: 30, Sorte: 15, Agilidade: 30, Sequência: 30, Inteligência: 90, Magia: 60, Autoridade: 60, Defesa: 30, Resistência: 30, Percepção: 30, Dedução: 30, Furtividade: 30, Presença: 60, Carisma: 30, Vontade: 30, Manejo: 30, Potencial: 60, Permissividade: 100, Naturalidade: 10, Ofício: 15, Crítico: 30, Sintonia: 1 }
    },
    {
        id: 'normando', name: 'Normando', class: 'Protorieven Ilimitado I', level: 700, color: '#8b5cf6', // Violet
        attributes: { Força: 1, Constituição: 1, Destreza: 1, Sorte: 10, Agilidade: 3, Sequência: 3, Inteligência: 1, Magia: 1, Autoridade: 70, Defesa: 2, Resistência: 1, Percepção: 1, Dedução: 2, Furtividade: 1, Presença: 3, Carisma: 5, Vontade: 30, Manejo: 1, Potencial: 1, Permissividade: 100, Naturalidade: 7, Ofício: 2, Crítico: 20, Sintonia: 0 }
    },
    {
        id: 'alexandre', name: 'Alexandre', class: 'Aprendiz das Sombras II', level: 500, color: '#9ca3af', // Gray
        attributes: { Força: 15, Constituição: 15, Destreza: 41, Sorte: 10, Agilidade: 20, Sequência: 25, Inteligência: 27, Magia: 18, Autoridade: 50, Defesa: 30, Resistência: 15, Percepção: 32, Dedução: 32, Furtividade: 0, Presença: 0, Carisma: 41, Vontade: 20, Manejo: 20, Potencial: 18, Permissividade: 65, Naturalidade: 1, Ofício: 4, Crítico: 20, Sintonia: 0 }
    },
    {
        id: 'miguel', name: 'Miguel', class: 'Artífice Cromático II', level: 400, color: '#3b82f6', // Blue
        attributes: { Força: 90, Constituição: 116, Destreza: 61, Sorte: 5, Agilidade: 98, Sequência: 12, Inteligência: 30, Magia: 135, Autoridade: 0, Defesa: 87, Resistência: 86, Percepção: 60, Dedução: 28, Furtividade: -30, Presença: 90, Carisma: 16, Vontade: 92, Manejo: 18, Potencial: 135, Permissividade: 0, Naturalidade: 3, Ofício: 3, Crítico: 15, Sintonia: 0 }
    },
    {
        id: 'arfinis', name: 'Arfinis', class: 'Labirinto de Julveniiri II', level: 250, color: '#10b981', // Emerald
        attributes: { Força: 7, Constituição: 14, Destreza: 15, Sorte: 8, Agilidade: 10, Sequência: 14, Inteligência: 17, Magia: 28, Autoridade: 0, Defesa: 14, Resistência: 7, Percepção: 19, Dedução: 22, Furtividade: 8, Presença: 18, Carisma: 13, Vontade: 20, Manejo: 7, Potencial: 28, Permissividade: 0, Naturalidade: 20, Ofício: 4, Crítico: 9, Sintonia: 0 }
    },
    {
        id: 'veniiri', name: 'Veniiri', class: 'Labirinto de Julveniiri II', level: 150, color: '#14b8a6', // Teal
        attributes: { Força: 18, Constituição: 12, Destreza: 14, Sorte: 9, Agilidade: 18, Sequência: 16, Inteligência: 10, Magia: 12, Autoridade: 0, Defesa: 12, Resistência: 12, Percepção: 13, Dedução: 13, Furtividade: 15, Presença: 7, Carisma: 14, Vontade: 8, Manejo: 5, Potencial: 12, Permissividade: 0, Naturalidade: 8, Ofício: 1, Crítico: 8, Sintonia: 0 }
    },
    {
        id: 'victor', name: 'Victor', class: 'Desbravador Celeste I', level: 1000, color: '#ef4444', // Red
        attributes: { Força: 64, Constituição: 75, Destreza: 64, Sorte: 9, Agilidade: 82, Sequência: 90, Inteligência: 30, Magia: 0, Autoridade: 100, Defesa: 82, Resistência: 75, Percepção: 30, Dedução: 25, Furtividade: 20, Presença: 30, Carisma: 30, Vontade: 30, Manejo: 0, Potencial: 0, Permissividade: 85, Naturalidade: 1, Ofício: 1, Crítico: 15, Sintonia: 0 }
    },
    {
        id: 'iza', name: 'Iza', class: 'Exploradora I', level: 38, color: '#ec4899', // Pink
        attributes: { Força: 8, Constituição: 4, Destreza: 11, Sorte: 3, Agilidade: 9, Sequência: 7, Inteligência: 9, Magia: 12, Autoridade: 0, Defesa: 7, Resistência: 5, Percepção: 8, Dedução: 6, Furtividade: 10, Presença: 4, Carisma: 6, Vontade: 8, Manejo: 6, Potencial: 9, Permissividade: 0, Naturalidade: 4, Ofício: 1, Crítico: 7, Sintonia: 0 }
    }
];

const attributeCategories = {
    "Físico": ['Força', 'Constituição', 'Destreza', 'Agilidade', 'Defesa', 'Resistência'],
    "Mental/Mágico": ['Inteligência', 'Magia', 'Percepção', 'Dedução', 'Vontade', 'Sintonia'],
    "Social/Infl.": ['Autoridade', 'Presença', 'Carisma', 'Permissividade'],
    "Combate": ['Sequência', 'Furtividade', 'Manejo', 'Potencial', 'Crítico'],
    "Outros": ['Sorte', 'Naturalidade', 'Ofício']
};
const allAttributes = Object.values(attributeCategories).flat();

let activeCharacters = rawData.map(c => c.id);
let activeCategory = "Físico";
let radarChartInstance = null;
let barChartInstance = null;

function getValueColorClass(val) {
    if (val >= 80) return 'text-yellow-400 font-bold drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]';
    if (val >= 50) return 'text-purple-400 font-semibold';
    if (val >= 20) return 'text-blue-400';
    if (val >= 10) return 'text-green-400';
    if (val < 0) return 'text-red-500 font-semibold';
    return 'text-gray-400';
}

function initNexus() {
    renderToggles();
    renderCategoryFilters();
    updateDashboard();
}

function toggleCharacter(id) {
    if (activeCharacters.includes(id)) {
        if (activeCharacters.length > 1) {
            activeCharacters = activeCharacters.filter(cId => cId !== id);
        }
    } else {
        activeCharacters.push(id);
    }
    renderToggles();
    updateDashboard();
}

function setCategory(cat) {
    activeCategory = cat;
    renderCategoryFilters();
    updateRadarChart();
}

function renderToggles() {
    const container = document.getElementById('character-toggles');
    if (!container) return;
    container.innerHTML = '';
    rawData.forEach(char => {
        const isActive = activeCharacters.includes(char.id);
        const btn = document.createElement('button');
        btn.className = `px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border border-transparent ${
            isActive ? 'opacity-100 shadow-lg scale-105' : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-80'
        }`;
        btn.style.backgroundColor = isActive ? char.color + '40' : '#374151';
        btn.style.borderColor = isActive ? char.color : 'transparent';
        btn.style.color = isActive ? '#fff' : '#9ca3af';
        
        btn.innerHTML = `<span style="color: ${char.color}" class="mr-2">●</span>${char.name}`;
        btn.onclick = () => toggleCharacter(char.id);
        container.appendChild(btn);
    });
}

function renderCategoryFilters() {
    const container = document.getElementById('category-filters');
    if (!container) return;
    container.innerHTML = '';
    
    const allCats = ["Todos", ...Object.keys(attributeCategories)];
    
    allCats.forEach(cat => {
        const isActive = activeCategory === cat;
        const btn = document.createElement('button');
        btn.className = `px-3 py-1 rounded-md text-xs transition-colors border ${
            isActive ? 'bg-gray-700 border-gray-500 text-white shadow-inner' : 'bg-transparent border-gray-700 text-gray-400 hover:text-white'
        }`;
        btn.innerText = cat;
        btn.onclick = () => setCategory(cat);
        container.appendChild(btn);
    });
}

function renderCards() {
    const container = document.getElementById('character-cards');
    if (!container) return;
    container.innerHTML = '';
    
    const activeData = rawData.filter(c => activeCharacters.includes(c.id));
    activeData.forEach(char => {
        const card = document.createElement('div');
        card.className = 'glass-panel rounded-xl p-3 flex flex-col justify-center items-center text-center border-t-4';
        card.style.borderTopColor = char.color;
        
        card.innerHTML = `
            <div class="text-xs text-gray-400 truncate w-full" title="${char.class}">${char.class}</div>
            <div class="font-bold text-md text-white mt-1">${char.name}</div>
            <div class="mt-2 px-2 py-1 bg-gray-800 rounded-md flex flex-col items-center border border-gray-700 w-full">
                <span class="text-[10px] text-gray-500 uppercase">Level</span>
                <span class="font-bold text-lg" style="color: ${char.color}">${char.level}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

function updateRadarChart() {
    const activeData = rawData.filter(c => activeCharacters.includes(c.id));
    const labels = activeCategory === "Todos" ? allAttributes : attributeCategories[activeCategory];
    
    const datasets = activeData.map(char => {
        return {
            label: char.name,
            data: labels.map(attr => char.attributes[attr] || 0),
            backgroundColor: char.color + '40', // 40% opacity
            borderColor: char.color,
            pointBackgroundColor: char.color,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: char.color,
            borderWidth: 2,
        };
    });

    const canvas = document.getElementById('radarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (radarChartInstance) {
        radarChartInstance.destroy();
    }

    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: {
                        font: { size: 11, weight: '600' },
                        color: '#d1d5db'
                    },
                    ticks: {
                        display: false,
                        backdropColor: 'transparent'
                    }
                }
            },
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } },
                tooltip: { backgroundColor: 'rgba(17, 24, 39, 0.9)', titleColor: '#fff', bodyColor: '#ccc', padding: 10 }
            }
        }
    });
}

function updateBarChart() {
    const activeData = rawData.filter(c => activeCharacters.includes(c.id));
    const sortedData = [...activeData].sort((a, b) => b.level - a.level);

    const canvas = document.getElementById('barChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (barChartInstance) {
        barChartInstance.destroy();
    }

    barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(c => c.name),
            datasets: [{
                label: 'Nível',
                data: sortedData.map(c => c.level),
                backgroundColor: sortedData.map(c => c.color + 'CC'),
                borderColor: sortedData.map(c => c.color),
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', 
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                y: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: 'rgba(17, 24, 39, 0.9)' }
            }
        }
    });
}

function renderTable() {
    const activeData = rawData.filter(c => activeCharacters.includes(c.id));
    
    const thead = document.getElementById('table-head');
    if (!thead) return;
    let headHTML = '<tr><th class="px-4 py-3 bg-gray-800/50 rounded-tl-lg font-bold">Atributo</th>';
    activeData.forEach(char => {
        headHTML += `<th class="px-4 py-3 text-center whitespace-nowrap"><span style="color: ${char.color}">●</span> ${char.name}</th>`;
    });
    headHTML += '</tr>';
    thead.innerHTML = headHTML;

    const tbody = document.getElementById('table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    allAttributes.forEach(attr => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-800/50 transition-colors";
        
        let rowHTML = `<td class="px-4 py-3 font-medium text-gray-300 border-r border-gray-800">${attr}</td>`;
        
        activeData.forEach(char => {
            const val = char.attributes[attr] || 0;
            const colorClass = getValueColorClass(val);
            rowHTML += `<td class="px-4 py-3 text-center ${colorClass}">${val}</td>`;
        });
        
        tr.innerHTML = rowHTML;
        tbody.appendChild(tr);
    });
}

function updateDashboard() {
    renderCards();
    updateRadarChart();
    updateBarChart();
    renderTable();
}


// --- App Initialization ---
function main() {
    if (rollButtonLabel) updateRollButtonLabel();
    loadHistory(); 
    hideLoading(); 
}

// Ensure the code runs when the document is ready
document.addEventListener("DOMContentLoaded", () => {
    main();
});