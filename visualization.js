// Parking Visualization JavaScript
class ParkingVisualization {
    constructor() {
        this.slots = [
            { id: 1, status: 'available', element: 'slot-viz-1' },
            { id: 2, status: 'occupied', element: 'slot-viz-2' },
            { id: 3, status: 'available', element: 'slot-viz-3' }
        ];
        this.gateStatus = 'closed';
        this.init();
    }

    init() {
        this.updateSlotDisplay();
        this.updateGateDisplay();
        this.updateStats();
        this.startSimulation();
    }

    updateSlotDisplay() {
        this.slots.forEach(slot => {
            const element = document.getElementById(slot.element);
            const indicator = document.getElementById(`indicator-${slot.id}`);
            const statusText = element.querySelector('.slot-status');

            // Update slot classes
            element.className = `parking-slot ${slot.status}`;
            
            // Update indicator icon
            if (slot.status === 'available') {
                indicator.innerHTML = '<i class="fas fa-car"></i>';
                statusText.textContent = 'Available';
                statusText.style.color = '#10b981';
            } else {
                indicator.innerHTML = '<i class="fas fa-car"></i>';
                statusText.textContent = 'Occupied';
                statusText.style.color = '#ef4444';
            }
        });
    }

    updateGateDisplay() {
        const gateStatusText = document.getElementById('gateStatusText');
        const gateLight = document.getElementById('gateLight');

        if (this.gateStatus === 'open') {
            gateStatusText.textContent = 'Open';
            gateStatusText.style.color = '#10b981';
            gateLight.classList.add('open');
        } else {
            gateStatusText.textContent = 'Closed';
            gateStatusText.style.color = '#ef4444';
            gateLight.classList.remove('open');
        }
    }

    updateStats() {
        const occupiedCount = this.slots.filter(slot => slot.status === 'occupied').length;
        const occupancyRate = Math.round((occupiedCount / this.slots.length) * 100);
        
        document.getElementById('occupancySummary').textContent = `${occupancyRate}%`;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        document.getElementById('lastUpdate').textContent = timeString;
    }

    startSimulation() {
        // Simulate random slot changes every 5-10 seconds
        setInterval(() => {
            const randomSlot = this.slots[Math.floor(Math.random() * this.slots.length)];
            const newStatus = randomSlot.status === 'available' ? 'occupied' : 'available';
            
            randomSlot.status = newStatus;
            this.updateSlotDisplay();
            this.updateStats();
            
            // Occasionally toggle gate
            if (Math.random() > 0.7) {
                this.gateStatus = this.gateStatus === 'closed' ? 'open' : 'closed';
                this.updateGateDisplay();
            }
        }, Math.random() * 5000 + 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ParkingVisualization();
});
