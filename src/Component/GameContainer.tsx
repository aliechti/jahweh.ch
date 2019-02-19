import {Application} from 'pixi.js';
import * as React from 'react';
import {chooserRandom, generateEvenlyChooser} from '../Function/Generator';
import {Game, GamePanelProps, Player} from './Game';
import {HexagonGridGenerator} from './HexagonGridGenerator';
import {Panel} from './Overlay/Panel';
import {Start} from './Overlay/Start';
import {UnitTypeManager} from './UnitTypeManager';

interface Props {
    players: Pick<Player, 'color'>[];
}

interface State {
    isStarted: boolean;
    panelProps?: GamePanelProps;
    options: GameOptions;
}

export interface GameOptions {
    shape: Shape;
    chooser: Chooser;
    columns: number;
    rows: number;
    radius: number;
}

type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
export type Shape = FunctionPropertyNames<HexagonGridGenerator>;
export type Chooser = 'random' | 'evenly';

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
            options: {
                shape: 'spiral',
                chooser: 'evenly',
                columns: 10,
                rows: 10,
                radius: 4,
            },
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

    componentWillUnmount() {
        this.app.stop();
    }

    private handleStartGame = () => {
        const {options} = this.state;
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
        let chooser;
        if (options.chooser === 'evenly') {
            chooser = generateEvenlyChooser(0, players);
        } else {
            chooser = chooserRandom;
        }
        let grid;
        if (options.shape === 'spiral' || options.shape === 'ring') {
            grid = generator[options.shape](options.radius, chooser);
        } else {
            grid = generator[options.shape](options.columns, options.rows, chooser);
        }
        const updatePanel = this.handlePanelUpdate;
        this.unitTypeManager = new UnitTypeManager({renderer});
        this.game = new Game({renderer, grid, players, updatePanel, unitTypeManager: this.unitTypeManager});
        this.app.stage.addChild(this.game);
        this.setState({isStarted: true});
    };

    private handleExit = () => {
        this.setState({isStarted: false});
    };

    private handlePanelUpdate = (panelProps: GamePanelProps) => {
        this.setState({panelProps});
    };

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
                   onClickExit={this.handleExit}
            />
        );
    }

    render() {
        const {isStarted, options} = this.state;
        return (
            <>
                <div className="canvas-container" ref={this.canvasContainer}/>
                {isStarted
                    ? this.renderPanel()
                    : <Start options={options} onClickStart={this.handleStartGame}
                             onSetOptions={(options) => this.setState({options})}/>
                }
            </>
        );
    }
}
