// ============================================================================
// THINGSPEAK CONFIGURATION
// ============================================================================
const CHANNEL_ID = '3175373';
const READ_API_KEY = 'ZI1JL5YU6DRGVBOS';
const THINGSPEAK_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=20`;

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================
const OCCUPANCY_HISTORY_KEY = 'smartpark_occupancy_history';
const MAX_HISTORY_POINTS = 800; // ~24 hours with 2-min intervals
const HISTORY_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// ============================================================================
// CHART INSTANCES
// ============================================================================
let occupancyChart;
let gasChart;

// ============================================================================
// OCCUPANCY HISTORY MANAGEMENT (localStorage)
// ============================================================================

/**
 * Get all occupancy history from localStorage
 */
function getOccupancyHistory() {
    try {
        const data = localStorage.getItem(OCCUPANCY_HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading occupancy history:', error);
        return [];
    }
}

/**
 * Save occupancy history to localStorage
 */
function saveOccupancyHistory(history) {
    try {
        localStorage.setItem(OCCUPANCY_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        console.error('Error saving occupancy history:', error);
    }
}

/**
 * Add new occupancy record and prune old data
 */
function addOccupancyRecord(occupancyPercent) {
    let history = getOccupancyHistory();
    const now = new Date();
    
    // Create new record
    const record = {
        timestamp: now.toISOString(),
        occupancy: occupancyPercent,
        time: now.getTime()
    };
    
    // Add record
    history.push(record);
    
    // Prune old records (older than 24 hours)
    const cutoffTime = now.getTime() - HISTORY_RETENTION_MS;
    history = history.filter(r => r.time >= cutoffTime);
    
    // Limit to max points
    if (history.length > MAX_HISTORY_POINTS) {
        history = history.slice(-MAX_HISTORY_POINTS);
    }
    
    saveOccupancyHistory(history);
    return history;
}

/**
 * Format timestamp for chart label (12-hour format)
 */
function formatTimeLabel(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// ============================================================================
// CHART INITIALIZATION & UPDATES
// ============================================================================

/**
 * Initialize Occupancy Chart with improved styling
 */
function initChart() {
    const ctx = document.getElementById('occupancyChart').getContext('2d');
    
    // Create gradient for fill
    const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, 'rgba(255, 78, 198, 0.3)');
    gradientFill.addColorStop(1, 'rgba(255, 78, 198, 0)');
    
    occupancyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Occupancy Rate (%)',
                data: [],
                borderColor: '#ff4ec6', // Neon pink/magenta
                backgroundColor: gradientFill,
                borderWidth: 3,
                tension: 0.4, // Smooth curve
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#ff4ec6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                segment: {
                    borderColor: ctx => {
                        // Gradient effect on line
                        return '#ff4ec6';
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#f8fafc',
                        font: {
                            size: 12,
                            family: 'Poppins',
                            weight: '600'
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#ff4ec6',
                    titleFont: { size: 13, weight: 'bold' },
                    bodyColor: '#f8fafc',
                    borderColor: '#ff4ec6',
                    borderWidth: 2,
                    padding: 12,
                    displayColors: true,
                    boxPadding: 8,
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + '%';
                        }
                    }
                },
                filler: {
                    propagate: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 11,
                            family: 'Poppins'
                        },
                        stepSize: 20,
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false,
                        lineWidth: 1
                    }
                },
                x: {
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 10,
                            family: 'Poppins'
                        },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.05)',
                        drawBorder: false
                    }
                }
            }
        }
    });
}

/**
 * Update occupancy chart with history data (smart downsampling for long history)
 */
function updateOccupancyChart() {
    let history = getOccupancyHistory();
    
    if (history.length === 0) return;
    
    // Downsample if too many points (for performance)
    let displayData = history;
    if (history.length > 100) {
        const step = Math.ceil(history.length / 100);
        displayData = history.filter((_, i) => i % step === 0);
    }
    
    const labels = displayData.map(r => formatTimeLabel(r.timestamp));
    const occupancyData = displayData.map(r => r.occupancy);
    
    // Update chart with fade animation
    occupancyChart.data.labels = labels;
    occupancyChart.data.datasets[0].data = occupancyData;
    occupancyChart.update('none');
}


/**
 * Initialize Gas Chart
 */
function initGasChart() {
    const ctx = document.getElementById('gasChart').getContext('2d');
    
    // Create gradient for line
    const gradient = ctx.createLinearGradient(0, 0, 600, 0);
    gradient.addColorStop(0, '#10b981');
    gradient.addColorStop(0.5, '#f59e0b');
    gradient.addColorStop(1, '#ef4444');
    
    gasChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Gas (PPM)',
                data: [],
                borderColor: gradient,
                backgroundColor: 'rgba(16,185,129,0.06)',
                borderWidth: 3,
                tension: 0.25,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30,41,59,0.95)',
                    titleColor: '#f8fafc',
                    bodyColor: '#f8fafc'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 500,
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(148,163,184,0.08)' }
                },
                x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
            }
        }
    });
}

// ============================================================================
// GAS SENSOR MANAGEMENT
// ============================================================================

/**
 * Update gas level display and status
 */
function updateGasLevel(ppm) {
    const gasPPMEl = document.getElementById('gasPPM');
    const gasBox = document.getElementById('gasStatBox');
    const gaugeValue = document.getElementById('gaugeValue');
    const gaugeProgress = document.getElementById('gaugeProgress');
    const gaugeStatus = document.getElementById('gaugeStatus');

    gasPPMEl.textContent = `${ppm} PPM`;
    gaugeValue.textContent = `${ppm} PPM`;

    if (ppm <= 100) {
        gasBox.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        gaugeProgress.setAttribute('stroke', '#10b981');
        gaugeStatus.textContent = 'Safe';
    } else if (ppm <= 300) {
        gasBox.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        gaugeProgress.setAttribute('stroke', '#f59e0b');
        gaugeStatus.textContent = 'Caution';
    } else {
        gasBox.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        gaugeProgress.setAttribute('stroke', '#ef4444');
        gaugeStatus.textContent = 'Danger';
    }

    const max = 500;
    const pct = Math.min(ppm / max, 1);
    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const dash = circumference * pct;
    gaugeProgress.setAttribute('stroke-dasharray', `${dash} ${circumference}`);

    if (ppm > 300) {
        showGasAlert();
    } else {
        hideGasAlert();
    }
}

/**
 * Show gas alert banner
 */
function showGasAlert() {
    const banner = document.getElementById('gasAlert');
    if (!banner) return;
    if (!banner.classList.contains('show')) {
        banner.classList.add('show');
        banner.style.display = 'block';
    }
}

/**
 * Hide gas alert banner
 */
function hideGasAlert() {
    const banner = document.getElementById('gasAlert');
    if (!banner) return;
    banner.classList.remove('show');
    banner.style.display = 'none';
}

// ============================================================================
// DASHBOARD DATA UPDATES
// ============================================================================

/**
 * Fetch and update all dashboard data from ThingSpeak
 */
async function updateDashboard() {
    try {
        const response = await fetch(THINGSPEAK_URL);
        const data = await response.json();
        
        if (data.feeds && data.feeds.length > 0) {
            const latestData = data.feeds[data.feeds.length - 1];
            
            // Parse slot data
            const slot1 = parseInt(latestData.field1) || 0;
            const slot2 = parseInt(latestData.field2) || 0;
            const slot3 = parseInt(latestData.field3) || 0;
            
            // Parse gas data
            const gasRaw = latestData.field4;
            const gasPPM = (gasRaw === null || gasRaw === undefined || gasRaw === '') ? null : parseFloat(gasRaw);
            
            const totalSlots = 3;
            const occupiedSlots = slot1 + slot2 + slot3;
            const availableSlots = totalSlots - occupiedSlots;
            const occupancyRate = Math.round((occupiedSlots / totalSlots) * 100);
            
            // Update stats
            animateValue('totalSlots', 0, totalSlots, 500);
            animateValue('availableSlots', 0, availableSlots, 500);
            animateValue('occupiedSlots', 0, occupiedSlots, 500);
            document.getElementById('occupancyRate').textContent = occupancyRate + '%';
            
            // Update slot cards
            updateSlotCard('slot1', slot1);
            updateSlotCard('slot2', slot2);
            updateSlotCard('slot3', slot3);
            
            // Add occupancy record to history and update chart
            addOccupancyRecord(occupancyRate);
            updateOccupancyChart();
            
            // Update gas sensor
            if (gasPPM !== null && !isNaN(gasPPM)) {
                updateGasLevel(gasPPM);
                // Add to gas chart - add first data point or if value changed
                if (gasChart) {
                    const lastVal = gasChart.data.datasets[0].data.length > 0 
                        ? gasChart.data.datasets[0].data[gasChart.data.datasets[0].data.length - 1] 
                        : null;
                    
                    if (lastVal === null || lastVal !== gasPPM) {
                        gasChart.data.labels.push(new Date().toLocaleTimeString());
                        gasChart.data.datasets[0].data.push(gasPPM);
                        if (gasChart.data.datasets[0].data.length > 20) {
                            gasChart.data.datasets[0].data.shift();
                            gasChart.data.labels.shift();
                        }
                        gasChart.update();
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        document.getElementById('availableSlots').textContent = 'N/A';
        document.getElementById('occupiedSlots').textContent = 'N/A';
        document.getElementById('occupancyRate').textContent = 'N/A';
    }
}

/**
 * Animate number counter
 */
function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 16);
}

/**
 * Update slot card status
 */
function updateSlotCard(slotId, status) {
    const slotCard = document.getElementById(slotId);
    const statusElement = slotCard.querySelector('.status');
    
    slotCard.classList.remove('free', 'occupied');
    
    if (status === 0) {
        slotCard.classList.add('free');
        statusElement.textContent = '✓ Available';
    } else {
        slotCard.classList.add('occupied');
        statusElement.textContent = '✗ Occupied';
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize dashboard on page load
 */
window.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard initialized');
    
    // Initialize charts
    initChart();
    initGasChart();
    
    // Load and display stored occupancy history
    updateOccupancyChart();
    
    // Fetch latest data from ThingSpeak
    updateDashboard();
    
    // Set up auto-refresh (every 20 seconds to match Arduino upload rate)
    setInterval(updateDashboard, 20000);
    
    // Setup gas alert close button
    const closeBtn = document.getElementById('gasAlertClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideGasAlert);
    }
    
    console.log('Dashboard loaded with occupancy history support');
});
