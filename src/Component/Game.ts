import {Application} from 'pixi.js';
import {HexagonGrid, HexagonGridProps, Territory} from './HexagonGrid';
import {HexagonProps} from './Hexagon';
import Texture = PIXI.Texture;

export interface GameProps {
    app: Application;
    grid: HexagonGridProps;
}

export interface Player {
    hexagonProps: Pick<HexagonProps, 'fillColor'>;
    hexagonTexture: Texture;
    selectedTerritory?: Territory;
}

export class Game {
    private props: GameProps;
    private player: Player;

    constructor(props: GameProps) {
        this.props = props;
        const grid = new HexagonGrid(this.props.grid);
        this.player = grid.props.players[0];

        this.props.app.stage.addChild(grid);

        for (const field of grid.children) {
            field.interactive = true;
            field.on('click', () => {
                console.log('click', this.player.selectedTerritory, field.territory);
                this.tintTerritory(this.player.selectedTerritory, 0xffffff);
                this.player.selectedTerritory = field.territory;
                this.tintTerritory(this.player.selectedTerritory, 0x555555);
            });
        }
    }

    private tintTerritory(territory: Territory | undefined, tint: number) {
        if (territory) {
            for (const field of territory.fields) {
                field.tint = tint;
            }
        }
    }
}
