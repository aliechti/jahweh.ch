import * as React from 'react';
import {Player} from '../../../Manager/PlayerManager';
import {Territory} from '../../Territory';

interface Props {
    player: Player;
    territory?: Territory;
}

function colorToString(color: number): string {
    const hex = color.toString(16);
    const padding = '0'.repeat(6 - hex.length);
    return '#' + padding + hex;
}

export class PlayerStats extends React.Component<Props> {
    render() {
        const {player, territory} = this.props;
        return <>
            <div style={{color: colorToString(player.color)}}>Player</div>
            <div>Money {territory ? territory.money : 0}</div>
        </>;
    }
}
