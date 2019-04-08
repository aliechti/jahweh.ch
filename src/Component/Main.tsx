import * as React from 'react';
import readme from '../../README.md';
import {GameOptions} from '../Function/GameFactory';
import {PlayerProps} from '../Manager/PlayerManager';
import {GameContainer} from './GameContainer';
import {Start} from './Overlay/Start';

interface Props {
    players: PlayerProps[];
}

interface State {
    active: 'game' | 'start' | 'readme';
    gameState?: 'start' | 'pause';
    options: GameOptions;
}

export class Main extends React.Component<Props, State> {

    constructor(props: any) {
        super(props);
        this.state = {
            active: 'start',
            options: {
                players: this.props.players,
                shape: 'hexagon',
                playerPicker: 'even',
                columns: 10,
                rows: 10,
                radius: 4,
            },
        };
    }

    renderReadme() {
        return (
            <div className="full background-dim row" style={{overflow: 'auto', padding: '1rem', fontSize: '75%'}}>
                <div className="center" style={{maxWidth: '45rem'}}>
                    <article dangerouslySetInnerHTML={{__html: readme}}/>
                    <button type="button" onClick={() => this.setState({active: 'start'})}>Back</button>
                </div>
            </div>
        );
    }

    handleStart = () => {
        this.setState({gameState: undefined, active: 'game'}, () => this.setState({gameState: 'start'}));
    };

    handleResume = () => {
        this.setState({gameState: 'start', active: 'game'});
    };

    render() {
        const {active, gameState, options} = this.state;
        let page;
        switch (active) {
            case 'readme':
                page = this.renderReadme();
                break;
            case 'start':
                page = <Start
                    options={options}
                    canResume={gameState === 'pause'}
                    onClickStart={this.handleStart}
                    onClickResume={this.handleResume}
                    onClickReadme={() => this.setState({active: 'readme'})}
                    onSetOptions={(options) => this.setState({options})}
                />;
                break;
        }
        return (
            <>
                {page}
                {gameState ?
                    <GameContainer
                        options={options}
                        state={gameState}
                        handleExit={() => this.setState({gameState: 'pause', active: 'start'})}
                    />
                    : ''
                }
            </>
        );
    }
}
