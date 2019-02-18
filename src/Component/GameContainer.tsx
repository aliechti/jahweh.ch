import {Application} from 'pixi.js';
import * as React from 'react';
import {generateEvenlyChooser} from '../Function/Generator';
import {Game, GamePanelProps, Player} from './Game';
import {HexagonGridGenerator} from './HexagonGridGenerator';
import {Panel} from './Panel';
import {UnitTypeManager} from './UnitTypeManager';

interface Props {
    players: Pick<Player, 'color'>[];
}

interface State {
    isStarted: boolean;
    panelProps?: GamePanelProps;
}

export class GameContainer extends React.Component<Props, State> {
    private canvasContainer: React.RefObject<HTMLDivElement>;
    private app: Application;
    private game?: Game;
    private unitTypeManager?: UnitTypeManager;

    constructor(props: any) {
        super(props);
        this.canvasContainer = React.createRef();
        this.state = {
            isStarted: false,
        };
    }

    componentDidMount(): void {
        this.app = new Application(window.innerWidth, window.innerHeight, {
            antialias: true,
        });
        const container = this.canvasContainer.current;
        if (container) {
            container.appendChild(this.app.view);
            window.addEventListener('resize', () => {
                this.app.renderer.resize(window.innerWidth, window.innerHeight);
            });
        }
    }

    private handleStartGame = () => {
        this.app.stage.removeChildren();
        const renderer = this.app.renderer;
        const generator = new HexagonGridGenerator({
            players: this.props.players,
            hexagonProps: {
                radius: 25,
                lineWidth: 2,
                lineColor: 0x000000,
            },
            renderer,
        });
        const players = generator.props.players;
        const grid = generator.ring(4, generateEvenlyChooser(0, players));
        const updatePanel = this.handlePanelUpdate;
        this.unitTypeManager = new UnitTypeManager({renderer});
        this.game = new Game({renderer, grid, players, updatePanel, unitTypeManager: this.unitTypeManager});
        this.app.stage.addChild(this.game);
        this.setState({isStarted: true});
    };

    private handlePanelUpdate = (panelProps: GamePanelProps) => {
        this.setState({panelProps});
    };

    componentWillUnmount() {
        this.app.stop();
    }

    renderPanel() {
        const {panelProps} = this.state;
        if (panelProps === undefined || this.unitTypeManager === undefined || this.game === undefined) {
            return;
        }
        return (
            <Panel {...panelProps}
                   unitTypes={this.unitTypeManager.units}
                   onClickUnitType={this.game.handlePanelUnitClick}
                   onClickNextTurn={this.game.nextTurn}
            />
        );
    }

    render() {
        const {isStarted} = this.state;
        return (
            <>
                <div className="canvas-container" ref={this.canvasContainer}/>
                {isStarted
                    ? this.renderPanel()
                    :
                    <div className="start full">
                        <div className="center" style={{textAlign: 'center'}}>
                            <button type="button" onClick={this.handleStartGame}>Start</button>
                        </div>
                    </div>
                }
            </>
        );
    }
}
