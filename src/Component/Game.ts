import {Application} from 'pixi.js';
import {HexagonGrid, HexagonGridProps} from './HexagonGrid';
import {HexagonProps} from './Hexagon';
import {Territory} from './Territory';
import {UnitTypeManager} from './UnitTypeManager';
import {Unit, UnitType} from './Unit';
import {Panel, PanelProps} from './Panel';
import {ExplicitContainer} from '../Interface/ExplicitContainer';
import Texture = PIXI.Texture;
import InteractionEvent = PIXI.interaction.InteractionEvent;
import Container = PIXI.Container;

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
    private dragContainer: ExplicitContainer<Unit>;
    private unitContainer: ExplicitContainer<Unit>;

    constructor(props: GameProps) {
        this.props = props;
        this.grid = new HexagonGrid(this.props.grid);
        this.player = this.grid.props.players[0];
        this.grid.interactive = true;
        this.unitTypeManager = new UnitTypeManager({renderer: this.props.app.renderer});
        this.dragContainer = new Container() as ExplicitContainer<Unit>;
        this.unitContainer = new Container() as ExplicitContainer<Unit>;

        this.panel = new Panel(this.props.panel);
        this.panel.x = window.innerWidth - this.props.panel.w;
        this.panel.setPlayer(this.player);
        this.panel.setUnitTypes(this.unitTypeManager.units, this.handlePanelUnitClick);

        this.props.app.stage.addChild(this.grid);
        this.props.app.stage.addChild(this.unitContainer);
        this.props.app.stage.addChild(this.panel);
        this.props.app.stage.addChild(this.dragContainer);

        for (const field of this.grid.fieldContainer.children) {
            field.interactive = true;
            field.on('click', (e) => {
                console.log('click field');
                if (field.territory) {
                    // todo: remove, this is just for testing
                    field.territory.money += 10;
                }
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
                    field: field,
                    onClick: this.handleUnitClick,
                });
                field.unit = unit;
                unit.position = field.position;
                this.unitContainer.addChild(unit);
            }
        }
    }

    private handleUnitClick = (unit: Unit, e: InteractionEvent) => {
        console.log('click unit');
        if (this.draggingUnit === undefined) {
            this.draggingUnit = unit;
            e.stopPropagation();
        }
    };

    private handlePanelUnitClick = (type: UnitType) => {
        console.log('panel unit click', type);
        const territory = this.player.selectedTerritory;
        if (territory === undefined) {
            console.warn('no territory selected');
            return;
        }
        if (this.draggingUnit !== undefined) {
            console.warn('you can\'t drag another unit');
            return;
        }
        if (territory.money < type.cost) {
            console.warn('not enough money to buy this unit');
            return;
        }
        territory.money -= type.cost;
        this.draggingUnit = new Unit({type, onClick: this.handleUnitClick});
    };

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
            this.unitContainer.addChild(this._draggingUnit);
        }
        this._draggingUnit = unit;
        if (this._draggingUnit) {
            this._draggingUnit.interactive = false;
            this.grid.on('pointermove', this.handleDragMove);
            this.dragContainer.addChild(this._draggingUnit);
        }
    }
}
