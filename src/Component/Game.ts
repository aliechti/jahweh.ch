import {ExplicitContainer} from '../Interface/ExplicitContainer';
import {MovementManager} from '../Manager/MovementManager';
import {DoTurnFunction, Player, PlayerManager} from '../Manager/PlayerManager';
import {UnitManager} from '../Manager/UnitManager';
import {UnitTypeManager} from '../Manager/UnitTypeManager';
import {GameMap} from './GameMap';
import {HexagonField} from './HexagonField';
import {HexagonGrid} from './HexagonGrid';
import {PlayerStatsProps} from './Overlay/GamePanel/PlayerStats';
import {Territory} from './Territory';
import {Unit, UnitType} from './Unit';
import Container = PIXI.Container;

export interface GameProps {
    playerManager: PlayerManager;
    grid: HexagonGrid;
    updatePanel: (props: PlayerStatsProps) => void;
    unitTypeManager: UnitTypeManager;
    dragManager: GameDragManager;
    onWin: (player: Player) => void;
}

export interface GameDragManager {
    getDragging: () => Unit | undefined;
    setDragging: (unit?: Unit, position?: { x: number, y: number }) => void;
}

export class Game extends Container {
    public readonly props: GameProps;
    public readonly unitManager: UnitManager;
    public readonly movementManager: MovementManager;
    public player: Player;
    public readonly map: GameMap;
    private readonly unitContainer: ExplicitContainer<Unit>;
    private turn: number;
    private isAutoplayRunning: boolean;
    private mustPauseAutoPlay: boolean;

    constructor(props: GameProps) {
        super();
        this.props = props;
        this.player = this.props.playerManager.first();
        this.map = new GameMap({grid: this.props.grid});
        this.turn = 1;
        this.isAutoplayRunning = false;
        this.unitContainer = new Container() as ExplicitContainer<Unit>;
        this.unitManager = new UnitManager({
            unitTypeManager: this.props.unitTypeManager,
            unitContainer: this.unitContainer,
        });
        this.movementManager = new MovementManager({
            map: this.map,
            unitTypeManager: this.props.unitTypeManager,
            unitManager: this.unitManager,
            selectTerritory: this.selectTerritory,
        });

        this.addChild(this.props.grid);
        this.addChild(this.unitContainer);

        for (const territory of this.map.territories) {
            const size = territory.props.fields.length;
            if (size > 1) {
                const field = territory.props.fields[0];
                this.unitManager.add(this.props.unitTypeManager.mainBuilding, field);
            }
        }
        this.handleTurnStart();
        this.autoPlay();
    }

    private updatePanel() {
        this.props.updatePanel({
            player: this.player,
            territory: this.player.selectedTerritory,
        });
    }

    public selectTerritory = (territory: Territory) => {
        this.unselectTerritory();
        this.player.selectedTerritory = territory;
        this.updatePanel();
        this.tintTerritory(this.player.selectedTerritory, 0x555555);
    };

    public unselectTerritory() {
        if (this.player.selectedTerritory) {
            this.tintTerritory(this.player.selectedTerritory, 0xffffff);
            this.player.selectedTerritory = undefined;
        }
    }

    private async autoPlay() {
        function sleep(ms: number) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // This can be only run once at a time
        if (!this.isAutoplayRunning) {
            this.isAutoplayRunning = true;
            this.mustPauseAutoPlay = false;
            let doTurn = this.player.actor.doTurn;
            while (doTurn) {
                await Promise.all([
                    doTurn(this),
                    sleep(500),
                ]);
                if (!this.mustPauseAutoPlay) {
                    doTurn = this.nextTurn();
                }
            }
            this.isAutoplayRunning = false;
            this.mustPauseAutoPlay = false;
        }
    }

    public pauseAutoPlay() {
        this.mustPauseAutoPlay = true;
    }

    private handleTurnStart = () => {
        const {playerManager} = this.props;
        const isFirstTurn = this.turn / playerManager.players.length <= 1;
        // Territories on turn
        for (const territory of this.map.territories) {
            if (territory.props.player === this.player) {
                if (isFirstTurn) {
                    territory.onStart();
                } else {
                    territory.onTurn();
                }
                // Remove units if territory is bankrupt
                if (territory.isBankrupt()) {
                    console.log('Territory bankruptcy');
                    for (const field of territory.props.fields) {
                        if (field.unit !== undefined && field.unit.props.type.salary > 0) {
                            this.unitManager.delete(field.unit);
                        }
                    }
                    territory.money = 0;
                }
            }
        }
        // Set current player to panel
        this.updatePanel();
        // Prepare units for turn
        for (const unit of this.unitContainer.children) {
            const field = unit.props.field;
            if (field && field.player === this.player) {
                unit.onTurn();
            } else {
                unit.offTurn();
            }
        }
        // Execute actor turn start actions
        const {actor} = this.player;
        if (actor.onTurnStart) {
            actor.onTurnStart(this);
        }
    };

    private handleTurnEnd = () => {
        this.unselectTerritory();
        const {actor} = this.player;
        if (actor.onTurnEnd) {
            actor.onTurnEnd(this);
        }
    };

    private hasPlayerWon = (player: Player) => {
        const playerFieldCount = player.territories
            .map((territory) => territory.props.fields.length)
            .reduce((value, current) => current + value, 0);
        return playerFieldCount * 100 / this.map.grid.size() > 60;
    };

    private hasPlayerLost = (player: Player) => {
        const territories = player.territories.filter((territory) => {
            return territory.isControllable();
        });
        return territories.length === 0;
    };

    public nextTurns = async (): Promise<void> => {
        if (!this.isAutoplayRunning) {
            this.nextTurn();
            await this.autoPlay();
        }
    };

    private nextTurn = (): DoTurnFunction | undefined => {
        const {playerManager, onWin} = this.props;
        this.handleTurnEnd();
        if (this.hasPlayerWon(this.player)) {
            // todo: win condition based on player count
            console.info('Player has won', this.player);
            onWin(this.player);
            return;
        }
        // Check if next player has already lost and remove him if so
        let nextPlayer;
        let i = playerManager.players.length;
        do {
            nextPlayer = playerManager.next(this.player);
            if (this.hasPlayerLost(nextPlayer)) {
                console.info('Player has lost', nextPlayer);
                playerManager.delete(nextPlayer);
                nextPlayer = undefined;
            }
        } while (nextPlayer === undefined && i-- > 0);
        if (nextPlayer === undefined) {
            console.error('Next turn next player chooser is probably broken');
            return;
        }
        this.player = nextPlayer;
        // Start next turn
        this.turn++;
        this.handleTurnStart();
        return this.player.actor.doTurn;
    };

    public handlePanelUnitClick = (type: UnitType, position: { x: number, y: number }) => {
        console.log('panel unit click', type);
        const territory = this.player.selectedTerritory;
        if (territory === undefined) {
            console.warn('no territory selected');
            return;
        }
        const {dragManager} = this.props;
        if (dragManager.getDragging() !== undefined) {
            console.warn('you can\'t drag another unit');
            return;
        }
        if (territory.money < type.cost) {
            console.warn('not enough money to buy this unit');
            return;
        }
        const unit = new Unit({type});
        dragManager.setDragging(unit, position);
    };

    public buyUnit = (type: UnitType, field: HexagonField, territory: Territory): Unit | undefined => {
        if (!type.isBuildable) {
            console.warn('unit type is not buildable');
            return;
        }
        if (territory.money < type.cost) {
            console.warn('not enough money to buy this unit');
            return;
        }
        const unit = new Unit({type});
        if (this.player.actor.isInteractive && type.isMovable) {
            unit.setInteractive(true);
        }
        if (this.movementManager.move(unit, field, this.player, territory)) {
            territory.money -= type.cost;
            this.updatePanel();
            return unit;
        }
    };

    private tintTerritory(territory: Territory | undefined, tint: number) {
        if (territory) {
            for (const field of territory.props.fields) {
                field.tint = tint;
            }
        }
    }
}
