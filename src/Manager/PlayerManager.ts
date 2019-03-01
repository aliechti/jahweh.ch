import {TextureGenerator} from '../Component/GameContainer';
import {Hexagon, HexagonProps} from '../Component/Hexagon';
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
}

export interface Player extends PlayerProps {
    hexagonTexture: Texture;
    selectedTerritory?: Territory;
}

export class PlayerManager {
    private props: Props;
    public players: Player[];

    constructor(props: Props) {
        this.props = props;
        this.players = this.generatePlayerTextures(props.players);
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

    private generatePlayerTextures(playerProps: PlayerProps[]): Player[] {
        const players: Player[] = [];
        for (const player of playerProps) {
            players.push({...player, hexagonTexture: this.generateHexagonTexture(player.color)});
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
