import {Application} from 'pixi.js';
import * as React from 'react';
import {chooserRandom, generateEvenlyChooser} from '../Function/Generator';
import {DragManager} from '../Manager/DragManager';
import {UnitTypeManager} from '../Manager/UnitTypeManager';
import {Game, GamePanelProps, Player} from './Game';
import {HexagonGridGenerator} from './HexagonGridGenerator';
import {Panel} from './Overlay/Panel';
import {Start} from './Overlay/Start';
import DisplayObject = PIXI.DisplayObject;
import Point = PIXI.Point;
import RenderTexture = PIXI.RenderTexture;
import SCALE_MODES = PIXI.SCALE_MODES;

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

export type TextureGenerator = (displayObject: DisplayObject) => RenderTexture;

type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
export type Shape = FunctionPropertyNames<HexagonGridGenerator>;
export type Chooser = 'random' | 'evenly';

const zoomOptions = {
    min: 0.5,
    max: 2,
    steps: 0.1,
};

export class GameContainer extends React.Component<Props, State> {
    private canvasContainer: React.RefObject<HTMLDivElement>;
    private dragContainer: React.RefObject<HTMLDivElement>;
    private app: Application;
    private game?: Game;
    private unitTypeManager?: UnitTypeManager;
    private dragManager: DragManager;
    private textureGenerator: TextureGenerator;
    private _zoom: number;

    constructor(props: any) {
        super(props);
        this.canvasContainer = React.createRef();
        this.dragContainer = React.createRef();
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
        this.textureGenerator = (displayObject) => {
            return this.app.renderer.generateTexture(displayObject, SCALE_MODES.LINEAR, zoomOptions.max);
        };
        const canvasContainer = this.canvasContainer.current;
        if (canvasContainer) {
            canvasContainer.appendChild(this.app.view);
            window.addEventListener('resize', () => {
                this.app.renderer.resize(window.innerWidth, window.innerHeight);
            });
        }
        const dragContainer = this.dragContainer.current;
        if (dragContainer) {
            this.dragManager = new DragManager({
                container: dragContainer,
                resolution: zoomOptions.max,
                extractImage: (image) => this.app.renderer.plugins.extract.image(image),
            });
        }
        window.addEventListener('wheel', this.handleScroll);
    }

    componentWillUnmount() {
        this.app.stop();
        window.removeEventListener('wheel', this.handleScroll);
    }

    private handleScroll = (e: WheelEvent) => {
        if (e.deltaY > 0) {
            // out
            this.zoom -= this.zoom * zoomOptions.steps;
        } else {
            // in
            this.zoom += this.zoom * zoomOptions.steps;
        }
    };

    private handleStartGame = () => {
        const {options} = this.state;
        this.app.stage.removeChildren();
        const generator = new HexagonGridGenerator({
            players: this.props.players,
            hexagonProps: {
                radius: 25,
                lineWidth: 2,
                lineColor: 0x000000,
            },
            textureGenerator: this.textureGenerator,
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
        this.unitTypeManager = new UnitTypeManager({textureGenerator: this.textureGenerator});
        this.game = new Game({
            grid,
            players,
            updatePanel,
            unitTypeManager: this.unitTypeManager,
            dragManager: this.dragManager,
        });
        this.zoom = 1;
        this.app.stage.addChild(this.game);
        this.setState({isStarted: true});
    };

    private handleExit = () => {
        this.setState({isStarted: false});
    };

    private handlePanelUpdate = (panelProps: GamePanelProps) => {
        this.setState({panelProps});
    };

    get zoom(): number {
        return this._zoom;
    }

    set zoom(value: number) {
        if (this.game) {
            this._zoom = Math.min(Math.max(value, zoomOptions.min), zoomOptions.max);
            this.game.scale = new Point(this._zoom, this._zoom);
            this.dragManager.zoom = this._zoom;
        }
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
                <div className="drag-container click-trough"
                     style={{position: 'absolute', transformOrigin: 'top left', top: '0', left: '0'}}
                     ref={this.dragContainer}/>
            </>
        );
    }
}