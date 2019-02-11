import {Application} from 'pixi.js';
import {Game} from './Component/Game';
import {HexagonGridGenerator, PlayerChooser} from './Component/HexagonGridGenerator';

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
    players,
    hexagonProps: {
        radius,
        lineWidth: 2,
        lineColor: 0x000000,
    },
    renderer: app.renderer,
});
const chooserRandom: PlayerChooser = (x, y, count) => {
    return Math.floor(Math.random() * Math.floor(count));
};
const generateEvenlyChooser = (emptyPercentage: number): PlayerChooser => {
    // todo: this isn't enough random, sometimes it produces strange maps
    // todo: emptyPercentage should not create islands
    const fill: (number | undefined)[] = [];
    const emptyCount = columns * rows / 100 * emptyPercentage;
    const fieldCount = columns * rows - emptyCount;
    fill.push(...Array(Math.floor(emptyCount)).fill(null));
    for (const i in players) {
        fill.push(...Array(Math.floor(fieldCount / players.length)).fill(i));
    }
    fill.sort(() => Math.random() - 0.5);
    return (x, y, count) => {
        return fill[x + y * columns] || undefined;
    };
};
const game = new Game({
    app: app,
    players: generator.props.players,
    grid: generator.generate(columns, rows, generateEvenlyChooser(0)),
    panel: {
        w: panelWidth,
        h: window.innerHeight,
        fillColor: 0x112233,
    },
});
