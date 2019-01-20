import {Application} from 'pixi.js';
import {HexagonGrid} from './Component/HexagonGrid';

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
const grid = new HexagonGrid({
    columns: columns,
    rows: rows,
}, {
    radius: radius,
    fillColor: 0xff00ff,
    lineColor: 0x00ff00,
    lineWidth: 2,
});

for (const child of grid.children) {
    const offset = grid.getChildOffset(child);
    const neighbors = grid.getNeighborsByOffset(offset.x, offset.y);
    child.interactive = true;
    child.buttonMode = true;
    child.on('mouseover', () => {
        child.setProps({fillColor: 0xff0000});
        for (const neighbor of neighbors) {
            neighbor.setProps({fillColor: 0x0000ff});
        }
    });
    child.on('mouseout', () => {
        child.setProps({fillColor: grid.hexagonProps.fillColor});
        for (const neighbor of neighbors) {
            neighbor.setProps({fillColor: grid.hexagonProps.fillColor});
        }
    });
}

app.stage.addChild(grid);
