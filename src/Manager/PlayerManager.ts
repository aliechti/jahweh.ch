import {Game} from '../Component/Game';
import {TextureGenerator} from '../Component/GameContainer';
import {Hexagon, HexagonProps} from '../Component/Hexagon';
import {OnClickPanelUnitType} from '../Component/Overlay/GamePanel/UnitShop';
import {Territory} from '../Component/Territory';
import Point = PIXI.Point;
import Texture = PIXI.Texture;

interface Props {
    players: PlayerProps[];
    hexagonProps: Pick<HexagonProps, 'radius' | 'lineWidth' | 'lineColor'>;
    textureGenerator: TextureGenerator;
}

export interface PlayerProps {
    color: number;
    actor: Actor;
}

export interface Player extends PlayerProps {
    id: number;
    hexagonTexture: Texture;
    selectedTerritory?: Territory;
    territories: Territory[];
}

export interface ActorProps {
    player: Player;
    game: Game;
}

export interface Actor {
    init: (props: ActorProps) => void;
    doTurn?: () => Promise<void>;
    onTurnStart?: () => void;
    onTurnEnd?: () => void;
    onPanelUnitClick?: OnClickPanelUnitType;
}

export function colorToString(color: number): string {
    const hex = color.toString(16);
    const padding = '0'.repeat(6 - hex.length);
    return '#' + padding + hex;
}

export class PlayerManager {
    private props: Props;
    public players: Player[];

    constructor(props: Props) {
        this.props = props;
        this.players = this.generatePlayers(props.players);
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

    private generatePlayers(playerProps: PlayerProps[]): Player[] {
        const players: Player[] = [];
        for (const [id, player] of playerProps.entries()) {
            players.push({
                ...player,
                id,
                territories: [],
                hexagonTexture: this.generateHexagonTexture(player.color),
            });
        }
        return players;
    }

    private generateHexagonTexture(color: number): Texture {
        const {textureGenerator, hexagonProps} = this.props;
        const hexagonTemplate = new Hexagon({...hexagonProps, fillColor: color});
        const texture = textureGenerator(hexagonTemplate);
        texture.defaultAnchor = new Point(0.5, 0.5);
        return texture;
    }
}
