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
        this.grid.interactive = true;

        this.props.app.stage.addChild(this.grid);

        for (const field of this.grid.fieldContainer.children) {
            field.interactive = true;
            field.on('click', (e) => {
                console.log('click field');
                this.tintTerritory(this.player.selectedTerritory, 0xffffff);
                this.player.selectedTerritory = field.territory;
                this.tintTerritory(this.player.selectedTerritory, 0x555555);
                if (this.draggingUnit !== undefined) {
                    if (field.unit === undefined) {
                        // Set unit to new field
                        field.unit = this.draggingUnit;
                    } else {
                        console.warn('Unit can\'t move to this field');
                    }
                    // Reset unit dragging
                    this.draggingUnit = undefined;
                    field.unit.position = field.position;
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
                const field = territory.fields[0];
                const unit = new Unit({
                    type: 'capital',
                    texture: capitalTexture,
                });
                field.unit = unit;
                unit.interactive = true;
                unit.buttonMode = true;
                unit.position = field.position;
                unit.on('click', (e: InteractionEvent) => {
                    console.log('click unit');
                    if (this.draggingUnit === undefined) {
                        this.draggingUnit = unit;
                        e.stopPropagation();
                    }
                });
                this.grid.unitContainer.addChild(unit);
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
            unit.x = e.data.global.x;
            unit.y = e.data.global.y;
        }
    };

    get draggingUnit(): Unit | undefined {
        return this._draggingUnit;
    }

    set draggingUnit(unit: Unit | undefined) {
        if (this._draggingUnit !== undefined) {
            this._draggingUnit.interactive = true;
            this.grid.off('pointermove', this.handleDragMove);
        }
        this._draggingUnit = unit;
        if (this._draggingUnit) {
            this._draggingUnit.interactive = false;
            this.grid.on('pointermove', this.handleDragMove);
        }
    }
}
