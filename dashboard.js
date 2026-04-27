// ============================================================================
// THINGSPEAK CONFIGURATION (Adv_IOT Channel)
// ============================================================================
const CHANNEL_ID = '3358675';
const READ_API_KEY = 'XNLL6JBRE7I5NVFA';
const THINGSPEAK_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=20`;

// ============================================================================
// FIELD MAPPING (matching Arduino code)
// field1 = Gas Value (analog 0-1023)
// field2 = Distance cm (ultrasonic)
// field3 = IR1 slot (1=empty, 0=occupied)
// field4 = IR2 slot (1=empty, 0=occupied)
// field5 = IR3 slot (1=empty, 0=occupied)
// ============================================================================

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================
const OCCUPANCY_HISTORY_KEY = 'smartpark_occupancy_history';
const MAX_HISTORY_POINTS = 800;
const HISTORY_RETENTION_MS = 24 * 60 * 60 * 1000;

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
    
    const record = {
        timestamp: now.toISOString(),
        occupancy: occupancyPercent,
        time: now.getTime()
    };
    
    history.push(record);
    
    const cutoffTime = now.getTime() - HISTORY_RETENTION_MS;
    history = history.filter(r => r.time >= cutoffTime);
    
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
    
    const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, 'rgba(255, 208, 0, 0.3)');
    gradientFill.addColorStop(1, 'rgba(255, 208, 0, 0)');
    
    occupancyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Occupancy Rate (%)',
                data: [],
                borderColor: '#FFD000',
                backgroundColor: gradientFill,
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#FFD000',
                pointBorderColor: '#000000',
                pointBorderWidth: 2,
                segment: {
                    borderColor: ctx => {
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
                        color: '#FFFFFF',
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
                    backgroundColor: 'rgba(13, 13, 13, 0.95)',
                    titleColor: '#FFD000',
                    titleFont: { size: 13, weight: 'bold' },
                    bodyColor: '#FFFFFF',
                    borderColor: '#FFD000',
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
                        color: '#FFFFFF',
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
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false,
                        lineWidth: 1
                    }
                },
                x: {
                    ticks: {
                        color: '#FFFFFF',
                        font: {
                            size: 10,
                            family: 'Poppins'
                        },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    }
                }
            }
        }
    });
}

/**
 * Update occupancy chart with history data
 */
function updateOccupancyChart() {
    let history = getOccupancyHistory();
    
    if (history.length === 0) return;
    
    let displayData = history;
    if (history.length > 100) {
        const step = Math.ceil(history.length / 100);
        displayData = history.filter((_, i) => i % step === 0);
    }
    
    const labels = displayData.map(r => formatTimeLabel(r.timestamp));
    const occupancyData = displayData.map(r => r.occupancy);
    
    occupancyChart.data.labels = labels;
    occupancyChart.data.datasets[0].data = occupancyData;
    occupancyChart.update('none');
}


/**
 * Initialize Gas Chart
 */
function initGasChart() {
    const ctx = document.getElementById('gasChart').getContext('2d');
    
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
                    backgroundColor: 'rgba(13, 13, 13, 0.95)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#FFFFFF'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 1024,
                    ticks: { color: '#FFFFFF' },
                    grid: { color: 'rgba(255,255,255,0.08)' }
                },
                x: { ticks: { color: '#FFFFFF' }, grid: { display: false } }
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

    const max = 1024;
    const pct = Math.min(ppm / max, 1);
    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const dash = circumference * pct;
    gaugeProgress.setAttribute('stroke-dasharray', `${dash} ${circumference}`);

    if (ppm > 500) {
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
// DISTANCE / BUZZER / GATE STATUS UPDATES (derived from existing fields)
// ============================================================================

/**
 * Update ultrasonic distance display (from field2)
 */
function updateDistanceDisplay(distanceCm) {
    const distEl = document.getElementById('distanceValue');
    const distBox = document.getElementById('distanceStatBox');
    if (!distEl || !distBox) return;

    if (distanceCm !== null && !isNaN(distanceCm)) {
        distEl.textContent = `${distanceCm} cm`;
        if (distanceCm <= 10) {
            distBox.style.borderColor = 'rgba(239, 68, 68, 0.8)';
            distBox.style.boxShadow = '0 4px 20px rgba(239, 68, 68, 0.3)';
        } else if (distanceCm <= 30) {
            distBox.style.borderColor = 'rgba(245, 158, 11, 0.8)';
            distBox.style.boxShadow = '0 4px 20px rgba(245, 158, 11, 0.3)';
        } else {
            distBox.style.borderColor = 'rgba(16, 185, 129, 0.5)';
            distBox.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.2)';
        }
    } else {
        distEl.textContent = 'N/A';
    }
}

/**
 * Update buzzer status indicator (derived: gas > 500 threshold)
 */
function updateBuzzerStatus(gasValue) {
    const buzzerEl = document.getElementById('buzzerValue');
    const buzzerBox = document.getElementById('buzzerStatBox');
    const buzzerIcon = document.getElementById('buzzerIcon');
    if (!buzzerEl || !buzzerBox) return;

    if (gasValue > 500) {
        buzzerEl.textContent = 'ALERT ON';
        buzzerBox.classList.add('buzzer-active');
        buzzerBox.style.borderColor = 'rgba(239, 68, 68, 0.8)';
        buzzerBox.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.15))';
        if (buzzerIcon) buzzerIcon.className = 'fas fa-volume-up';
    } else {
        buzzerEl.textContent = 'SILENT';
        buzzerBox.classList.remove('buzzer-active');
        buzzerBox.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        buzzerBox.style.background = '';
        if (buzzerIcon) buzzerIcon.className = 'fas fa-volume-mute';
    }
}

/**
 * Update gate/servo status display (derived: IR1 slot empty → gate open)
 */
function updateGateStatus(ir1Value) {
    const gateEl = document.getElementById('gateValue');
    const gateBox = document.getElementById('gateStatBox');
    const gateIcon = document.getElementById('gateIcon');
    if (!gateEl || !gateBox) return;

    // In Arduino: irState1 == LOW → sends 1 → "EMPTY" → servo opens gate to 90°
    if (ir1Value === 1) {
        gateEl.textContent = 'OPEN (90°)';
        gateBox.classList.add('gate-open');
        gateBox.classList.remove('gate-closed');
        gateBox.style.borderColor = 'rgba(16, 185, 129, 0.8)';
        gateBox.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.3)';
        if (gateIcon) gateIcon.className = 'fas fa-door-open';
    } else {
        gateEl.textContent = 'CLOSED (0°)';
        gateBox.classList.remove('gate-open');
        gateBox.classList.add('gate-closed');
        gateBox.style.borderColor = 'rgba(239, 68, 68, 0.5)';
        gateBox.style.boxShadow = '0 4px 20px rgba(239, 68, 68, 0.2)';
        if (gateIcon) gateIcon.className = 'fas fa-door-closed';
    }
}

// ============================================================================
// DASHBOARD DATA UPDATES
// ============================================================================

/**
 * Fetch and update all dashboard data from ThingSpeak
 * 
 * Arduino field mapping:
 *   field1 = gasValue
 *   field2 = distance (cm)
 *   field3 = IR1 slot (1=occupied, 0=vacant)
 *   field4 = IR2 slot (1=occupied, 0=vacant)
 *   field5 = IR3 slot (1=occupied, 0=vacant)
 */
async function updateDashboard() {
    try {
        const response = await fetch(THINGSPEAK_URL);
        const data = await response.json();
        
        if (data.feeds && data.feeds.length > 0) {
            const latestData = data.feeds[data.feeds.length - 1];
            
            // ---- Parse fields matching Arduino code ----
            // field1 = Gas Value
            const gasRaw = latestData.field1;
            const gasPPM = (gasRaw === null || gasRaw === undefined || gasRaw === '') ? null : parseFloat(gasRaw);

            // field2 = Distance (cm)
            const distRaw = latestData.field2;
            const distanceCm = (distRaw === null || distRaw === undefined || distRaw === '') ? null : parseFloat(distRaw);

            // field3-5 = IR slot states
            // Arduino: IR detects car → LOW → sends 1 = OCCUPIED
            // Arduino: No car → HIGH → sends 0 = VACANT
            const ir1Val = parseInt(latestData.field3) || 0;
            const ir2Val = parseInt(latestData.field4) || 0;
            const ir3Val = parseInt(latestData.field5) || 0;

            // Direct mapping: 1 = occupied, 0 = vacant
            const slot1Occupied = ir1Val;
            const slot2Occupied = ir2Val;
            const slot3Occupied = ir3Val;

            const totalSlots = 3;
            const occupiedSlots = slot1Occupied + slot2Occupied + slot3Occupied;
            const availableSlots = totalSlots - occupiedSlots;
            const occupancyRate = Math.round((occupiedSlots / totalSlots) * 100);
            
            // Update stats
            animateValue('totalSlots', 0, totalSlots, 500);
            animateValue('availableSlots', 0, availableSlots, 500);
            animateValue('occupiedSlots', 0, occupiedSlots, 500);
            document.getElementById('occupancyRate').textContent = occupancyRate + '%';
            
            // Update slot cards (pass occupied flag: 1=occupied, 0=free)
            updateSlotCard('slot1', slot1Occupied);
            updateSlotCard('slot2', slot2Occupied);
            updateSlotCard('slot3', slot3Occupied);
            
            // Add occupancy record to history and update chart
            addOccupancyRecord(occupancyRate);
            updateOccupancyChart();
            
            // Update gas sensor (field1)
            if (gasPPM !== null && !isNaN(gasPPM)) {
                updateGasLevel(gasPPM);
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

            // Update distance display (field2)
            updateDistanceDisplay(distanceCm);

            // Update buzzer status (derived from gas > 500 threshold)
            if (gasPPM !== null && !isNaN(gasPPM)) {
                updateBuzzerStatus(gasPPM);
            }

            // Update gate/servo status (derived from IR1 = field3)
            updateGateStatus(ir1Val);
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
function updateSlotCard(slotId, isOccupied) {
    const slotCard = document.getElementById(slotId);
    const statusElement = slotCard.querySelector('.status');
    
    slotCard.classList.remove('free', 'occupied');
    
    if (isOccupied === 0) {
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
    
    // Set up auto-refresh (every 16 seconds to match Arduino 15s delay)
    setInterval(updateDashboard, 16000);
    
    // Setup gas alert close button
    const closeBtn = document.getElementById('gasAlertClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideGasAlert);
    }
    
    console.log('Dashboard loaded — Adv_IOT Channel');
});
