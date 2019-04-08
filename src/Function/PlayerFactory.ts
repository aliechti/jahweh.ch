import {Human} from '../Actor/Human';
import {SimpleAI} from '../Actor/SimpleAI';
import {TextureGenerator} from '../Component/GameContainer';
import {Hexagon, HexagonProps} from '../Component/Hexagon';
import {Player} from '../Manager/PlayerManager';
import Point = PIXI.Point;
import Texture = PIXI.Texture;

interface PlayerFactoryProps {
    playerProps: PlayerProps[];
    hexagonProps: Pick<HexagonProps, 'radius' | 'lineWidth' | 'lineColor'>;
    textureGenerator: TextureGenerator;
}

export interface PlayerProps {
    color: number;
    actor: Actors;
}

export type Actors = 'human' | 'simpleAi';

export const actors = [Human, SimpleAI];

export function playerFactory(props: PlayerFactoryProps): Player[] {
    const {playerProps, textureGenerator, hexagonProps} = props;

    function generateHexagonTexture(color: number): Texture {
        const hexagonTemplate = new Hexagon({...hexagonProps, fillColor: color});
        const texture = textureGenerator(hexagonTemplate);
        texture.defaultAnchor = new Point(0.5, 0.5);
        return texture;
    }

    const players: Player[] = [];
    for (const [id, player] of playerProps.entries()) {
        players.push({
            actor: player.actor === 'human' ? new Human() : new SimpleAI(),
            color: player.color,
            id,
            territories: [],
            hexagonTexture: generateHexagonTexture(player.color),
        });
    }
    return players;
}
