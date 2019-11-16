import {Point, Polygon} from 'pixi.js';
import {AxialCoordinates, axialToPixel, offsetToAxial, ring} from '../Function/Coordinates';
import {Player} from '../Manager/PlayerManager';
import {Hexagon, HexagonProps} from './Hexagon';
import {HexagonField} from './HexagonField';
import {HexagonGrid} from './HexagonGrid';

export interface HexagonGridProps {
    players: Player[];
    hexagonProps: HexagonProps;
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

export type SavedGrid = SavedField[];

export interface SavedField extends AxialCoordinates {
    p: number;
}

export class HexagonGridGenerator {
    public readonly props: HexagonGridProps;
    public calculation: HexagonCalculation;

    constructor(props: HexagonGridProps) {
        this.props = props;
        this.calculation = HexagonGridGenerator.toHexagonCalculation(props.hexagonProps);
    }

    public rectangle(columns: number, rows: number): HexagonGrid {
        const grid = new HexagonGrid();
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                const axial = offsetToAxial({x, y});
                grid.set(this.generateField(axial, 0));
            }
        }
        return grid;
    }

    public rhombus(columns: number, rows: number): HexagonGrid {
        const grid = new HexagonGrid();
        for (let r = 0; r < rows; r++) {
            for (let q = 0; q < columns; q++) {
                const axial = {q, r};
                grid.set(this.generateField(axial, 0));
            }
        }
        return grid;
    }

    public ring(radius: number): HexagonGrid {
        const grid = new HexagonGrid();
        const center = offsetToAxial({x: radius, y: radius});
        for (const axial of ring(radius, center)) {
            grid.set(this.generateField(axial, 0));
        }
        return grid;
    }

    public hexagon(radius: number): HexagonGrid {
        const grid = new HexagonGrid();
        const center = offsetToAxial({x: radius, y: radius});
        grid.set(this.generateField(center, 0));
        for (let i = 1; i <= radius; i++) {
            for (const axial of ring(i, center)) {
                grid.set(this.generateField(axial, 0));
            }
        }
        return grid;
    }

    public load(savedGrid: SavedGrid): HexagonGrid {
        const grid = new HexagonGrid();
        for (const savedField of savedGrid) {
            const axial = {q: savedField.q, r: savedField.r};
            const field = this.generateField(axial, savedField.p);
            grid.set(field);
        }
        return grid;
    }

    public static save(grid: HexagonGrid, players: Player[]): SavedGrid {
        const savedGrid: SavedGrid = [];
        for (const field of grid.fields()) {
            savedGrid.push({
                q: field.q,
                r: field.r,
                p: players.indexOf(field.player),
            });
        }
        return savedGrid;
    }

    private generateField(axial: AxialCoordinates, playerIndex: number): HexagonField {
        const {players, hexagonProps} = this.props;
        const {padding, polygon} = this.calculation;
        const player = players[playerIndex % players.length];
        const field = new HexagonField({player, axial});
        const pixel = axialToPixel(axial, hexagonProps.radius);
        field.hitArea = polygon;
        field.position = new Point(pixel.x + padding.x, pixel.y + padding.y);
        return field;
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
