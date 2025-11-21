// ThingSpeak Configuration
const CHANNEL_ID = '3175373';
const READ_API_KEY = 'EAS2XWQS7DA4CJPZ';
const THINGSPEAK_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=10`;

// Create animated particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 5 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = 'rgba(255, 255, 255, 0.5)';
        particle.style.borderRadius = '50%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animation = `float ${Math.random() * 10 + 5}s linear infinite`;
        particlesContainer.appendChild(particle);
    }
}

// Fetch data from ThingSpeak
async function fetchParkingData() {
    try {
        const response = await fetch(THINGSPEAK_URL);
        const data = await response.json();
        
        if (data.feeds && data.feeds.length > 0) {
            const latestData = data.feeds[data.feeds.length - 1];
            
            // Assuming field1 = slot1, field2 = slot2, field3 = slot3
            // 1 = occupied, 0 = free
            const slot1 = parseInt(latestData.field1) || 0;
            const slot2 = parseInt(latestData.field2) || 0;
            const slot3 = parseInt(latestData.field3) || 0;
            // Field5 -> Ultrasonic Distance (cm)
            const ultrasonicRaw = latestData.field5;
            const ultrasonic = (ultrasonicRaw === null || ultrasonicRaw === undefined || ultrasonicRaw === '') ? null : parseFloat(ultrasonicRaw);
            
            const totalSlots = 3;
            const occupiedSlots = slot1 + slot2 + slot3;
            const availableSlots = totalSlots - occupiedSlots;
            
            // Update UI
            document.getElementById('availableSlots').textContent = availableSlots;
            // Update ultrasonic card (show cm or No reading)
            const ultraEl = document.getElementById('ultraDistance');
            const ultraTileEl = document.getElementById('ultraTileValue');
            if (ultrasonic !== null && !isNaN(ultrasonic)) {
                const display = `${ultrasonic} cm`;
                if (ultraEl) ultraEl.textContent = display;
                if (ultraTileEl) ultraTileEl.textContent = display;
            } else {
                if (ultraEl) ultraEl.textContent = 'No reading';
                if (ultraTileEl) ultraTileEl.textContent = 'No reading';
            }
            
            // Update parking visual
            updateParkingVisual([slot1, slot2, slot3]);
            
            return data.feeds;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('availableSlots').textContent = 'N/A';
    }
}

// Update parking slot visualization
function updateParkingVisual(slots) {
    const slotElements = document.querySelectorAll('.parking-slot');
    slots.forEach((status, index) => {
        const car = slotElements[index].querySelector('.car');
        if (status === 1) {
            car.classList.add('occupied');
        } else {
            car.classList.remove('occupied');
        }
    });
}

// Predictive Algorithm (Simple Linear Regression)
async function predictAvailability() {
    try {
        const response = await fetch(THINGSPEAK_URL);
        const data = await response.json();
        
        if (data.feeds && data.feeds.length > 0) {
            // Calculate average occupancy from historical data
            let totalOccupancy = 0;
            data.feeds.forEach(feed => {
                const occupied = (parseInt(feed.field1) || 0) + 
                               (parseInt(feed.field2) || 0) + 
                               (parseInt(feed.field3) || 0);
                totalOccupancy += occupied;
            });
            
            const avgOccupancy = totalOccupancy / data.feeds.length;
            const totalSlots = 3;
            
            // Simple prediction: current trend + time factor
            const currentHour = new Date().getHours();
            let timeFactor = 1;
            
            // Peak hours (9 AM - 5 PM) = higher occupancy
            if (currentHour >= 9 && currentHour <= 17) {
                timeFactor = 1.3;
            } else {
                timeFactor = 0.7;
            }
            
            const predictedOccupancy = Math.min(avgOccupancy * timeFactor, totalSlots);
            const predictedAvailable = totalSlots - Math.round(predictedOccupancy);
            
            // Calculate probability
            const probability = Math.round((predictedAvailable / totalSlots) * 100);
            
            // Update UI
            const tomorrow3PM = new Date();
            tomorrow3PM.setDate(tomorrow3PM.getDate() + 1);
            tomorrow3PM.setHours(15, 0, 0);
            
            document.getElementById('predictionText').textContent = 
                `${probability}% chance of finding parking tomorrow at 3 PM`;
            
            document.getElementById('confidenceLabel').textContent = 
                `Confidence: ${probability}%`;
            
            // Animate confidence bar
            setTimeout(() => {
                document.getElementById('confidenceFill').style.width = `${probability}%`;
            }, 500);
        }
    } catch (error) {
        console.error('Error in prediction:', error);
        document.getElementById('predictionText').textContent = 
            'Prediction temporarily unavailable';
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    createParticles();
    fetchParkingData();
    predictAvailability();
    
    // Update every 10 seconds
    setInterval(fetchParkingData, 10000);
    
    // Update prediction every 5 minutes
    setInterval(predictAvailability, 300000);
});
