import {Application} from 'pixi.js';
import {HexagonGrid, HexagonGridProps} from './HexagonGrid';
import {HexagonProps} from './Hexagon';
import Texture = PIXI.Texture;

export interface GameProps {
    app: Application;
    grid: HexagonGridProps;
}

export interface Player {
    hexagonProps: Pick<HexagonProps, 'fillColor'>;
    hexagonTexture: Texture;
}

export class Game {
    private props: GameProps;

    constructor(props: GameProps) {
        this.props = props;
        const grid = new HexagonGrid(this.props.grid);

        this.props.app.stage.addChild(grid);
    }
}
