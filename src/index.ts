import {Canvas} from './Component/Canvas';
import {Rectangle} from './Component/Rectangle';

const element = document.getElementById('canvas') as HTMLCanvasElement;
const canvas = new Canvas(element);

const rect = new Rectangle({
    x: 100,
    y: 100,
    w: 100,
    h: 100,
    fillStyle: 'black',
    strokeStyle: 'orange',
    lineWidth: 5,
    lineCap: 'round',
});
const rect2 = new Rectangle({
    x: 150,
    y: 150,
    w: 150,
    h: 150,
    fillStyle: 'grey',
    strokeStyle: 'blue',
    lineWidth: 5,
    lineCap: 'round',
});
canvas.add(rect);
canvas.add(rect2);
canvas.render();
