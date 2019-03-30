import 'pixi.js';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import '../assets/scss/style.scss';
import {Human} from './Actor/Human';
import {SimpleAI} from './Actor/SimpleAI';
import {GameContainer} from './Component/GameContainer';
import {PlayerProps} from './Manager/PlayerManager';

const players: PlayerProps[] = [
    {
        color: 0xff0088,
        actor: new Human(),
    },
    {
        color: 0xff8800,
        actor: new SimpleAI(),
    },
    {
        color: 0xffff00,
        actor: new SimpleAI(),
    },
    {
        color: 0x00ffff,
        actor: new SimpleAI(),
    },
];

const gameContainer = document.getElementById('game-container');

if (gameContainer) {
    ReactDOM.render(<GameContainer players={players}/>, gameContainer);
}
