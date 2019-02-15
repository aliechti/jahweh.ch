import {Hexagon, HexagonProps} from './Hexagon';
import {Player} from './Game';
import {HexagonField} from './HexagonField';
import {HexagonGrid} from './HexagonGrid';
import {AxialCoordinates, axialToPixel, offsetToAxial} from '../Function/Coordinates';
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

export type PlayerChooser = (axial: AxialCoordinates, playerCount: number) => number | undefined;

export class HexagonGridGenerator {
    public readonly props: HexagonGridPropsPrivate;
    public calculation: HexagonCalculation;

    constructor(props: HexagonGridProps) {
        this.props = {...props, players: []};
        this.props.players = this.generatePlayerTextures(props.players);
        this.calculation = HexagonGridGenerator.toHexagonCalculation(props.hexagonProps);
    }

    public rectangle(columns: number, rows: number, getPlayer: PlayerChooser): HexagonGrid {
        const grid = new HexagonGrid();
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                const axial = offsetToAxial({x, y});
                this.setFieldToGrid(axial, getPlayer, grid);
            }
        }
        return grid;
    }

    public rhombus(columns: number, rows: number, getPlayer: PlayerChooser): HexagonGrid {
        const grid = new HexagonGrid();
        for (let r = 0; r < rows; r++) {
            for (let q = 0; q < columns; q++) {
                this.setFieldToGrid({q, r}, getPlayer, grid);
            }
        }
        return grid;
    }

    public hexagon(radius: number, getPlayer: PlayerChooser): HexagonGrid {
        const grid = new HexagonGrid();
        const count = 1 + radius * 6;
        const x = radius;
        const y = Math.floor(radius * 2 / 3);
        for (let q = -radius; q <= radius; q++) {
            const r1 = Math.max(-radius, -q - radius);
            const r2 = Math.min(radius, -q + radius);
            for (let r = r1; r <= r2; r++) {
                this.setFieldToGrid({q: q + x, r: r + y}, getPlayer, grid);
            }
        }
        return grid;
    }

    private setFieldToGrid(axial: AxialCoordinates, getPlayer: PlayerChooser, grid: HexagonGrid) {
        console.log('setfield', axial);
        const {players, hexagonProps} = this.props;
        const {padding, polygon} = this.calculation;
        const index = getPlayer(axial, players.length);
        if (index !== undefined) {
            const player = players[index % players.length];
            const field = new HexagonField({player, axial});
            const pixel = axialToPixel(axial, hexagonProps.radius);
            field.hitArea = polygon;
            field.position = new Point(pixel.x + padding.x, pixel.y + padding.y);
            grid.set(axial, field);
        }
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
