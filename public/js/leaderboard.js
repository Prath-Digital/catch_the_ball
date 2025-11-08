// leaderboard.js
// Fetch and display leaderboard scores

document.addEventListener('DOMContentLoaded', () => {
    const highScoresList = document.getElementById('highScoresList');
    
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return 'Today';
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    function createScoreEntry(score, index) {
        const entry = document.createElement('div');
        entry.className = 'high-score-entry';
        
        // Medal for top 3
        let medal = '';
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';
        
        entry.innerHTML = `
            <div class="rank">${medal || (index + 1)}</div>
            <div class="player-info">
                <div class="player-name">${score.name || 'Player'}</div>
                <div class="score-info">
                    <span class="score-value">${score.score.toLocaleString()}</span>
                    ${score.timestamp ? `<span class="score-date">${formatDate(score.timestamp)}</span>` : ''}
                </div>
            </div>
        `;
        
        return entry;
    }

    function showError(message) {
        highScoresList.innerHTML = `
            <div class="leaderboard-error">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <button onclick="location.reload()">Try Again</button>
            </div>
        `;
    }

    function showLoading() {
        highScoresList.innerHTML = `
            <div class="leaderboard-loading">
                <div class="loader"></div>
                <p>Loading scores...</p>
            </div>
        `;
    }

    // Load scores
    showLoading();
    fetch('/api/high-scores')
        .then(res => {
            if (!res.ok) throw new Error('Failed to load scores');
            return res.json();
        })
        .then(scores => {
            if (!scores || scores.length === 0) {
                highScoresList.innerHTML = `
                    <div class="leaderboard-empty">
                        <i class="fas fa-trophy"></i>
                        <p>No scores yet! Be the first to play!</p>
                        <button onclick="window.location.href='/game'" class="play-button">
                            Play Now
                        </button>
                    </div>
                `;
            } else {
                highScoresList.innerHTML = '';
                scores.forEach((score, index) => {
                    highScoresList.appendChild(createScoreEntry(score, index));
                });
            }
        })
        .catch(error => {
            console.error('Error loading scores:', error);
            showError('Could not load scores. Please try again later.');
        });
});
