import {Graphics, Polygon} from 'pixi.js';

export interface HexagonProps {
    radius: number;
    lineWidth: number;
    fillColor?: number;
    lineColor?: number;
    lineAlignment?: number;
    alignment?: 'center' | 'tl';
}

const sides = 6;

export class Hexagon extends Graphics {
    private props: HexagonProps;
    public polygon: Polygon;

    constructor(props: HexagonProps) {
        super();
        this.props = props;
        this.polygon = this.toPolygon();
        this.draw();
    }

    public setProps(props: Partial<HexagonProps>) {
        this.props = {...this.props, ...props};
        const {radius, lineWidth, lineAlignment, alignment} = props;
        const recalculate = [radius, lineWidth, lineAlignment, alignment]
            .filter((item) => item !== undefined).length > 0;
        if (recalculate) {
            this.polygon = this.toPolygon();
        }
        this.draw();
    }

    private toPolygon(): Polygon {
        const {radius, lineWidth, lineAlignment, alignment} = this.props;
        const points: number[] = [];
        let x = 0;
        let y = 0;
        if (alignment === 'tl') {
            const outerLineWidth = lineWidth * (lineAlignment || 0.5);
            x = this.polygonWidth / 2 + outerLineWidth;
            y = this.polygonHeight / 2 + outerLineWidth;
        }
        for (let i = 0; i <= sides; i++) {
            points.push(x + radius * Math.cos(i * 2 * Math.PI / sides));
            points.push(y + radius * Math.sin(i * 2 * Math.PI / sides));
        }
        return new Polygon(points);
    }

    private draw(): void {
        let {lineWidth, fillColor, lineColor, lineAlignment} = this.props;
        if (fillColor) {
            this.beginFill(fillColor);
        }
        this.lineStyle(lineWidth, lineColor, 1, lineAlignment);
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
