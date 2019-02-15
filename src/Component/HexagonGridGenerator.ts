import {Hexagon, HexagonProps} from './Hexagon';
import {Player} from './Game';
import {HexagonField} from './HexagonField';
import {HexagonGrid} from './HexagonGrid';
import {AxialCoordinates, axialToPixel, offsetToAxial, ring} from '../Function/Coordinates';
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

    public ring(radius: number, getPlayer: PlayerChooser): HexagonGrid {
        const grid = new HexagonGrid();
        const center = offsetToAxial({x: radius, y: radius});
        for (const axial of ring(radius, center)) {
            this.setFieldToGrid(axial, getPlayer, grid);
        }
        return grid;
    }

    public spiral(radius: number, getPlayer: PlayerChooser): HexagonGrid {
        const grid = new HexagonGrid();
        const center = offsetToAxial({x: radius, y: radius});
        this.setFieldToGrid(center, getPlayer, grid);
        for (let i = 1; i <= radius; i++) {
            for (const axial of ring(i, center)) {
                this.setFieldToGrid(axial, getPlayer, grid);
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
