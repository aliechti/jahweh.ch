import {Application} from 'pixi.js';
import {HexagonGrid, HexagonGridProps} from './HexagonGrid';
import {HexagonProps} from './Hexagon';
import {Territory} from './Territory';
import {UnitTypeManager} from './UnitTypeManager';
import {Unit, UnitType} from './Unit';
import {Panel, PanelProps} from './Panel';
import {ExplicitContainer} from '../Interface/ExplicitContainer';
import {HexagonField} from './HexagonField';
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
                if (this.draggingUnit !== undefined) {
                    const originalField = this.draggingUnit.props.field;
                    const unit = this.draggingUnit;
                    const success = this.handleUnitMovement(unit, field);
                    // Reset unit dragging
                    this.draggingUnit = undefined;
                    if (!success) {
                        // Reset unit position
                        if (originalField) {
                            unit.position = originalField.position;
                        } else {
                            console.warn('Newly bought unit cant move there');
                            // todo: refactor, it gets added to the unitContainer from the dragging setter
                            // todo: revert payment
                            this.unitContainer.removeChild(unit);
                        }
                    }
                } else if (field.player === this.player) {
                    // Only select other territory if no unit is dragging and its the current player
                    this.tintTerritory(this.player.selectedTerritory, 0xffffff);
                    this.player.selectedTerritory = field.territory;
                    this.panel.setTerritory(field.territory);
                    this.tintTerritory(this.player.selectedTerritory, 0x555555);
                } else {
                    console.warn('Can\'t use another players territory');
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

    private handleUnitMovement = (unit: Unit, field: HexagonField): boolean => {
        if (field.unit !== undefined) {
            // todo: implement unit attacking
            console.warn('Unit can\'t move to this field');
            return false;
        }
        // Use unit field territory
        let territory;
        if (unit.props.field && unit.props.field.territory) {
            territory = unit.props.field.territory;
        } else {
            // Use selected territory if new unit bought and doesn't have a field attached yet
            territory = this.player.selectedTerritory;
        }
        if (territory === undefined) {
            console.warn('No territory selected');
            return false;
        }
        const fieldTerritory = field.territory;
        if (fieldTerritory === undefined) {
            console.warn('Field has no territory');
            return false;
        }
        const neighbors = this.grid.getTerritoryNeighbors(territory);
        const isMovingToNeighbors = neighbors.includes(field);
        const isMovingInsideTerritory = territory.props.fields.includes(field);
        if (isMovingToNeighbors) {
            console.log('is moving to neighbors');
        }
        if (isMovingInsideTerritory) {
            console.log('is moving inside territory');
        }
        if (!isMovingToNeighbors && !isMovingInsideTerritory) {
            console.warn('Unit can only move to neighbors or inside same territory');
            return false;
        }
        // Remove unit from previous field
        if (unit.props.field) {
            unit.props.field.unit = undefined;
        }
        // Add field to unit
        unit.props.field = field;
        // Set unit to new field
        field.unit = unit;
        // Reset unit position
        field.unit.position = field.position;
        return true;
    };

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
