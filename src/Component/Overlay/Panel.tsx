import * as React from 'react';
import {Player} from '../../Manager/PlayerManager';
import {Territory} from '../Territory';
import {UnitType} from '../Unit';

export interface PanelProps {
    player: Player;
    territory?: Territory;
    unitTypes: UnitType[];
    onClickUnitType: (type: UnitType, position: { x: number, y: number }) => void;
    onClickNextTurn: () => Promise<void>;
    onClickExit: () => void;
    containerRef?: React.RefObject<HTMLDivElement>;
}

interface State {
    isAutoplayRunning: boolean;
}

function colorToString(color: number): string {
    const hex = color.toString(16);
    const padding = '0'.repeat(6 - hex.length);
    return '#' + padding + hex;
}

export class Panel extends React.Component<PanelProps, State> {
    private _isMounted: boolean;

    constructor(props: PanelProps) {
        super(props);
        this.state = {
            isAutoplayRunning: false,
        };
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    render() {
        const {player, territory, unitTypes, onClickUnitType, onClickNextTurn, onClickExit, containerRef} = this.props;
        const {isAutoplayRunning} = this.state;
        return (
            <div ref={containerRef} className="full click-trough" style={{left: 'auto', width: '250px'}}>
                <div>
                    <div style={{color: colorToString(player.color)}}>Player</div>
                    <div>Money {territory ? territory.money : 0}</div>
                </div>
                <div className="unit-shop">
                    {unitTypes.map((type) => {
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
                    })}
                </div>
                <div>
                    <button type="button" disabled={isAutoplayRunning} onClick={() => {
                        this.setState({isAutoplayRunning: true});
                        onClickNextTurn().then(() => {
                            this._isMounted && this.setState({isAutoplayRunning: false});
                        });
                    }}>Next turn
                    </button>
                </div>
                <div>
                    <button type="button" onClick={onClickExit}>Exit game</button>
                </div>
            </div>
        );
    }
}
