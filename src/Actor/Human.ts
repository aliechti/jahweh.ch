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
                unit.setInteractive(true);
            }
        }
        // Update Panel
        this.props.updatePanel({});
    };

    public onTurnEnd = () => {
        const fields = this.getPlayerFields(this.props.player);
        const units = this.getFieldUnits(fields);
        this.selectTerritory();
        // Remove player unit interactivity
        for (const unit of units) {
            unit.setInteractive(false);
        }
        // Remove click handlers
        for (const [field, handler] of this.fieldClickHandlers) {
            field.off('click', handler);
            this.fieldClickHandlers.delete(field);
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
        const draggingUnit = dragManager.getDragging();
        console.log('click field');
        if (draggingUnit !== undefined) {
            // If the unit has a field its already bought
            if (unitManager.getField(draggingUnit)) {
                movementManager.move(draggingUnit, field, player);
                draggingUnit.setInteractive(draggingUnit.canMove);
            } else if (this.selectedTerritory) {
                const newUnit = buyUnit(draggingUnit.props.type, field, this.selectedTerritory);
                if (newUnit) {
                    // Update panel money
                    updatePanel({territory: this.selectedTerritory});
                    newUnit.setInteractive(newUnit.canMove);
                }
            }
            // Recalculate selected territory
            this.selectTerritory(this.selectedTerritory);
            // Reset unit dragging
            dragManager.setDragging(undefined);
        } else if (field.player === player) {
            // Only select other territory/unit if no unit is dragging and its the current player
            this.selectTerritory(field.territory);
            if (field.unit && field.unit.canMove) {
                dragManager.setDragging(field.unit, e.data.global);
            }
        } else {
            console.warn('Can\'t use another players territory');
        }
    };

    private selectTerritory = (territory?: Territory) => {
        if (this.selectedTerritory) {
            this.tintTerritory(this.selectedTerritory, 0xffffff);
        }
        if (territory) {
            this.tintTerritory(territory, 0xaaaaaa);
        }
        this.selectedTerritory = territory;
        this.props.updatePanel({territory});
    };

    private tintTerritory(territory: Territory, tint: number) {
        for (const field of territory.props.fields) {
            field.tint = tint;
        }
    }
}
