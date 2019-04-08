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

    private handleRemovePlayer = (player: PlayerProps) => {
        const {playerProps, onSetPlayerProps} = this.props;
        const index = playerProps.indexOf(player);
        if (index !== -1) {
            playerProps.splice(index, 1);
        }
        onSetPlayerProps(playerProps);
    };

    renderPlayer = (player: PlayerProps, index: number) => {
        return (
            <div className="row" key={index} style={{flexWrap: 'nowrap'}}>
                <div className="col-8">
                    <select
                        value={player.actor}
                        onChange={(e) => this.handleSetPlayer(player, 'actor', e.target.value)}
                    >
                        {actors.map((actor) => {
                            return <option key={actor} value={actor}>{actor}</option>;
                        })}
                    </select>
                </div>
                <div className="col-2 max-2">
                    <input
                        type="color"
                        value={colorToString(player.color)}
                        onChange={(e) => this.handleSetPlayer(player, 'color', stringToColor(e.target.value))}
                    />
                </div>
                {index > 1 ?
                    <div className="col-2">
                        <button onClick={() => this.handleRemovePlayer(player)}>x</button>
                    </div>
                    : ''}
            </div>
        );
    };

    render() {
        const {playerProps} = this.props;
        return (
            <>
                <label>Players</label>
                <div className="scrollable" style={{maxHeight: '20rem'}}>
                    {playerProps.map(this.renderPlayer)}
                </div>
                <button onClick={this.handleAddPlayer}>Add player</button>
            </>
        );
    }
}
