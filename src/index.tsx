import 'pixi.js';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import '../assets/scss/style.scss';
import {Main} from './Component/Main';

const main = document.createElement('div');
document.body.appendChild(main);

if (main) {
    ReactDOM.render(<Main/>, main);
}
