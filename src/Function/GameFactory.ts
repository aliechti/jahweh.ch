import {Game} from '../Component/Game';
import {TextureGenerator} from '../Component/GameContainer';
import {HexagonProps} from '../Component/Hexagon';
import {HexagonGridGenerator} from '../Component/HexagonGridGenerator';
import {PlayerStatsProps} from '../Component/Overlay/GamePanel/PlayerStats';
import {DragManager} from '../Manager/DragManager';
import {PlayerManager, PlayerProps} from '../Manager/PlayerManager';
import {UnitTypeManager} from '../Manager/UnitTypeManager';
import {playerPickerEven, playerPickerRandom} from './Generator';

interface GameFactoryProps {
    options: GameOptions,
    textureGenerator: TextureGenerator,
    dragManager: DragManager,
    onUpdatePanel: (playerStatsProps: PlayerStatsProps) => void,
    onWin: () => void,
}

export interface GameOptions {
    players: PlayerProps[];
    shape: Shape;
    chooser: Chooser;
    columns: number;
    rows: number;
    radius: number;
}

type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
export type Shape = FunctionPropertyNames<HexagonGridGenerator>;
export type Chooser = 'random' | 'evenly';

export function gameFactory(props: GameFactoryProps): Game {
    const {options, textureGenerator, dragManager, onUpdatePanel, onWin} = props;
    const hexagonProps: HexagonProps = {
        radius: 25,
        lineWidth: 2,
        lineColor: 0x000000,
    };
    const playerManager = new PlayerManager({
        players: options.players,
        hexagonProps,
        textureGenerator,
    });
    const generator = new HexagonGridGenerator({
        players: playerManager.players,
        hexagonProps: hexagonProps,
    });
    let chooser;
    if (options.chooser === 'evenly') {
        chooser = playerPickerEven;
    } else {
        chooser = playerPickerRandom;
    }
    let grid;
    if (options.shape === 'load') {
        const savedGrid = JSON.parse(localStorage.getItem('savedGrid') || '');
        if (!Array.isArray(savedGrid)) {
            throw 'could not load saved grid';
        }
        grid = generator[options.shape](savedGrid);
    } else if (options.shape === 'spiral' || options.shape === 'ring') {
        grid = generator[options.shape](options.radius);
        chooser(grid, playerManager.players);
    } else {
        grid = generator[options.shape](options.columns, options.rows);
        chooser(grid, playerManager.players);
    }
    console.info('grid', JSON.stringify(HexagonGridGenerator.save(grid, playerManager.players)));
    const unitTypeManager = new UnitTypeManager({textureGenerator});
    const game = new Game({
        grid,
        playerManager,
        unitTypeManager,
        onWin,
    });
    // Drag/pan handlers
    game.interactive = true;
    // Init actors
    for (const player of playerManager.players) {
        player.actor.init({
            player,
            game,
            dragManager,
            updatePanel: (props) => onUpdatePanel({player, territory: props.territory}),
        });
    }
    return game;
}
