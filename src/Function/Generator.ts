import {HexagonGrid} from '../Component/HexagonGrid';
import {Player} from '../Manager/PlayerManager';

export const playerPickerRandom = (grid: HexagonGrid, players: Player[]) => {
    for (const field of grid.fields()) {
        const index = Math.floor(Math.random() * Math.floor(players.length));
        field.player = players[index];
    }
};

export const playerPickerEven = (grid: HexagonGrid, players: Player[]) => {
    function shuffleArray(array: any[]) {
        for (let i = 0; i < array.length; i++) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    const fields = Array.from(grid.fields());
    const fieldsPerPlayer = Math.floor(fields.length / players.length);
    for (let i = fieldsPerPlayer * players.length; i < fields.length; i++) {
        grid.delete(fields[i]);
        fields.splice(i, 1);
    }
    shuffleArray(fields);
    for (let i = 0; i < players.length; i++) {
        for (let j = 0; j < fieldsPerPlayer; j++) {
            fields[i * fieldsPerPlayer + j].player = players[i];
        }
    }
};
