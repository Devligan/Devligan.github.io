const bird = document.getElementById('bird');
const game = document.getElementById('game');
const pipes = document.querySelectorAll('.pipe');
let birdY = 50;
let gravity = 0.5;
let jump = -10;
let score = 0;

function gameLoop() {
    birdY += gravity;
    bird.style.top = birdY + '%';


    requestAnimationFrame(gameLoop);
}

game.addEventListener('click', () => {
    birdY += jump;
});

gameLoop();
