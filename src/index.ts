import {Hexagon} from './Component/Hexagon';
import {Application} from 'pixi.js';

const app = new Application(window.innerWidth, window.innerHeight);
document.body.appendChild(app.view);
window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
});

const width = 10;
const height = 10;
const size = 20;
const sizeIncrementX = 3;
const sizeIncrementY = 3;
for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
        const isEven = y % 2;
        const hexagon = new Hexagon(size, 2);
        hexagon.x = size * sizeIncrementX * x;
        hexagon.y = size * sizeIncrementY * y;
        // hexagon.pivot.x = size * sizeIncrementX / 2;
        // hexagon.pivot.y = size * sizeIncrementY / 2;
        if (isEven) {
            // hexagon.x += size * 1.5;
            // hexagon.rotation = Math.PI * 2 * 0.125;
        }
        app.stage.addChild(hexagon);
    }
}
