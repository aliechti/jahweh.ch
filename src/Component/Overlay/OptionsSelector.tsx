import * as React from 'react';
import {GameOptions, PlayerPicker, Shape} from '../../Function/GameFactory';
import {PlayerSelector} from './PlayerSelector';

interface Props {
    options: GameOptions;
    onSetOptions: (options: GameOptions) => void;
}

const shapes: Shape[] = ['rectangle', 'rhombus', 'ring', 'hexagon', 'load'];
const playerPickers: PlayerPicker[] = ['random', 'even'];

export class OptionsSelector extends React.Component<Props> {

    private handleSetOption = (name: keyof GameOptions, value: any) => {
        const {options, onSetOptions} = this.props;
        options[name] = value;
        onSetOptions(options);
    };

    private renderGridOptions() {
        const {options} = this.props;
        return (
            <>
                <label>Shape</label>
                <select value={options.shape}
                        onChange={(e) => this.handleSetOption('shape', e.target.value)}>
                    {shapes.map((shape) => {
                        return <option key={shape} value={shape}>{shape}</option>;
                    })}
                </select>
                {options.shape === 'load' ? '' :
                    <>
                        <label>Player picker</label>
                        <select value={options.playerPicker}
                                onChange={(e) => this.handleSetOption('playerPicker', e.target.value)}>
                            {playerPickers.map((chooser) => {
                                return <option key={chooser} value={chooser}>{chooser}</option>;
                            })}
                        </select>
                        {options.shape === 'hexagon' || options.shape === 'ring'
                            ? <>
                                <label>Radius</label>
                                <input value={options.radius}
                                       onChange={(e) => this.handleSetOption('radius', Number(e.target.value))}/>
                            </> : <>
                                <label>Columns</label>
                                <input value={options.columns}
                                       onChange={(e) => this.handleSetOption('columns', Number(e.target.value))}/>
                                <label>Rows</label>
                                <input value={options.rows}
                                       onChange={(e) => this.handleSetOption('rows', Number(e.target.value))}/>
                            </>
                        }

                    </>
                }
            </>
        );
    }

    render() {
        const {options} = this.props;
        return (
            <>

                <div className="row">
                    <div className="col">
                        {this.renderGridOptions()}
                    </div>
                    <div className="col">
                        <PlayerSelector
                            playerProps={options.playerProps}
                            onSetPlayerProps={(playerProps) => this.handleSetOption('playerProps', playerProps)}
                        />
                    </div>
                </div>
            </>
        );
    }
}
