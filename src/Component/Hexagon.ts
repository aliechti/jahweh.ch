import {Graphics, Polygon} from 'pixi.js';

const sides = 6;

export class Hexagon extends Graphics {
    constructor(radius: number, lineSize: number) {
        super();
        const points: number[] = [];
        for (let i = 0; i <= sides; i++) {
            points.push(radius + radius * Math.cos(i * 2 * Math.PI / sides));
            points.push(radius + radius * Math.sin(i * 2 * Math.PI / sides));
        }
        console.log(points);
        const polygon = new Polygon(points);
        this.beginFill(0xff00ff);
        this.lineStyle(lineSize, 0x00ff00, 1, 0.5);
        this.drawPolygon(polygon);
        this.endFill();
    }
}
