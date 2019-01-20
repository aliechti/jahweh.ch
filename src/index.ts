import {Application} from 'pixi.js';
import {HexagonGrid} from './Component/HexagonGrid';

const app = new Application(window.innerWidth, window.innerHeight);
document.body.appendChild(app.view);
window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
});

const radius = 25;
const hexWidth = 2 * radius;
const hexHeight = Math.sqrt(3) * radius;
const width = Math.floor((window.innerWidth - hexWidth / 4) / (hexWidth * 3 / 4));
const height = Math.floor((window.innerHeight - hexHeight * 3 / 4) / hexHeight);
const grid = new HexagonGrid(width, height, radius, 2);
app.stage.addChild(grid);
