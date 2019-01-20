import {Hexagon, HexagonProps} from './Hexagon';
import Container = PIXI.Container;

interface HexagonGridProps {
    columns: number;
    rows: number;
}

export class HexagonGrid extends Container {
    private props: HexagonGridProps;
    private hexagonProps: HexagonProps;

    constructor(props: HexagonGridProps, hexagonProps: HexagonProps) {
        super();
        this.props = props;
        this.hexagonProps = hexagonProps;
        this.draw();
    }

    public getChildByOffset(x: number, y: number): Hexagon {
        return this.getChildAt(x + y * this.props.columns);
    }

    private draw(): void {
        const {columns, rows} = this.props;
        const hexagonTemplate = new Hexagon(this.hexagonProps);
        const hexWidth = hexagonTemplate.polygonWidth;
        const hexHeight = hexagonTemplate.polygonHeight;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                const isEven = x % 2;
                const hexagon = new Hexagon(this.hexagonProps);
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
