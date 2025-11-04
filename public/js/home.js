document.addEventListener('DOMContentLoaded', () => {
    const playButton = document.getElementById('playButton');
    const highScoreButton = document.getElementById('highScoreButton');
    const howToPlayButton = document.getElementById('howToPlayButton');

    playButton.addEventListener('click', () => {
        window.location.href = '/game';
    });

    highScoreButton.addEventListener('click', () => {
        // Get high scores from localStorage
        const highScores = JSON.parse(localStorage.getItem('highScores') || '[]');
        const medals = ['🥇', '🥈', '🥉'];
        
        if (highScores.length === 0) {
            alert('No high scores yet!\nStart playing to set some records! 🎮');
            return;
        }

        const scoresText = highScores
            .slice(0, 3) // Ensure only top 3 are shown
            .map((score, index) => `${medals[index]} ${score} points`)
            .join('\n');

        alert('🏆 TOP 3 HIGH SCORES 🏆\n\n' + scoresText);
    });

    howToPlayButton.addEventListener('click', () => {
        window.location.href = '/how-to-play';
    });
});