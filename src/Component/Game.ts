import {Application} from 'pixi.js';
import {HexagonGrid, HexagonGridProps} from './HexagonGrid';
import {HexagonProps} from './Hexagon';
import {Territory} from './Territory';
import {UnitTypeManager} from './UnitTypeManager';
import {Unit} from './Unit';
import {Panel, PanelProps} from './Panel';
import Texture = PIXI.Texture;
import InteractionEvent = PIXI.interaction.InteractionEvent;

export interface GameProps {
    app: Application;
    grid: HexagonGridProps;
    panel: PanelProps;
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
    private unitTypeManager: UnitTypeManager;
    private panel: Panel;

    constructor(props: GameProps) {
        this.props = props;
        this.grid = new HexagonGrid(this.props.grid);
        this.player = this.grid.props.players[0];
        this.grid.interactive = true;
        this.unitTypeManager = new UnitTypeManager({renderer: this.props.app.renderer});

        this.panel = new Panel(this.props.panel);
        this.panel.x = window.innerWidth - this.props.panel.w;
        this.panel.setPlayer(this.player);

        this.props.app.stage.addChild(this.grid);
        this.props.app.stage.addChild(this.panel);

        for (const field of this.grid.fieldContainer.children) {
            field.interactive = true;
            field.on('click', (e) => {
                console.log('click field');
                this.tintTerritory(this.player.selectedTerritory, 0xffffff);
                this.player.selectedTerritory = field.territory;
                this.panel.setTerritory(field.territory);
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
        for (const territory of this.grid.territories) {
            const size = territory.props.fields.length;
            if (size > 1) {
                const field = territory.props.fields[0];
                const unit = new Unit({
                    type: this.unitTypeManager.mainBuilding,
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
            for (const field of territory.props.fields) {
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
