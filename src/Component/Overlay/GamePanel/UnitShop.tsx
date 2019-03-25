import * as React from 'react';
import {UnitType} from '../../Unit';

export interface UnitShopProps {
    unitTypes: UnitType[];
    onClickUnitType: (type: UnitType, position: { x: number, y: number }) => void;
}

export class UnitShop extends React.Component<UnitShopProps> {
    render() {
        const {unitTypes, onClickUnitType} = this.props;
        return unitTypes.map((type) => {
            if (type.isBuildable) {
                const title = `cost: ${type.cost}\n`
                    + `salary: ${type.salary}\n`
                    + `movable: ${type.isMovable ? 'true' : 'false'}`;
                return <button key={type.name} type="button" title={title}
                               onClick={(e) => onClickUnitType(type, {
                                   x: e.clientX,
                                   y: e.clientY,
                               })}>{type.name}</button>;
            }
        });
    }
}
