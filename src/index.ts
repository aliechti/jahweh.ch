import {Game} from './Component/Game';

const overlayStart = document.querySelector('.start') as HTMLDivElement;
const overlayInGame = document.querySelector('.in-game') as HTMLDivElement;
document.querySelectorAll('.btn-start').forEach((btn: HTMLButtonElement) => {
    btn.addEventListener('click', () => {
        overlayStart.style.display = 'none';
        overlayInGame.style.display = null;
        startGame();
    });
});

function startGame() {
    const players = [
        {
            color: 0xff0088,
        },
        {
            color: 0xff8800,
        },
        {
            color: 0xffff00,
        },
        {
            color: 0x00ffff,
        },
    ];
    const game = new Game({
        players: players,
        container: document.body,
    });
}
