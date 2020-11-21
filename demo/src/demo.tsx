/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Announcer } from 'accessibility-announcer';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

const announcer = new Announcer(window);
announcer.setup(document.body);

class App extends React.PureComponent {
    private _input: HTMLInputElement | undefined;

    render() {
        return (
            <div>
                <h1>Hello world</h1>
                <input type='text' defaultValue='Hello world' ref={ this._onInputRef } />
                <br/>
                <button onClick={ this._announce }>Announce</button>
                <br/>
                <button onClick={ this._announceAssertive }>Announce Assertive</button>
            </div>
        );
    }

    private _onInputRef = (ref: HTMLInputElement | null): void => {
        this._input = ref || undefined;
    }

    private _announce = () => {
        if (this._input && this._input.value) {
            announcer.announce(this._input.value);
        }
    }

    private _announceAssertive = () => {
        if (this._input && this._input.value) {
            announcer.announce(this._input.value, true);
        }
    }
}

ReactDOM.render(<App />, document.getElementById('demo'));
