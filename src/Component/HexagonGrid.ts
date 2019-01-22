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

export interface Territory {
    player: Player;
    fields: HexagonField[];
}

interface OffsetCoordinates {
    x: number;
    y: number;
}

export class HexagonGrid extends Container {
    public readonly props: HexagonGridPropsPrivate;
    public children: HexagonField[];
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
        this.findTerritories();
    }

    public findTerritories() {
        const territories: Territory[] = [];
        const remaining = this.children.slice();
        for (const field of remaining) {
            const territory: Territory = {
                player: field.player,
                fields: [field],
            };
            field.territory = territory;
            remaining.splice(remaining.indexOf(field), 1);
            territories.push(territory);
            const addNeighbors = (hexagonField: HexagonField) => {
                const offset = this.getChildOffset(hexagonField);
                const neighbors = this.getNeighborsByOffset(offset.x, offset.y);
                for (const neighbor of neighbors) {
                    if (neighbor.player === hexagonField.player && remaining.includes(neighbor)) {
                        territory.fields.push(neighbor);
                        neighbor.territory = territory;
                        remaining.splice(remaining.indexOf(neighbor), 1);
                        addNeighbors(neighbor);
                    }
                }
            };
            addNeighbors(field);
        }
        console.log(territories);
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
                neighbors.push(this.getChildByOffset(neighborX, neighborY));
            } catch (e) {
                // Ignore
            }
        }
        return neighbors;
    }

    public getChildOffset(child: HexagonField): OffsetCoordinates {
        const index = this.getChildIndex(child);
        const y = Math.floor(index / this.props.columns);
        return {
            x: index - y * this.props.columns,
            y: y,
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
            }
        }
    }
}
