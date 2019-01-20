import {Graphics} from 'pixi.js';
import {Hexagon, HexagonProps} from './Hexagon';

interface HexagonGridProps {
    columns: number;
    rows: number;
}

export class HexagonGrid extends Graphics {
    private props: HexagonGridProps;
    private hexagonProps: HexagonProps;

    constructor(props: HexagonGridProps, hexagonProps: HexagonProps) {
        super();
        this.props = props;
        this.hexagonProps = hexagonProps;
        this.draw();
    }

    private draw(): void {
        const {columns, rows} = this.props;
        const hexagonTemplate = new Hexagon(this.hexagonProps);
        const hexWidth = hexagonTemplate.width;
        const hexHeight = hexagonTemplate.height;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                const isEven = x % 2;
                const hexagon = hexagonTemplate.clone();
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
