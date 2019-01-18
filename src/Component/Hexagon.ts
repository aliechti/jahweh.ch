import {Graphics, Polygon} from 'pixi.js';

export class Hexagon extends Graphics {
    constructor(size: number, lineSize: number) {
        super();
        const points = [1, 0, 2, 0, 3, 1, 3, 2, 2, 3, 1, 3, 0, 2, 0, 1, 1, 0].map((point) => {
            return point * size;
        });
        const polygon = new Polygon(points);
        this.beginFill(0xff00ff);
        this.lineStyle(lineSize, 0x00ff00, 1, 0);
        this.drawPolygon(polygon);
        this.endFill();
    }
}
