import * as React from 'react';
import readme from '../../README.md';
import {Human} from '../Actor/Human';
import {SimpleAI} from '../Actor/SimpleAI';
import {GameOptions} from '../Function/GameFactory';
import {PlayerProps} from '../Manager/PlayerManager';
import {GameContainer} from './GameContainer';
import {Start} from './Overlay/Start';

interface Props {
}

interface State {
    active: 'game' | 'start' | 'readme';
    gameState?: 'start' | 'pause';
    options: GameOptions;
}

const defaultPlayerProps: PlayerProps[] = [
    {
        color: 0xff0088,
        actor: new Human(),
    },
    {
        color: 0xff8800,
        actor: new SimpleAI(),
    },
    {
        color: 0xffff00,
        actor: new SimpleAI(),
    },
    {
        color: 0x00ffff,
        actor: new SimpleAI(),
    },
];

export class Main extends React.Component<Props, State> {

    constructor(props: any) {
        super(props);
        this.state = {
            active: 'start',
            options: {
                playerProps: defaultPlayerProps,
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
