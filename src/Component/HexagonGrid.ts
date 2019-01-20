import {Hexagon, HexagonProps} from './Hexagon';
import Container = PIXI.Container;

interface HexagonGridProps {
    columns: number;
    rows: number;
}

export class HexagonGrid extends Container {
    public readonly props: HexagonGridProps;
    public readonly hexagonProps: HexagonProps;
    public children: Hexagon[];

    constructor(props: HexagonGridProps, hexagonProps: HexagonProps) {
        super();
        this.props = props;
        this.hexagonProps = hexagonProps;
        this.draw();
    }

    public getChildByOffset(x: number, y: number): Hexagon {
        return this.getChildAt(x + y * this.props.columns);
    }

    public getNeighborsByOffset(x: number, y: number): Hexagon[] {
        const neighbors: Hexagon[] = [];
        const matrixEven = [-1, 0, 0, -1, 1, 0, 1, 1, 0, 1, -1, 1];
        const matrixOdd = [-1, -1, 0, -1, 1, -1, 1, 0, 0, 1, -1, 0];
        const isEven = x % 2;
        const matrix = (isEven ? matrixEven : matrixOdd);
        for (let i = 0; i < 6; i++) {
            const neighborX = x + matrix[i * 2];
            const neighborY = y + matrix[i * 2 + 1];
            try {
                neighbors.push(this.getChildAt(neighborX + neighborY * this.props.columns));
            } catch (e) {
                // Ignore
            }
        }
        return neighbors;
    }

    public getChildOffset(child: Hexagon): { x: number, y: number } {
        const index = this.getChildIndex(child);
        return {
            x: index % this.props.columns,
            y: Math.floor(index / this.props.columns),
        };
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
