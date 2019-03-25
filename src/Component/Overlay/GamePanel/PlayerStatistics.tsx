import * as React from 'react';
import {colorToString, PlayerManager} from '../../../Manager/PlayerManager';

export interface PlayerStatisticsProps {
    playerManager: PlayerManager;
}

export class PlayerStatistics extends React.Component<PlayerStatisticsProps> {
    render() {
        const {playerManager} = this.props;
        const players = playerManager.players.map((player) => {
            const color = player.color;
            const fieldCount = player.territories.map(
                (territory) => territory.props.fields,
            ).reduce((previous, current) => {
                return Array().concat(previous, current);
            }).length;
            return {color, fieldCount};
        });
        const maxFieldCount = Math.max(...players.map((player) => player.fieldCount));
        return <div style={{display: 'flex', height: '4rem', alignItems: 'flex-end'}}>
            {players.map((player) => {
                const height = player.fieldCount / maxFieldCount * 100;
                return (
                    <div style={{
                        background: colorToString(player.color),
                        height: `${height}%`,
                        flex: '1 1 0',
                    }}/>
                );
            })}
        </div>;
    }
}
