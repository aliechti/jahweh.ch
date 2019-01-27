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
    private grid: HexagonGrid;
    private player: Player;
    private _draggingUnit?: Unit;

    constructor(props: GameProps) {
        this.props = props;
        this.grid = new HexagonGrid(this.props.grid);
        this.player = this.grid.props.players[0];

        this.props.app.stage.addChild(this.grid);

        for (const field of this.grid.children) {
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
        for (const territory of this.grid.territories) {
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

    private handleDragMove = (e: InteractionEvent) => {
        const unit = this.draggingUnit;
        if (unit) {
            const field = unit.props.field;
            let offsetX = 0;
            let offsetY = 0;
            if (field) {
                offsetX = -(field.x);
                offsetY = -(field.y);
            }
            unit.x = e.data.global.x + offsetX;
            unit.y = e.data.global.y + offsetY;
        }
    };

    get draggingUnit(): Unit | undefined {
        return this._draggingUnit;
    }

    set draggingUnit(unit: Unit | undefined) {
        if (this._draggingUnit !== undefined) {
            this._draggingUnit.x = 0;
            this._draggingUnit.y = 0;
            this._draggingUnit.off('pointermove', this.handleDragMove);
        }
        this._draggingUnit = unit;
        if (this._draggingUnit) {
            this._draggingUnit.on('pointermove', this.handleDragMove);
        }
    }
}
