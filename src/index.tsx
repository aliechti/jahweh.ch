import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {GameContainer} from './Component/GameContainer';

const players = [
    {
        color: 0xff0088,
    },
    {
        color: 0xff8800,
    },
    {
        color: 0xffff00,
    },
    {
        color: 0x00ffff,
    },
];

const gameContainer = document.getElementById('game-container');

if (gameContainer) {
    ReactDOM.render(<GameContainer players={players}/>, gameContainer);
}
