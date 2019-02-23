import {AxialCoordinates, axialToPixel, offsetToAxial, ring} from '../Function/Coordinates';
import {Player} from './Game';
import {TextureGenerator} from './GameContainer';
import {Hexagon, HexagonProps} from './Hexagon';
import {HexagonField} from './HexagonField';
import {HexagonGrid} from './HexagonGrid';
import Point = PIXI.Point;
import Polygon = PIXI.Polygon;
import Texture = PIXI.Texture;

export interface HexagonGridProps {
    textureGenerator: TextureGenerator;
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

export interface ChooserProps {
    axial: AxialCoordinates;
    playerCount: number;
    fieldCount: number;
}

export type PlayerChooser = (props: ChooserProps) => number | undefined;

export class HexagonGridGenerator {
    public readonly props: HexagonGridPropsPrivate;
    public calculation: HexagonCalculation;

    constructor(props: HexagonGridProps) {
        this.props = {...props, players: []};
        this.props.players = this.generatePlayerTextures(props.players);
        this.calculation = HexagonGridGenerator.toHexagonCalculation(props.hexagonProps);
    }

    public rectangle(columns: number, rows: number, getPlayer: PlayerChooser): HexagonGrid {
        const fieldCount = columns * rows;
        const grid = new HexagonGrid();
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                const axial = offsetToAxial({x, y});
                this.setFieldToGrid({axial, fieldCount}, grid, getPlayer);
            }
        }
        return grid;
    }

    public rhombus(columns: number, rows: number, getPlayer: PlayerChooser): HexagonGrid {
        const fieldCount = columns * rows;
        const grid = new HexagonGrid();
        for (let r = 0; r < rows; r++) {
            for (let q = 0; q < columns; q++) {
                const axial = {q, r};
                this.setFieldToGrid({axial, fieldCount}, grid, getPlayer);
            }
        }
        return grid;
    }

    public ring(radius: number, getPlayer: PlayerChooser): HexagonGrid {
        const fieldCount = radius * 6;
        const grid = new HexagonGrid();
        const center = offsetToAxial({x: radius, y: radius});
        for (const axial of ring(radius, center)) {
            this.setFieldToGrid({axial, fieldCount}, grid, getPlayer);
        }
        return grid;
    }

    public spiral(radius: number, getPlayer: PlayerChooser): HexagonGrid {
        const fieldCount = 3 * radius * (radius + 1) + 1;
        const grid = new HexagonGrid();
        const center = offsetToAxial({x: radius, y: radius});
        this.setFieldToGrid({axial: center, fieldCount}, grid, getPlayer);
        for (let i = 1; i <= radius; i++) {
            for (const axial of ring(i, center)) {
                this.setFieldToGrid({axial, fieldCount}, grid, getPlayer);
            }
        }
        return grid;
    }

    private setFieldToGrid(props: Pick<ChooserProps, 'axial' | 'fieldCount'>, grid: HexagonGrid, getPlayer: PlayerChooser) {
        const {axial} = props;
        const {players, hexagonProps} = this.props;
        const {padding, polygon} = this.calculation;
        const index = getPlayer({...props, playerCount: players.length});
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
        const {textureGenerator, hexagonProps} = this.props;
        const hexagonTemplate = new Hexagon({...hexagonProps, fillColor: color});
        const texture = textureGenerator(hexagonTemplate);
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
