import {Graphics} from 'pixi.js';
import {Hexagon} from './Hexagon';

export class HexagonGrid extends Graphics {
    constructor(width: number, height: number, radius: number, lineSize: number) {
        super();
        const hexWidth = 2 * radius;
        const hexHeight = Math.sqrt(3) * radius;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const isEven = x % 2;
                const hexagon = new Hexagon(radius, 2);
                hexagon.x = hexWidth * x * 3 / 4;
                hexagon.y = hexHeight * y;
                if (isEven) {
                    hexagon.y += hexHeight / 2;
                }
                this.addChild(hexagon);
            }
        }
    }
}
