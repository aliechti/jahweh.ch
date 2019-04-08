import * as React from 'react';
import {GameOptions} from '../../Function/GameFactory';
import {OptionsSelector} from './OptionsSelector';

interface Props {
    options: GameOptions;
    canResume: boolean;
    onClickStart: () => void;
    onClickResume: () => void;
    onClickReadme: () => void;
    onSetOptions: (options: GameOptions) => void;
}

export class Start extends React.Component<Props> {
    render() {
        const {options, canResume, onClickStart, onClickResume, onClickReadme, onSetOptions} = this.props;
        return (
            <div className="full background-dim row scrollable">
                <div className="center">
                    <div style={{minWidth: '10rem', maxWidth: '25rem'}}>
                        <OptionsSelector options={options} onSetOptions={onSetOptions}/>
                        <div className="row" style={{marginTop: '0.5rem'}}>
                            <div className="col" style={{textAlign: 'center', marginTop: '0.5rem'}}>
                                <button type="button" onClick={onClickStart}>Start</button>
                            </div>
                            {canResume ?
                                <div className="col" style={{textAlign: 'center', marginTop: '0.5rem'}}>
                                    <button type="button" onClick={onClickResume}>Resume</button>
                                </div>
                                : ''}
                            <div className="col" style={{textAlign: 'center', marginTop: '0.5rem'}}>
                                <button type="button" onClick={onClickReadme}>Readme</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
