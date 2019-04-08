import * as React from 'react';
import {colorToString, stringToColor} from '../../Function/Color';
import {Actors, PlayerProps} from '../../Function/PlayerFactory';

interface Props {
    playerProps: PlayerProps[];
    onSetPlayerProps: (playerProps: PlayerProps[]) => void;
}

const actors: Actors[] = ['human', 'simpleAi'];

export class PlayerSelector extends React.Component<Props> {

    private handleSetPlayer = (player: PlayerProps, name: keyof PlayerProps, value: any) => {
        const {playerProps, onSetPlayerProps} = this.props;
        player[name] = value;
        onSetPlayerProps(playerProps);
    };

    private handleAddPlayer = () => {
        const {playerProps, onSetPlayerProps} = this.props;
        playerProps.push({
            color: Math.floor(Math.random() * 0xffffff + 1),
            actor: 'simpleAi',
        });
        onSetPlayerProps(playerProps);
    };

    renderPlayer = (player: PlayerProps, index: number) => {
        return (
            <div className="row" key={index}>
                <div className="col-auto">
                    <select
                        value={player.actor}
                        onChange={(e) => this.handleSetPlayer(player, 'actor', e.target.value)}
                    >
                        {actors.map((actor) => {
                            return <option key={actor} value={actor}>{actor}</option>;
                        })}
                    </select>
                </div>
                <div className="col-auto">
                    <input
                        type="color"
                        value={colorToString(player.color)}
                        onChange={(e) => this.handleSetPlayer(player, 'color', stringToColor(e.target.value))}
                    />
                </div>
            </div>
        );
    };

    render() {
        const {playerProps} = this.props;
        return (
            <>
                <label>Players</label>
                {playerProps.map(this.renderPlayer)}
                <button onClick={this.handleAddPlayer}>Add player</button>
            </>
        );
    }
}
