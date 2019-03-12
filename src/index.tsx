import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {GameContainer} from './Component/GameContainer';
import {simpleAI} from './Function/SimpleAI';
import {PlayerProps} from './Manager/PlayerManager';

const players: PlayerProps[] = [
    {
        color: 0xff0088,
    },
    {
        color: 0xff8800,
        doTurn: simpleAI,
    },
    {
        color: 0xffff00,
        doTurn: simpleAI,
    },
    {
        color: 0x00ffff,
        doTurn: simpleAI,
    },
];

const gameContainer = document.getElementById('game-container');

if (gameContainer) {
    ReactDOM.render(<GameContainer players={players}/>, gameContainer);
}
