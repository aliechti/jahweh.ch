import {Hexagon} from './Component/Hexagon';
import {Application} from 'pixi.js';

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
for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const isEven = x % 2;
        const hexagon = new Hexagon(radius, 2);
        hexagon.x = hexWidth * x * 3 / 4;
        hexagon.y = hexHeight * y;
        // hexagon.pivot.x = radius * sizeIncrementX / 2;
        // hexagon.pivot.y = radius * sizeIncrementY / 2;
        if (isEven) {
            hexagon.y += hexHeight / 2;
            // hexagon.rotation = Math.PI * 2 * 0.125;
        }
        app.stage.addChild(hexagon);
    }
}
