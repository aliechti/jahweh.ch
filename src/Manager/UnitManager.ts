import {HexagonField} from '../Component/HexagonField';
import {Territory} from '../Component/Territory';
import {Unit, UnitType} from '../Component/Unit';
import {UnitTypeManager} from './UnitTypeManager';
import Container = PIXI.Container;

interface Props {
    unitTypeManager: UnitTypeManager;
    unitContainer: Container;
}

export class UnitManager {
    private props: Props;
    private unitsField: WeakMap<Unit, HexagonField>;

    constructor(props: Props) {
        this.props = props;
        this.unitsField = new WeakMap();
    }

    public add(type: UnitType, field: HexagonField) {
        const unit = new Unit({type});
        this.set(unit, field);
        this.props.unitContainer.addChild(unit);
    }

    public set(unit: Unit, field: HexagonField) {
        // Remove unit from previous field
        const previousField = this.unitsField.get(unit);
        if (previousField) {
            previousField.unit = undefined;
        } else {
            // Probably not in container yet
            this.props.unitContainer.addChild(unit);
        }
        // Add field to unit
        this.unitsField.set(unit, field);
        // Set unit to new field
        field.unit = unit;
        // Reset unit position
        unit.position = field.position;
    }

    public delete(unit: Unit | undefined) {
        if (unit === undefined) {
            return;
        }
        const previousField = this.unitsField.get(unit);
        if (previousField) {
            previousField.unit = undefined;
            this.unitsField.delete(unit);
            this.props.unitContainer.removeChild(unit);
        }
    }

    public getField(unit: Unit): HexagonField | undefined {
        return this.unitsField.get(unit);
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
