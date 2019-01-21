import {Hexagon, HexagonProps} from './Hexagon';
import {Player} from './Game';
import {HexagonField} from './HexagonField';
import Container = PIXI.Container;
import SystemRenderer = PIXI.SystemRenderer;

export interface HexagonGridProps {
    columns: number;
    rows: number;
    renderer: SystemRenderer;
    players: Pick<Player, Exclude<keyof Player, 'hexagonTexture'>>[];
    hexagonProps: Pick<HexagonProps, 'radius' | 'lineWidth' | 'lineColor'>;
}

interface HexagonGridPropsPrivate extends HexagonGridProps {
    players: Player[];
}

export class HexagonGrid extends Container {
    public readonly props: HexagonGridPropsPrivate;
    public children: Hexagon[];
    public hexagon: { width: number, height: number };

    constructor(props: HexagonGridProps) {
        super();
        this.props = props as any;
        const {renderer, players, hexagonProps} = this.props;
        const hexagonCalculation = new Hexagon(hexagonProps);
        this.hexagon = {
            width: hexagonCalculation.polygonWidth,
            height: hexagonCalculation.polygonHeight,
        };
        for (const player of players) {
            const hexagonTemplate = new Hexagon({...hexagonProps, ...player.hexagonProps});
            player.hexagonTexture = renderer.generateTexture(hexagonTemplate);
        }
        this.generate();
    }

    public getChildByOffset(x: number, y: number): HexagonField {
        return this.getChildAt(x + y * this.props.columns);
    }

    public getNeighborsByOffset(x: number, y: number): HexagonField[] {
        const neighbors: HexagonField[] = [];
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

    public getChildOffset(child: HexagonField): { x: number, y: number } {
        const index = this.getChildIndex(child);
        return {
            x: index % this.props.columns,
            y: Math.floor(index / this.props.columns),
        };
    }

    private generate(): void {
        const {columns, rows, players} = this.props;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                const isEven = x % 2;
                const random = Math.floor(Math.random() * Math.floor(players.length));
                const hexagon = new HexagonField({player: players[random]});
                hexagon.x = this.hexagon.width * x * 3 / 4;
                hexagon.y = this.hexagon.height * y;
                if (isEven) {
                    hexagon.y += this.hexagon.height / 2;
                }
                this.addChild(hexagon);
                hexagon.interactive = true;
                hexagon.on('mouseover', () => {
                    hexagon.tint = 0x0000ff;
                });
                hexagon.on('mouseout', () => {
                    hexagon.tint = 0xffffff;
                });
            }
        }
    }
}
