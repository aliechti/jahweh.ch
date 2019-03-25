import * as React from 'react';
import {PlayerStats, PlayerStatsProps} from './PlayerStats';
import {UnitShop, UnitShopProps} from './UnitShop';

export interface GamePanelProps extends PlayerStatsProps, UnitShopProps {
    onClickNextTurn: () => Promise<void>;
    onClickExit: () => void;
    containerRef?: React.RefObject<HTMLDivElement>;
}

interface State {
    isAutoplayRunning: boolean;
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
                    <PlayerStats player={player} territory={territory}/>
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
