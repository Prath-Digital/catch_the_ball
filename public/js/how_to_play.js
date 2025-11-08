// Device detection
function detectDevice() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    document.body.classList.add(isMobile ? 'mobile-device' : 'desktop-device');
    return isMobile;
}

// Update controls section based on device
function updateControls() {
    const isMobile = detectDevice();
    const controlsSection = document.querySelector('.controls');
    
    if (isMobile) {
        controlsSection.innerHTML = `
            <div class="control-key mobile-control">
                <div class="key">
                    <i class="fas fa-hand"></i>
                    <i class="fas fa-arrows-left-right"></i>
                    <i class="fas fa-hand-rock"></i>
                </div>
                <span>Drag Basket to Move</span>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    updateControls();
});
