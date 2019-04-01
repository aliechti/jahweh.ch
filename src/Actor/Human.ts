import {HexagonField} from '../Component/HexagonField';
import {Territory} from '../Component/Territory';
import {Unit, UnitType} from '../Component/Unit';
import {Actor, ActorProps, Player} from '../Manager/PlayerManager';
import InteractionEvent = PIXI.interaction.InteractionEvent;

type InteractionHandler = (e: InteractionEvent) => void;

export class Human implements Actor {

    public selectedTerritory?: Territory;
    private props: ActorProps;
    private fieldClickHandlers: Map<HexagonField, InteractionHandler> = new Map();
    private unitClickHandlers: Map<Unit, InteractionHandler> = new Map();

    public init = (props: ActorProps) => {
        this.props = props;
    };

    public onTurnStart = () => {
        const {player, map} = this.props.game;
        // Set player field interactivity
        for (const field of map.grid.fields()) {
            const clickHandler = (e: InteractionEvent) => this.handleFieldClick(field, e);
            field.on('click', clickHandler);
            this.fieldClickHandlers.set(field, clickHandler);
            field.interactive = true;
        }
        // Set player unit interactivity
        const fields = this.getPlayerFields(player);
        const units = this.getFieldUnits(fields);
        for (const unit of units) {
            if (unit.canMove) {
                const clickHandler = (e: InteractionEvent) => this.handleUnitClick(unit, e);
                unit.on('click', clickHandler);
                this.unitClickHandlers.set(unit, clickHandler);
                unit.setInteractive(true);
            }
        }
    };

    public onTurnEnd = () => {
        const fields = this.getPlayerFields(this.props.player);
        const units = this.getFieldUnits(fields);
        this.unselectTerritory();
        // Remove player unit interactivity
        for (const unit of units) {
            unit.setInteractive(false);
        }
        // Remove click handlers
        for (const [field, handler] of this.fieldClickHandlers) {
            field.off('click', handler);
            this.fieldClickHandlers.delete(field);
        }
        for (const [unit, handler] of this.unitClickHandlers) {
            unit.off('click', handler);
            this.unitClickHandlers.delete(unit);
        }
    };

    public onPanelUnitClick = (type: UnitType, position: { x: number, y: number }) => {
        const {dragManager} = this.props;
        console.log('panel unit click', type);
        const territory = this.selectedTerritory;
        if (territory === undefined) {
            console.warn('no territory selected');
            return;
        }
        if (dragManager.getDragging() !== undefined) {
            console.warn('you can\'t drag another unit');
            return;
        }
        if (territory.money < type.cost) {
            console.warn('not enough money to buy this unit');
            return;
        }
        const unit = new Unit({type});
        dragManager.setDragging(unit, position);
    };

    private getFieldUnits(fields: HexagonField[]): Unit[] {
        return fields.map((field) => {
            return field.unit;
        }).filter((unit) => unit !== undefined) as Unit[];
    }

    private getPlayerFields(player: Player): HexagonField[] {
        return player.territories.map(
            (territory) => territory.props.fields,
        ).reduce((previous, current) => {
            return Array().concat(previous, current);
        });
    }

    private handleFieldClick = (field: HexagonField, e: InteractionEvent) => {
        const {player, movementManager, buyUnit, unitManager} = this.props.game;
        const {dragManager, updatePanel} = this.props;
        const unit = dragManager.getDragging();
        console.log('click field');
        if (unit !== undefined) {
            // If the unit has a field its already bought
            if (unitManager.getField(unit)) {
                movementManager.move(unit, field, player);
            } else if (this.selectedTerritory) {
                const newUnit = buyUnit(unit.props.type, field, this.selectedTerritory);
                if (newUnit) {
                    // Update panel money
                    updatePanel({territory: this.selectedTerritory});
                    if (newUnit.canMove) {
                        newUnit.setInteractive(true);
                    }
                }
            }
            // Recalculate selected territory
            if (this.selectedTerritory) {
                this.selectTerritory(this.selectedTerritory);
            }
            // Reset unit dragging
            dragManager.setDragging(undefined);
        } else if (field.player === player) {
            // Only select other territory/unit if no unit is dragging and its the current player
            if (field.territory) {
                this.selectTerritory(field.territory);
            }
            if (field.unit && field.unit.canMove) {
                this.handleUnitClick(field.unit, e);
            }
        } else {
            console.warn('Can\'t use another players territory');
        }
    };

    private handleUnitClick = (unit: Unit, e: InteractionEvent) => {
        console.log('click unit');
        const {dragManager} = this.props;
        const field = this.props.game.unitManager.getField(unit);
        if (dragManager.getDragging() === undefined) {
            dragManager.setDragging(unit, e.data.global);
            if (field && field.territory) {
                this.selectTerritory(field.territory);
            }
        } else if (field) {
            this.handleFieldClick(field, e);
        }
    };

    private selectTerritory = (territory: Territory) => {
        this.unselectTerritory();
        this.selectedTerritory = territory;
        this.props.updatePanel({territory});
        this.tintTerritory(this.selectedTerritory, 0x555555);
    };

    private unselectTerritory() {
        if (this.selectedTerritory) {
            this.tintTerritory(this.selectedTerritory, 0xffffff);
            this.selectedTerritory = undefined;
        }
    }

    private tintTerritory(territory: Territory | undefined, tint: number) {
        if (territory) {
            for (const field of territory.props.fields) {
                field.tint = tint;
            }
        }
    }
}
