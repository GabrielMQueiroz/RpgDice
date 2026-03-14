// Global Variables
let rollChartInstance = null;
let allHistoryItems = []; // Cache for history items

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
const visualizeDiceTypeSelect = document.getElementById('visualizeDiceType');
const visualizationTitle = document.getElementById('visualizationTitle');

const rollChartElement = document.getElementById('rollChart'); 
const rollChartContext = rollChartElement.getContext('2d'); 

const noChartDataMessage = document.getElementById('noChartDataMessage');
const totalRollsForChart = document.getElementById('totalRollsForChart');
const loadingIndicator = document.getElementById('loadingIndicator');

const messageModal = document.getElementById('messageModal');
const modalTitleEl = document.getElementById('modalTitle'); 
const modalMessageEl = document.getElementById('modalMessage'); 
const modalConfirmButton = document.getElementById('modalConfirmButton');
const modalCancelButton = document.getElementById('modalCancelButton');
let confirmCallback = null;

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
        console.log("Local history cleared.");
    });
}

function updateVisualization() {
    const selectedDiceType = parseInt(visualizeDiceTypeSelect.value);
    const chartType = 'horizontalViolin'; 
    visualizationTitle.textContent = `Roll Distribution (Horizontal Violin Plot)`;

    if (rollChartInstance) {
        rollChartInstance.destroy();
        rollChartInstance = null;
    }

    if (isNaN(selectedDiceType) || allHistoryItems.length === 0) {
        noChartDataMessage.classList.remove('hidden');
        totalRollsForChart.textContent = "Total rolls: 0";
        rollChartElement.style.height = '50px'; 
        return;
    }

    const rollsForType = allHistoryItems
        .filter(item => item.diceType === selectedDiceType)
        .flatMap(item => Array.isArray(item.rolls) ? item.rolls : []);

    if (rollsForType.length === 0) {
        noChartDataMessage.classList.remove('hidden');
        totalRollsForChart.textContent = `Total d${selectedDiceType} rolls: 0`;
        rollChartElement.style.height = '50px';
        return;
    }
    
    rollChartElement.style.height = '200px'; 
    noChartDataMessage.classList.add('hidden');
    totalRollsForChart.textContent = `Total d${selectedDiceType} rolls: ${rollsForType.length}`;

    const plotData = rollsForType; 

    if (!plotData || plotData.length === 0) { 
            noChartDataMessage.classList.remove('hidden');
            return;
    }
    
    rollChartInstance = new Chart(rollChartContext, { 
        type: chartType,
        data: {
            labels: [`d${selectedDiceType} Rolls`], 
            datasets: [{
                label: `Distribution of d${selectedDiceType}`,
                data: [plotData], 
                backgroundColor: 'rgba(129, 140, 248, 0.3)', 
                borderColor: 'rgba(99, 102, 241, 1)',  
                borderWidth: 1,
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false, 
            scales: {
                xAxes: [{ 
                    ticks: {
                        fontColor: '#9ca3af', 
                        beginAtZero: false, 
                        min: 1, 
                        max: selectedDiceType, 
                        stepSize: selectedDiceType > 20 ? Math.floor(selectedDiceType / 10) : 1 
                    },
                    gridLines: { 
                        color: '#374151' 
                    },
                    scaleLabel: { 
                        display: true,
                        labelString: 'Roll Value', 
                        fontColor: '#e2e8f0'
                    }
                }],
                yAxes: [{ 
                    ticks: {
                        fontColor: '#9ca3af' 
                    },
                    gridLines: {
                        display: false 
                    },
                    scaleLabel: {
                        display: false, 
                    }
                }]
            },
            legend: {
                labels: {
                    fontColor: '#e2e8f0' 
                }
            },
            tooltips: {}
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

// --- Initial Setup ---
numDiceInput.addEventListener('input', updateRollButtonLabel);
diceTypeInput.addEventListener('input', updateRollButtonLabel);

numDiceInput.addEventListener('keypress', handleInputEnter);
diceTypeInput.addEventListener('keypress', handleInputEnter);

rollButton.addEventListener('click', handleRoll);
clearHistoryButton.addEventListener('click', clearHistory);
visualizeDiceTypeSelect.addEventListener('change', updateVisualization);

// --- App Initialization ---
function main() {
    updateRollButtonLabel();
    loadHistory(); 
    hideLoading(); 
}

main();