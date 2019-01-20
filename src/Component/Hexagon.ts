import {Graphics, Polygon} from 'pixi.js';

export interface HexagonProps {
    radius: number;
    lineWidth: number;
    fillColor?: number;
    lineColor?: number;
}

const sides = 6;

export class Hexagon extends Graphics {
    private props: HexagonProps;
    private polygon: Polygon;

    constructor(props: HexagonProps) {
        super();
        this.props = props;
        this.polygon = this.toPolygon();
        this.draw();
    }

    private toPolygon(): Polygon {
        let {radius} = this.props;
        const points: number[] = [];
        for (let i = 0; i <= sides; i++) {
            points.push(radius + radius * Math.cos(i * 2 * Math.PI / sides));
            points.push(radius + radius * Math.sin(i * 2 * Math.PI / sides));
        }
        return new Polygon(points);
    }

    private draw(): void {
        let {lineWidth, fillColor, lineColor} = this.props;
        if (fillColor) {
            this.beginFill(fillColor);
        }
        this.lineStyle(lineWidth, lineColor, 1, 0.5);
        this.drawPolygon(this.polygon);
        this.endFill();
    }

    get polygonWidth(): number {
        return this.props.radius * 2;
    }

    get polygonHeight(): number {
        return this.props.radius * Math.sqrt(3);
    }
}
