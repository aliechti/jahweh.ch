import {Application} from 'pixi.js';
import * as React from 'react';
import {chooserRandom, generateEvenlyChooser} from '../Function/Generator';
import {DragManager} from '../Manager/DragManager';
import {PlayerManager, PlayerProps} from '../Manager/PlayerManager';
import {UnitTypeManager} from '../Manager/UnitTypeManager';
import {Game} from './Game';
import {HexagonProps} from './Hexagon';
import {HexagonGridGenerator} from './HexagonGridGenerator';
import {GamePanel} from './Overlay/GamePanel/GamePanel';
import {PlayerStatsProps} from './Overlay/GamePanel/PlayerStats';
import {Unit} from './Unit';
import DisplayObject = PIXI.DisplayObject;
import InteractionEvent = PIXI.interaction.InteractionEvent;
import Point = PIXI.Point;
import RenderTexture = PIXI.RenderTexture;
import SCALE_MODES = PIXI.SCALE_MODES;

interface Props {
    players: PlayerProps[];
    options: GameOptions;
    state: 'start' | 'pause';
    handleExit: () => void;
}

interface State {
    playerStatsProps?: PlayerStatsProps;
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
    private game: Game;
    private dragManager: DragManager;
    private textureGenerator: TextureGenerator;
    private _zoom: number;

    constructor(props: any) {
        super(props);
        this.canvasContainer = React.createRef();
        this.dragContainer = React.createRef();
        this.panelContainer = React.createRef();
        this.state = {};
    }

    componentDidMount(): void {
        this.app = new Application(window.innerWidth, window.innerHeight, {
            antialias: true,
        });
        this.textureGenerator = (displayObject) => {
            return this.app.renderer.generateTexture(displayObject, SCALE_MODES.LINEAR, zoomOptions.max);
        };
        this.canvasContainer.current!.appendChild(this.app.view);
        this.dragManager = new DragManager({
            container: this.dragContainer.current!,
            moveEventContainer: document.body,
            resolution: zoomOptions.max,
            extractImage: (image) => this.app.renderer.plugins.extract.image(image),
        });
        // Resize handler
        window.addEventListener('resize', () => {
            this.app.renderer.resize(window.innerWidth, window.innerHeight);
        });
        // Zoom scroll wheel handler
        window.addEventListener('wheel', this.handleScroll);
        // Start
        this.handleStartGame();
    }

    componentWillUnmount() {
        this.app.stop();
        window.removeEventListener('wheel', this.handleScroll);
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        if (this.props.state !== prevProps.state) {
            switch (this.props.state) {
                case 'start':
                    this.handleResumeGame();
                    break;
                case 'pause':
                    this.handleExitGame();
                    break;
            }
        }
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
        const {options} = this.props;
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
        game.on('touchstart', this.handleGamePanStart);
        game.on('touchend', this.handleGamePanEnd);
        game.on('touchendoutside', this.handleGamePanEnd);
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
        // Center game position
        let panelWidth = 0;
        if (this.panelContainer.current) {
            panelWidth = this.panelContainer.current.offsetWidth;
        }
        game.position = new Point((this.app.renderer.width - panelWidth) / 2, this.app.renderer.height / 2);
        this.app.stage.addChild(game);
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
            game.on('touchmove', this.handleGamePanMove);
        }, 100);
    };

    private handleGamePanEnd = (e: InteractionEvent) => {
        this.panStart = undefined;
        clearTimeout(this.panDelayTimer);
        e.currentTarget.off('mousemove', this.handleGamePanMove);
        e.currentTarget.off('touchmove', this.handleGamePanMove);
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
        this.game.pauseAutoPlay();
        this.props.handleExit();
    };

    private handleResumeGame = () => {
        this.game.resume();
    };

    private handlePanelUpdate = (playerStatsProps: PlayerStatsProps) => {
        this.setState({playerStatsProps});
    };

    get zoom(): number {
        return this._zoom;
    }

    set zoom(value: number) {
        this._zoom = Math.min(Math.max(value, zoomOptions.min), zoomOptions.max);
        this.game.scale = new Point(this._zoom, this._zoom);
        this.dragManager.zoom = this._zoom;
    }

    renderPanel() {
        const {playerStatsProps} = this.state;
        if (playerStatsProps === undefined) {
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
        const {state} = this.props;
        return (
            <>
                <div className="canvas-container" ref={this.canvasContainer}/>
                {state === 'start' ? this.renderPanel() : ''}
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
