import * as React from 'react';
import {colorToString} from '../../../Function/Color';
import {Player} from '../../../Manager/PlayerManager';
import {Territory} from '../../Territory';

export interface PlayerStatsProps {
    player: Player;
    territory?: Territory;
}
export class PlayerStats extends React.Component<PlayerStatsProps> {
    render() {
        const {player, territory} = this.props;
        return <>
            <div style={{color: colorToString(player.color)}}>Player</div>
            <div style={{visibility: !territory ? 'hidden' : undefined}}>Money {territory ? territory.money : 0}</div>
        </>;
    }
}
