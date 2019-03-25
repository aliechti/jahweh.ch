import * as React from 'react';
import {Player} from '../../../Manager/PlayerManager';
import {Territory} from '../../Territory';
import {UnitType} from '../../Unit';
import {UnitShop} from './UnitShop';

export interface GamePanelProps {
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

export class GamePanel extends React.Component<GamePanelProps, State> {
    private _isMounted: boolean;

    constructor(props: GamePanelProps) {
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
                    <UnitShop unitTypes={unitTypes} onClickUnitType={onClickUnitType}/>
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
