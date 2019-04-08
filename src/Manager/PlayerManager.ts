import {Game} from '../Component/Game';
import {OnClickPanelUnitType} from '../Component/Overlay/GamePanel/UnitShop';
import {Territory} from '../Component/Territory';
import {DragManager} from './DragManager';
import Texture = PIXI.Texture;

export interface Player {
    id: number;
    hexagonTexture: Texture;
    territories: Territory[];
    color: number;
    actor: Actor;
}

export interface ActorProps {
    player: Player;
    game: Game;
    dragManager: DragManager;
    updatePanel: (props: { territory?: Territory }) => void;
}

export interface Actor {
    init: (props: ActorProps) => void;
    doTurn?: () => Promise<void>;
    onTurnStart?: () => void;
    onTurnEnd?: () => void;
    onPanelUnitClick?: OnClickPanelUnitType;
}

export class PlayerManager {
    public players: Player[];

    constructor(players: Player[]) {
        this.players = players;
    }

    public first(): Player {
        return this.players[0];
    }

    public next(player: Player): Player {
        const index = this.players.indexOf(player) + 1;
        return this.players[index % this.players.length];
    }

    public delete(player: Player): void {
        const index = this.players.indexOf(player);
        if (index !== -1) {
            this.players.splice(index, 1);
        }
    }
}
