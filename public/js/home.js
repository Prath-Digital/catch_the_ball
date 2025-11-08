document.addEventListener('DOMContentLoaded', () => {
    const playButton = document.getElementById('playButton');
    const highScoreButton = document.getElementById('highScoreButton');
    const howToPlayButton = document.getElementById('howToPlayButton');

    playButton.addEventListener('click', () => {
        window.location.href = '/game';
    });

    highScoreButton.addEventListener('click', () => {
        window.location.href = '/leaderboard';
    });

    howToPlayButton.addEventListener('click', () => {
        window.location.href = '/how-to-play';
    });
});