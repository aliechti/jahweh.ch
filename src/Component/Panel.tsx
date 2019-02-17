import * as React from 'react';
import {Player} from './Game';
import {Territory} from './Territory';
import {UnitType} from './Unit';

export interface PanelProps {
    player: Player;
    territory?: Territory;
    unitTypes: UnitType[];
    onClickUnitType: (type: UnitType) => void;
    onClickNextTurn: () => void;
}

function colorToString(color: number): string {
    const hex = color.toString(16);
    const padding = '0'.repeat(6 - hex.length);
    return '#' + padding + hex;
}

export class Panel extends React.Component<PanelProps> {
    constructor(props: PanelProps) {
        super(props);
        this.state = {};
    }

    render() {
        const {player, territory, unitTypes, onClickUnitType, onClickNextTurn} = this.props;
        return (
            <div className="full click-trough" style={{left: 'auto', width: '250px'}}>
                <div>
                    <div style={{color: colorToString(player.color)}}>Player</div>
                    <div>Money {territory ? territory.money : 0}</div>
                </div>
                <div className="unit-shop">
                    {unitTypes.map((type) => {
                        if (type.isBuildable) {
                            return <button key={type.name} type="button"
                                           onClick={() => onClickUnitType(type)}>{type.name}</button>;
                        }
                    })}
                </div>
                <div>
                    <button type="button" onClick={onClickNextTurn}>Next turn</button>
                </div>
            </div>
        );
    }
}
