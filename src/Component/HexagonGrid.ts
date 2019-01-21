import {Hexagon, HexagonProps} from './Hexagon';
import {Player} from './Game';
import Container = PIXI.Container;
import SystemRenderer = PIXI.SystemRenderer;
import Sprite = PIXI.Sprite;

export interface HexagonGridProps {
    columns: number;
    rows: number;
    renderer: SystemRenderer;
    players: Player[];
    hexagonProps: Pick<HexagonProps, 'radius' | 'lineWidth' | 'lineColor'>;
}

export class HexagonGrid extends Container {
    public readonly props: HexagonGridProps;
    public children: Hexagon[];

    constructor(props: HexagonGridProps) {
        super();
        this.props = props;
        this.generate();
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
            const isOverRightEdge = neighborX >= this.props.columns;
            const isOverLeftEdge = neighborX < 0;
            if (isOverRightEdge || isOverLeftEdge) {
                continue;
            }
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

    private generate(): void {
        const {columns, rows, renderer, players, hexagonProps} = this.props;
        const hexagonCalculation = new Hexagon(hexagonProps);
        const hexWidth = hexagonCalculation.polygonWidth;
        const hexHeight = hexagonCalculation.polygonHeight;
        const textures = [];
        for (const player of players) {
            const hexagonTemplate = new Hexagon({...hexagonProps, ...player.hexagonProps});
            textures.push(renderer.generateTexture(hexagonTemplate));
        }
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                const isEven = x % 2;
                const hexagon = new Sprite(textures[Math.floor(Math.random() * Math.floor(players.length))]);
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
