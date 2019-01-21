import {Application} from 'pixi.js';
import {Game} from './Component/Game';

const app = new Application(window.innerWidth, window.innerHeight, {
    antialias: true,
});
document.body.appendChild(app.view);
window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
});

const radius = 25;
const hexWidth = 2 * radius;
const hexHeight = Math.sqrt(3) * radius;
const columns = Math.floor((window.innerWidth - hexWidth / 4) / (hexWidth * 3 / 4));
const rows = Math.floor((window.innerHeight - hexHeight * 3 / 4) / hexHeight);
const game = new Game({
    app: app,
    grid: {
        columns: columns,
        rows: rows,
        hexagonProps: {
            radius: radius,
            lineWidth: 2,
            lineColor: 0x000000,
        },
        players: [
            {
                hexagonProps: {
                    fillColor: 0xff00ff,
                },
            },
            {
                hexagonProps: {
                    fillColor: 0x880088,
                },
            },
        ],
        renderer: app.renderer,
    },
});
