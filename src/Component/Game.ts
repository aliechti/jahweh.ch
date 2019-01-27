import {Application} from 'pixi.js';
import {HexagonGrid, HexagonGridProps, Territory} from './HexagonGrid';
import {HexagonProps} from './Hexagon';
import {Unit} from './Unit';
import Texture = PIXI.Texture;
import Graphics = PIXI.Graphics;
import Point = PIXI.Point;
import InteractionEvent = PIXI.interaction.InteractionEvent;

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
    private draggingUnit?: Unit;

    constructor(props: GameProps) {
        this.props = props;
        const grid = new HexagonGrid(this.props.grid);
        this.player = grid.props.players[0];

        this.props.app.stage.addChild(grid);

        for (const field of grid.children) {
            field.interactive = true;
            field.interactiveChildren = true;
            field.on('click', (e) => {
                this.tintTerritory(this.player.selectedTerritory, 0xffffff);
                this.player.selectedTerritory = field.territory;
                this.tintTerritory(this.player.selectedTerritory, 0x555555);
                if (this.draggingUnit !== undefined && field.unit === undefined) {
                    field.unit = this.draggingUnit;
                    this.draggingUnit = undefined;
                }
            });
        }
        const capital = new Graphics();
        capital.beginFill(0x6789AB);
        capital.drawCircle(0, 0, 10);
        capital.endFill();
        const capitalTexture = props.app.renderer.generateTexture(capital);
        capitalTexture.defaultAnchor = new Point(0.5, 0.5);
        for (const territory of grid.territories) {
            const size = territory.fields.length;
            if (size > 1) {
                const unit = new Unit({
                    type: 'capital',
                    texture: capitalTexture,
                });
                territory.fields[0].unit = unit;
                unit.interactive = true;
                unit.buttonMode = true;
                unit.on('click', (e: InteractionEvent) => {
                    if (this.draggingUnit === undefined) {
                        this.draggingUnit = unit;
                        e.stopPropagation();
                    }
                });
            }
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
