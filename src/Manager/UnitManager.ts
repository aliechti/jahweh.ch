import {HexagonField} from '../Component/HexagonField';
import {Territory} from '../Component/Territory';
import {Unit, UnitType} from '../Component/Unit';
import {UnitTypeManager} from './UnitTypeManager';
import Container = PIXI.Container;
import InteractionEvent = PIXI.interaction.InteractionEvent;

interface Props {
    unitTypeManager: UnitTypeManager;
    unitContainer: Container;
    handleUnitClick: (unit: Unit, e: InteractionEvent) => void;
}

export class UnitManager {
    private props: Props;

    constructor(props: Props) {
        this.props = props;
    }

    public add(type: UnitType, field: HexagonField) {
        const unit = new Unit({
            type: type,
            field: field,
            onClick: this.props.handleUnitClick,
        });
        this.set(unit, field);
        this.props.unitContainer.addChild(unit);
    }

    public set(unit: Unit, field: HexagonField) {
        // Remove unit from previous field
        if (unit.props.field) {
            unit.props.field.unit = undefined;
        } else {
            // Unit has no field, so it must be newly bought
            this.props.unitContainer.addChild(unit);
        }
        // Add field to unit
        unit.props.field = field;
        // Set unit to new field
        field.unit = unit;
        // Reset unit position
        unit.position = field.position;
    }

    public delete(unit: Unit | undefined) {
        if (unit && unit.props.field) {
            unit.props.field.unit = undefined;
            unit.props.field = undefined;
            this.props.unitContainer.removeChild(unit);
        }
    }

    public getTerritoryMainBuilding(territory: Territory): Unit | undefined {
        const field = territory.props.fields.find((item) => {
            return item.unit !== undefined && item.unit.props.type === this.props.unitTypeManager.mainBuilding;
        });
        if (field === undefined) {
            return undefined;
        }
        return field.unit;
    }
}
