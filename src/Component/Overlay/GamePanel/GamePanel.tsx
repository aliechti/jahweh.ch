import * as React from 'react';
import {PlayerStatistics, PlayerStatisticsProps} from './PlayerStatistics';
import {PlayerStats, PlayerStatsProps} from './PlayerStats';
import {UnitShop, UnitShopProps} from './UnitShop';

export interface GamePanelProps extends PlayerStatsProps, UnitShopProps, PlayerStatisticsProps {
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
        const {playerManager} = this.props;
        const {isAutoplayRunning} = this.state;
        return (
            <div ref={containerRef} className="full click-trough row"
                 style={{left: 'auto', width: '250px', padding: '1rem'}}
            >
                <div className="col-12">
                    <PlayerStats player={player} territory={territory}/>
                </div>
                <div className="col-12">
                    <UnitShop unitTypes={unitTypes} onClickUnitType={onClickUnitType}/>
                </div>
                <div className="col-12">
                    <PlayerStatistics playerManager={playerManager}/>
                </div>
                <div className="col-12">
                    <button type="button" disabled={isAutoplayRunning} onClick={() => {
                        this.setState({isAutoplayRunning: true});
                        onClickNextTurn().then(() => {
                            this._isMounted && this.setState({isAutoplayRunning: false});
                        });
                    }}>Next turn
                    </button>
                </div>
                <div className="col-12">
                    <button type="button" onClick={onClickExit}>Exit game</button>
                </div>
            </div>
        );
    }
}
