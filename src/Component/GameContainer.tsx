import {Application} from 'pixi.js';
import * as React from 'react';
import readme from '../../README.md';
import {chooserRandom, generateEvenlyChooser} from '../Function/Generator';
import {DragManager} from '../Manager/DragManager';
import {PlayerManager, PlayerProps} from '../Manager/PlayerManager';
import {UnitTypeManager} from '../Manager/UnitTypeManager';
import {Game} from './Game';
import {HexagonProps} from './Hexagon';
import {HexagonGridGenerator} from './HexagonGridGenerator';
import {GamePanel} from './Overlay/GamePanel/GamePanel';
import {PlayerStatsProps} from './Overlay/GamePanel/PlayerStats';
import {Start} from './Overlay/Start';
import {Unit} from './Unit';
import DisplayObject = PIXI.DisplayObject;
import InteractionEvent = PIXI.interaction.InteractionEvent;
import Point = PIXI.Point;
import RenderTexture = PIXI.RenderTexture;
import SCALE_MODES = PIXI.SCALE_MODES;

interface Props {
    players: PlayerProps[];
}

interface State {
    active: 'game' | 'start' | 'readme';
    playerStatsProps?: PlayerStatsProps;
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
    private readonly canvasContainer: React.RefObject<HTMLDivElement>;
    private readonly dragContainer: React.RefObject<HTMLDivElement>;
    private readonly panelContainer: React.RefObject<HTMLDivElement>;
    private app: Application;
    private game?: Game;
    private dragManager: DragManager;
    private textureGenerator: TextureGenerator;
    private _zoom: number;

    constructor(props: any) {
        super(props);
        this.canvasContainer = React.createRef();
        this.dragContainer = React.createRef();
        this.panelContainer = React.createRef();
        this.state = {
            active: 'start',
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
                moveEventContainer: document.body,
                resolution: zoomOptions.max,
                extractImage: (image) => this.app.renderer.plugins.extract.image(image),
            });
        }
        // Zoom scroll wheel handler
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
        const hexagonProps: HexagonProps = {
            radius: 25,
            lineWidth: 2,
            lineColor: 0x000000,
        };
        const playerManager = new PlayerManager({
            players: this.props.players,
            hexagonProps: hexagonProps,
            textureGenerator: this.textureGenerator,
        });
        const generator = new HexagonGridGenerator({
            players: playerManager.players,
            hexagonProps: hexagonProps,
        });
        let chooser;
        if (options.chooser === 'evenly') {
            chooser = generateEvenlyChooser(0, playerManager.players);
        } else {
            chooser = chooserRandom;
        }
        let grid;
        if (options.shape === 'spiral' || options.shape === 'ring') {
            grid = generator[options.shape](options.radius, chooser);
        } else if (options.shape === 'load') {
            const savedGrid = JSON.parse(localStorage.getItem('savedGrid') || '');
            if (!Array.isArray(savedGrid)) {
                console.error('could not load saved grid');
                return;
            }
            grid = generator[options.shape](savedGrid);
        } else {
            grid = generator[options.shape](options.columns, options.rows, chooser);
        }
        console.info('grid', JSON.stringify(HexagonGridGenerator.save(grid, playerManager.players)));
        const unitTypeManager = new UnitTypeManager({textureGenerator: this.textureGenerator});
        const game = this.game = new Game({
            grid,
            playerManager,
            unitTypeManager,
            onWin: this.handleExitGame,
        });
        this.zoom = 1;
        // Drag/pan handlers
        game.interactive = true;
        game.on('mousedown', this.handleGamePanStart);
        game.on('mouseup', this.handleGamePanEnd);
        game.on('mouseupoutside', this.handleGamePanEnd);
        // Set game anchor to center
        const anchorX = game.width / game.scale.x * 0.5;
        const anchorY = game.height / game.scale.y * 0.5;
        game.pivot = new Point(anchorX, anchorY);
        // Init actors and start game
        for (const player of playerManager.players) {
            player.actor.init({
                player,
                game,
                dragManager: this.dragManager,
                updatePanel: (props) => this.handlePanelUpdate({player, territory: props.territory}),
            });
        }
        game.start();
        // Game must be started to get the panel width
        this.setState({active: 'game'}, () => {
            // Center game position
            let panelWidth = 0;
            if (this.panelContainer.current) {
                panelWidth = this.panelContainer.current.offsetWidth;
            }
            game.position = new Point((this.app.renderer.width - panelWidth) / 2, this.app.renderer.height / 2);
            this.app.stage.addChild(game);
        });
    };

    private panStart?: { x: number, y: number };
    private panDelayTimer?: number;

    private handleGamePanStart = (e: InteractionEvent) => {
        // Don't allow pan start if something is dragging or a movable unit is clicked
        const isDragging = this.dragManager.getDragging();
        const isMovableUnit = e.target instanceof Unit && e.target.canMove;
        if (isDragging || isMovableUnit) {
            return;
        }
        const game = e.currentTarget;
        this.panDelayTimer = setTimeout(() => {
            game.on('mousemove', this.handleGamePanMove);
        }, 100);
    };

    private handleGamePanEnd = (e: InteractionEvent) => {
        this.panStart = undefined;
        clearTimeout(this.panDelayTimer);
        e.currentTarget.off('mousemove', this.handleGamePanMove);
    };

    private handleGamePanMove = (e: InteractionEvent) => {
        const game = e.currentTarget;
        const mouse = {x: e.data.global.x, y: e.data.global.y};
        if (this.panStart === undefined) {
            this.panStart = {x: mouse.x - game.x, y: mouse.y - game.y};
        }
        game.x = mouse.x - this.panStart.x;
        game.y = mouse.y - this.panStart.y;
    };

    private handleExitGame = () => {
        if (this.game) {
            this.game.pauseAutoPlay();
        }
        this.setState({active: 'start'});
    };

    private handleResumeGame = () => {
        if (this.game) {
            this.game.resume();
            this.setState({active: 'game'});
        }
    };

    private handlePanelUpdate = (playerStatsProps: PlayerStatsProps) => {
        this.setState({playerStatsProps});
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

    renderPanel() {
        const {playerStatsProps} = this.state;
        if (playerStatsProps === undefined || this.game === undefined) {
            return;
        }
        return (
            <GamePanel {...playerStatsProps}
                       unitTypes={this.game.props.unitTypeManager.units}
                       playerManager={this.game.props.playerManager}
                       onClickUnitType={this.game.player.actor.onPanelUnitClick}
                       onClickNextTurn={this.game.nextTurns}
                       onClickExit={this.handleExitGame}
                       containerRef={this.panelContainer}
            />
        );
    }

    render() {
        const {active, options} = this.state;
        let page;
        switch (active) {
            case 'game':
                page = this.renderPanel();
                break;
            case 'readme':
                page = this.renderReadme();
                break;
            case 'start':
                page = <Start
                    options={options}
                    canResume={this.game !== undefined}
                    onClickStart={this.handleStartGame}
                    onClickResume={this.handleResumeGame}
                    onClickReadme={() => this.setState({active: 'readme'})}
                    onSetOptions={(options) => this.setState({options})}
                />;
                break;
        }
        return (
            <>
                <div className="canvas-container" ref={this.canvasContainer}/>
                {page}
                <div className="drag-container click-trough"
                     style={{
                         position: 'absolute',
                         transformOrigin: 'top left',
                         top: '0',
                         left: '0',
                         width: '100%',
                         height: '100%',
                     }}
                     ref={this.dragContainer}/>
            </>
        );
    }
}
