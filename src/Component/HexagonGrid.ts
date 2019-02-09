import {Hexagon, HexagonProps} from './Hexagon';
import {Player} from './Game';
import {HexagonField} from './HexagonField';
import {Territory} from './Territory';
import {ExplicitContainer} from '../Interface/ExplicitContainer';
import Container = PIXI.Container;
import SystemRenderer = PIXI.SystemRenderer;
import Point = PIXI.Point;
import Polygon = PIXI.Polygon;

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

export interface OffsetCoordinates {
    x: number;
    y: number;
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

export class HexagonGrid extends Container {
    public readonly props: HexagonGridPropsPrivate;
    public hexagon: HexagonCalculation;
    public territories: Territory[];
    public fieldContainer: ExplicitContainer<HexagonField>;

    constructor(props: HexagonGridProps) {
        super();
        this.props = props as any;
        const {renderer, players, hexagonProps} = this.props;
        this.hexagon = this.toHexagonCalculation(hexagonProps);
        for (const player of players) {
            const hexagonTemplate = new Hexagon({...hexagonProps, ...player.hexagonProps});
            player.hexagonTexture = renderer.generateTexture(hexagonTemplate);
            player.hexagonTexture.defaultAnchor = new Point(0.5, 0.5);
        }
        this.fieldContainer = new Container() as ExplicitContainer<HexagonField>;
        this.addChild(this.fieldContainer);
        this.generate();
        this.findTerritories();
    }

    private toHexagonCalculation(props: HexagonProps): HexagonCalculation {
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

    public findTerritories() {
        this.territories = [];
        for (const field of this.fieldContainer.children) {
            // Only if no territory is defined
            if (field.territory !== undefined) {
                continue;
            }
            // Create new territory
            const territory = new Territory({
                player: field.player,
                fields: [],
            });
            this.territories.push(territory);
            territory.addField(...this.getConnectedFields(field));
        }
        return this.territories;
    }

    public getConnectedFields(field: HexagonField) {
        const fields = new Set<HexagonField>();
        // Recursive function
        const addNeighbors = (hexagonField: HexagonField) => {
            fields.add(hexagonField);
            // Find and loop trough neighbors
            const neighbors = this.getFieldNeighbors(hexagonField);
            for (const neighbor of neighbors) {
                // Add it if its the same player and not in the list yet
                if (neighbor.player === hexagonField.player && !fields.has(neighbor)) {
                    // Recursion
                    addNeighbors(neighbor);
                }
            }
        };
        addNeighbors(field);
        return fields;
    }

    public getTerritoryNeighbors(territory: Territory): HexagonField[] {
        const {fields} = territory.props;
        const neighbors: HexagonField[] = [];
        // Walk trough all territory fields
        for (const field of fields) {
            const fieldNeighbors = this.getFieldNeighbors(field);
            // Walk trough all neighbors of this field
            for (const fieldNeighbor of fieldNeighbors) {
                // Only if it isn't already included and isn't in the territory fields
                if (!neighbors.includes(fieldNeighbor) && !fields.includes(fieldNeighbor)) {
                    neighbors.push(fieldNeighbor);
                }
            }
        }
        return neighbors;
    }

    public getFieldChildByOffset(x: number, y: number): HexagonField {
        return this.fieldContainer.getChildAt(x + y * this.props.columns);
    }

    public getFieldNeighbors(field: HexagonField): HexagonField[] {
        const {x, y} = field.coordinates;
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
                neighbors.push(this.getFieldChildByOffset(neighborX, neighborY));
            } catch (e) {
                // Ignore
            }
        }
        return neighbors;
    }

    public getPosition(coordinates: OffsetCoordinates): Point {
        const isEven = coordinates.x % 2;
        let x = this.hexagon.padding.x + this.hexagon.width * coordinates.x * 3 / 4;
        let y = this.hexagon.padding.y + this.hexagon.height * coordinates.y;
        if (isEven) {
            y += this.hexagon.height / 2;
        }
        return new Point(x, y);
    }

    private generate() {
        const {columns, rows, players} = this.props;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                const random = Math.floor(Math.random() * Math.floor(players.length));
                const hexagon = new HexagonField({player: players[random], coordinates: {x, y}});
                hexagon.hitArea = this.hexagon.polygon;
                hexagon.position = this.getPosition({x, y});
                this.fieldContainer.addChild(hexagon);
            }
        }
    }
}
