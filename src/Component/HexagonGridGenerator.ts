import {Hexagon, HexagonProps} from './Hexagon';
import {Player} from './Game';
import {HexagonField} from './HexagonField';
import {HexagonGrid, OffsetCoordinates} from './HexagonGrid';
import SystemRenderer = PIXI.SystemRenderer;
import Point = PIXI.Point;
import Polygon = PIXI.Polygon;
import Texture = PIXI.Texture;

export interface HexagonGridProps {
    renderer: SystemRenderer;
    players: Pick<Player, Exclude<keyof Player, 'hexagonTexture'>>[];
    hexagonProps: Pick<HexagonProps, 'radius' | 'lineWidth' | 'lineColor'>;
}

interface HexagonGridPropsPrivate extends HexagonGridProps {
    players: Player[];
}

interface HexagonCalculation {
    width: number;
    height: number;
    polygon: Polygon;
    outerLineWidth: number;
    padding: {
        x: number;
        y: number;
    }
}

export type PlayerChooser = (x: number, y: number, playerCount: number) => number | undefined;

export class HexagonGridGenerator {
    public readonly props: HexagonGridPropsPrivate;
    public hexagon: HexagonCalculation;

    constructor(props: HexagonGridProps) {
        this.props = {...props, players: []};
        this.props.players = this.generatePlayerTextures(props.players);
        this.hexagon = HexagonGridGenerator.toHexagonCalculation(props.hexagonProps);
    }

    public generate(columns: number, rows: number, getPlayer: PlayerChooser): HexagonGrid {
        const {players} = this.props;
        const grid = new HexagonGrid({columns, rows});
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                const index = getPlayer(x, y, players.length);
                if (index !== undefined) {
                    const player = players[index % players.length];
                    const field = new HexagonField({player: player, coordinates: {x, y}});
                    field.hitArea = this.hexagon.polygon;
                    field.position = this.getPosition({x, y});
                    grid.add(field, {x, y});
                }
            }
        }
        return grid;
    }

    private getPosition(coordinates: OffsetCoordinates): Point {
        const isEven = coordinates.x % 2;
        let x = this.hexagon.padding.x + this.hexagon.width * coordinates.x * 3 / 4;
        let y = this.hexagon.padding.y + this.hexagon.height * coordinates.y;
        if (isEven) {
            y += this.hexagon.height / 2;
        }
        return new Point(x, y);
    }

    private generatePlayerTextures(playerProps: Pick<Player, Exclude<keyof Player, 'hexagonTexture'>>[]): Player[] {
        const players: Player[] = [];
        for (const player of playerProps) {
            players.push({...player, hexagonTexture: this.generateHexagonTexture(player.color)});
        }
        return players;
    }

    private generateHexagonTexture(color: number): Texture {
        const {renderer, hexagonProps} = this.props;
        const hexagonTemplate = new Hexagon({...hexagonProps, fillColor: color});
        const texture = renderer.generateTexture(hexagonTemplate);
        texture.defaultAnchor = new Point(0.5, 0.5);
        return texture;
    }

    private static toHexagonCalculation(props: HexagonProps): HexagonCalculation {
        const hexagon = new Hexagon(props);
        const width = hexagon.polygonWidth;
        const height = hexagon.polygonHeight;
        const polygon = hexagon.polygon;
        const outerLineWidth = props.lineWidth * 0.5;
        const x = width / 2 + outerLineWidth;
        const y = height / 2 + outerLineWidth;
        const padding = {x, y};
        return {width, height, polygon, outerLineWidth, padding};
    }
}
