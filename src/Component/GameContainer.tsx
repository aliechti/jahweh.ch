import {Application} from 'pixi.js';
import * as React from 'react';
import {gameFactory, GameOptions} from '../Function/GameFactory';
import {DragManager} from '../Manager/DragManager';
import {Game} from './Game';
import {GamePanel} from './Overlay/GamePanel/GamePanel';
import {PlayerStatsProps} from './Overlay/GamePanel/PlayerStats';
import {PanContainer} from './PanContainer';
import {Unit} from './Unit';
import {ZoomContainer, ZoomOptions} from './ZoomContainer';
import DisplayObject = PIXI.DisplayObject;
import Point = PIXI.Point;
import RenderTexture = PIXI.RenderTexture;
import SCALE_MODES = PIXI.SCALE_MODES;

interface Props {
    options: GameOptions;
    state: 'start' | 'pause';
    handleExit: () => void;
}

interface State {
    playerStatsProps?: PlayerStatsProps;
    isStarted: boolean;
}

export type TextureGenerator = (displayObject: DisplayObject) => RenderTexture;

const zoomOptions: ZoomOptions = {
    min: 0.5,
    max: 2,
    steps: 0.1,
};

export class GameContainer extends React.Component<Props, State> {
    private readonly canvasContainer: React.RefObject<HTMLDivElement>;
    private readonly dragContainer: React.RefObject<HTMLDivElement>;
    private readonly panelContainer: React.RefObject<HTMLDivElement>;
    private dragManager: DragManager;
    private textureGenerator: TextureGenerator;
    private app: Application;
    private game: Game;
    private zoomContainer: ZoomContainer;
    private panContainer: PanContainer;

    constructor(props: any) {
        super(props);
        this.canvasContainer = React.createRef();
        this.dragContainer = React.createRef();
        this.panelContainer = React.createRef();
        this.state = {
            isStarted: false,
        };
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
        window.addEventListener('resize', this.handleResize);
        // Zoom & pan containers
        this.panContainer = new PanContainer({
            shouldStart: (e) => {
                // Don't allow pan start if something is dragging or a movable unit is clicked
                const isDragging = this.dragManager.getDragging();
                const isMovableUnit = e.target instanceof Unit && e.target.canMove;
                return !isDragging && !isMovableUnit;
            },
        });
        this.zoomContainer = new ZoomContainer({options: zoomOptions});
        this.panContainer.addChild(this.zoomContainer);
        this.app.stage.addChild(this.panContainer);
        window.addEventListener('wheel', this.handleScrollZoom);
        // Start
        this.handleStartGame();
    }

    componentWillUnmount() {
        this.app.stop();
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('wheel', this.handleScrollZoom);
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

    private handleResize = () => {
        this.app.renderer.resize(window.innerWidth, window.innerHeight);
    };

    private handleScrollZoom = (e: WheelEvent) => {
        this.zoomContainer.handleScrollZoom(e);
        this.dragManager.zoom = this.zoomContainer.zoom;
    };

    private handleStartGame = () => {
        const {options} = this.props;
        const game = this.game = gameFactory({
            options,
            dragManager: this.dragManager,
            textureGenerator: this.textureGenerator,
            onUpdatePanel: this.handlePanelUpdate,
            onWin: this.handleExitGame,
        });
        game.start();
        // Game must be started to get the panel width
        this.setState({isStarted: true}, () => {
            // Center game position
            let panelWidth = 0;
            if (this.panelContainer.current) {
                panelWidth = this.panelContainer.current.offsetWidth;
            }
            const panX = (this.app.renderer.width - panelWidth) / 2;
            const panY = this.app.renderer.height / 2;
            this.panContainer.position = new Point(panX, panY);
            this.zoomContainer.addChild(game);
            const anchorX = this.zoomContainer.width * 0.5;
            const anchorY = this.zoomContainer.height * 0.5;
            this.zoomContainer.pivot = new Point(anchorX, anchorY);
        });
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
                <div ref={this.canvasContainer}/>
                {state === 'start' ? this.renderPanel() : ''}
                <div className="full click-trough" ref={this.dragContainer}/>
            </>
        );
    }
}
