import {Application} from 'pixi.js';
import {Game} from './Component/Game';
import {HexagonGridGenerator} from './Component/HexagonGridGenerator';

const app = new Application(window.innerWidth, window.innerHeight, {
    antialias: true,
});
document.body.appendChild(app.view);
window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
});

const panelWidth = 250;
const radius = 25;
const hexWidth = 2 * radius;
const hexHeight = Math.sqrt(3) * radius;
const columns = Math.floor((window.innerWidth - hexWidth / 4 - panelWidth) / (hexWidth * 3 / 4));
const rows = Math.floor((window.innerHeight - hexHeight * 3 / 4) / hexHeight);
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
const generator = new HexagonGridGenerator({
    columns,
    rows,
    players,
    hexagonProps: {
        radius,
        lineWidth: 2,
        lineColor: 0x000000,
    },
    renderer: app.renderer,
});
const game = new Game({
    app: app,
    players: generator.props.players,
    grid: generator.generate(),
    panel: {
        w: panelWidth,
        h: window.innerHeight,
        fillColor: 0x112233,
    },
});
