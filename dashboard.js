// ThingSpeak Configuration
const CHANNEL_ID = '3175373';
const READ_API_KEY = 'ZI1JL5YU6DRGVBOS';
 // Replace with your actual read API key
const THINGSPEAK_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=20`;

// Chart.js instance
let occupancyChart;
// NEW: Gas chart instance
let gasChart;

// Initialize Chart with fixed height
function initChart() {
    const ctx = document.getElementById('occupancyChart').getContext('2d');
    
    occupancyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Occupancy Rate (%)',
                data: [],
                borderColor: '#ec4899',
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#ec4899',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Important for fixed height
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#f8fafc',
                        font: {
                            size: 12,
                            family: 'Poppins'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#f8fafc',
                    borderColor: '#ec4899',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#94a3b8',
                        stepSize: 20,
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#94a3b8',
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false
                    }
                }
            }
        }
    });
}

// NEW: Initialize Gas Chart
function initGasChart() {
    const ctx = document.getElementById('gasChart').getContext('2d');

    // sample gas data
    const sampleData = [50, 75, 90, 110, 95, 80, 120, 85, 70, 65];
    const labels = sampleData.map((_, i) => `T-${sampleData.length - i}`);

    // create gradient for the line (left=green, right=red)
    const gradient = ctx.createLinearGradient(0, 0, 600, 0);
    gradient.addColorStop(0, '#10b981');
    gradient.addColorStop(0.5, '#f59e0b');
    gradient.addColorStop(1, '#ef4444');

    gasChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gas (PPM)',
                data: sampleData,
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
                title: {
                    display: false
                },
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

// NEW: Update Gas Level (updates stat box, gauge and possible alert)
function updateGasLevel(ppm) {
    const gasPPMEl = document.getElementById('gasPPM');
    const gasBox = document.getElementById('gasStatBox');
    const gaugeValue = document.getElementById('gaugeValue');
    const gaugeProgress = document.getElementById('gaugeProgress');
    const gaugeStatus = document.getElementById('gaugeStatus');

    // Display value
    gasPPMEl.textContent = `${ppm} PPM`;
    gaugeValue.textContent = `${ppm} PPM`;

    // Determine gradient/background and status
    if (ppm <= 100) {
        // Good
        gasBox.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        gaugeProgress.setAttribute('stroke', '#10b981');
        gaugeStatus.textContent = 'Safe';
    } else if (ppm <= 300) {
        // Moderate
        gasBox.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        gaugeProgress.setAttribute('stroke', '#f59e0b');
        gaugeStatus.textContent = 'Caution';
    } else {
        // Hazardous
        gasBox.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        gaugeProgress.setAttribute('stroke', '#ef4444');
        gaugeStatus.textContent = 'Danger';
    }

    // Update circular progress: max 500 PPM
    const max = 500;
    const pct = Math.min(ppm / max, 1);
    const radius = 44; // from SVG r
    const circumference = 2 * Math.PI * radius;
    const dash = circumference * pct;
    gaugeProgress.setAttribute('stroke-dasharray', `${dash} ${circumference}`);

    // Alert handling
    if (ppm > 300) {
        showGasAlert();
    }
}

// NEW: Show/Hide Alert
function showGasAlert() {
    const banner = document.getElementById('gasAlert');
    if (!banner) return;
    banner.classList.add('show');
    banner.style.display = 'block';
}

function hideGasAlert() {
    const banner = document.getElementById('gasAlert');
    if (!banner) return;
    banner.classList.remove('show');
    banner.style.display = 'none';
}

// Fetch and update dashboard data
async function updateDashboard() {
    try {
        const response = await fetch(THINGSPEAK_URL);
        const data = await response.json();
        
        if (data.feeds && data.feeds.length > 0) {
            const latestData = data.feeds[data.feeds.length - 1];
            
            // Parse slot data (0 = free, 1 = occupied)
            const slot1 = parseInt(latestData.field1) || 0;
            const slot2 = parseInt(latestData.field2) || 0;
            const slot3 = parseInt(latestData.field3) || 0;
            
            // NEW: Parse gas sensor data from Field4
            const gasRaw = latestData.field4;
            const gasPPM = (gasRaw === null || gasRaw === undefined || gasRaw === '') ? null : parseFloat(gasRaw);
            
            const totalSlots = 3;
            const occupiedSlots = slot1 + slot2 + slot3;
            const availableSlots = totalSlots - occupiedSlots;
            const occupancyRate = Math.round((occupiedSlots / totalSlots) * 100);
            
            // Update stats with animation
            animateValue('totalSlots', 0, totalSlots, 500);
            animateValue('availableSlots', 0, availableSlots, 500);
            animateValue('occupiedSlots', 0, occupiedSlots, 500);
            document.getElementById('occupancyRate').textContent = occupancyRate + '%';
            
            // Update individual slots
            updateSlotCard('slot1', slot1);
            updateSlotCard('slot2', slot2);
            updateSlotCard('slot3', slot3);
            
            // NEW: Update gas level if valid data exists
            if (gasPPM !== null && !isNaN(gasPPM)) {
                updateGasLevel(gasPPM);
                // Add to gas chart if changed
                if (gasChart && gasChart.data.datasets[0].data.length > 0) {
                    const lastVal = gasChart.data.datasets[0].data[gasChart.data.datasets[0].data.length - 1];
                    if (lastVal !== gasPPM) {
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
            
            // Update chart
            updateChart(data.feeds);
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        document.getElementById('availableSlots').textContent = 'N/A';
        document.getElementById('occupiedSlots').textContent = 'N/A';
        document.getElementById('occupancyRate').textContent = 'N/A';
    }
}

// Animate number counting
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

// Update individual slot card
function updateSlotCard(slotId, status) {
    const slotCard = document.getElementById(slotId);
    const statusElement = slotCard.querySelector('.status');
    
    // Remove existing classes
    slotCard.classList.remove('free', 'occupied');
    
    if (status === 0) {
        slotCard.classList.add('free');
        statusElement.textContent = '✓ Available';
    } else {
        slotCard.classList.add('occupied');
        statusElement.textContent = '✗ Occupied';
    }
}

// Update chart with historical data
function updateChart(feeds) {
    const labels = [];
    const occupancyData = [];
    
    // Take last 10 readings
    const recentFeeds = feeds.slice(-10);
    
    recentFeeds.forEach(feed => {
        const timestamp = new Date(feed.created_at);
        const timeLabel = timestamp.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const slot1 = parseInt(feed.field1) || 0;
        const slot2 = parseInt(feed.field2) || 0;
        const slot3 = parseInt(feed.field3) || 0;
        
        const occupiedCount = slot1 + slot2 + slot3;
        const occupancyPercent = Math.round((occupiedCount / 3) * 100);
        
        labels.push(timeLabel);
        occupancyData.push(occupancyPercent);
    });
    
    // Update chart data
    occupancyChart.data.labels = labels;
    occupancyChart.data.datasets[0].data = occupancyData;
    occupancyChart.update('none'); // Disable animation for smoother updates
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard initialized');
    initChart();
    // NEW: initialize gas chart and default gas UI
    initGasChart();
    updateDashboard(); // Fetch all data including gas from ThingSpeak
    
    // Update every 15 seconds (ThingSpeak free tier limit)
    setInterval(updateDashboard, 15000);

    // NEW: Alert close button
    const closeBtn = document.getElementById('gasAlertClose');
    if (closeBtn) closeBtn.addEventListener('click', hideGasAlert);
});
