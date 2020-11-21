/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as Types from './Types';

let _lastAnnouncementId = 0;

interface Announcement {
    id: string;
    node: HTMLLIElement;
    className?: string;
    timer?: number;
    removeTimer?: number;
}

const defaultProps: Types.AnnouncerProps = {
    title: 'Accessibility announcements',
    historyLength: 10,
    historyLifeTime: 10 * 60 * 1000 // 10 minutes
};

export class Announcer implements Types.Announcer {
    private _win: Window | undefined;
    private _props: Types.AnnouncerProps = defaultProps;
    private _container: HTMLDivElement | undefined;
    private _title: HTMLHeadingElement | undefined;
    private _list: HTMLUListElement | undefined;
    private _announcements: { [id: string]: Announcement } = {};
    private _cleanupTimer: number | undefined;
    private _focusOutTimer: number | undefined;
    private _css: HTMLStyleElement | undefined;

    private static _containerClassName = 'accessibility-announcer';
    private static _visibleClassName = 'accessibility-announcer-visible';

    constructor(mainWindow: Window) {
        this._win = mainWindow;
    }

    setup(props?: Partial<Types.AnnouncerProps>): void {
        this._props = { ...this._props, ...props };

        this._setupCSS();

        if (!props) {
            return;
        }

        if (props.parent && this._container && this._container.parentElement !== props.parent) {
            props.parent.appendChild(this._container);
        }

        if (props.title && this._container) {
            this._container.setAttribute('aria-label', props.title);

            if (this._title) {
                this._title.innerText = props.title;
            }
        }

        if (props.historyLength) {
            this._shrinkHistory();
        }
    }

    dispose(): void {
        const win = this._win;

        if (!win) {
            return;
        }

        delete this._win;

        this._removeCSS();

        delete this._title;
        delete this._list;

        if (!this._container) {
            return;
        }

        this._container.removeEventListener('focusin', this._onFocusIn);
        this._container.removeEventListener('focusout', this._onFocusOut);

        if (this._focusOutTimer) {
            win.clearTimeout(this._focusOutTimer);
            delete this._focusOutTimer;
        }

        if (this._cleanupTimer) {
            win.clearTimeout(this._cleanupTimer);
            delete this._cleanupTimer;
        }

        for (let id of Object.keys(this._announcements)) {
            this._removeAnnouncement(id);
        }

        if (this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
            delete this._container;
        }
    }

    announce(text: string, assertive?: boolean, className?: string): () => void {
        if (!this._list) {
            this._init();
        }

        if (!this._win || !text.trim() || !this._list) {
            return () => { /**/ };
        }

        const doc = this._win.document;

        const announcementNode = doc.createElement('li');
        announcementNode.setAttribute('role', 'listitem');

        announcementNode.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
        announcementNode.tabIndex = -1;

        const announcement: Announcement = {
            id: 'a-' + ++_lastAnnouncementId,
            node: announcementNode,
            className
        };

        this._announcements[announcement.id] = announcement;

        announcement.timer = this._win.setTimeout(() => {
            delete announcement.timer;
            announcementNode.innerText = text;
        }, 100);

        if (this._props.historyLifeTime > 0) {
            announcement.removeTimer = this._win.setTimeout(() => {
                delete announcement.removeTimer;
                this._removeAnnouncement(announcement.id);
            }, this._props.historyLifeTime);
        }

        this._list.insertBefore(announcementNode, this._list.firstChild);

        this._shrinkHistory();

        return () => {
            this._removeAnnouncement(announcement.id);
        };
    }

    removeByClass(className: string): void {
        for (let id of Object.keys(this._announcements)) {
            if (this._announcements[id].className === className) {
                this._removeAnnouncement(id);
            }
        }
    }

    private _setupCSS(): void {
        const ownerDocument = this._container && this._container.ownerDocument;

        if (!ownerDocument) {
            return;
        }

        if (this._props.noStylesheet) {
            this._removeCSS();
            return;
        }

        if (!this._css) {
            this._css = ownerDocument.createElement('style');
            this._css.type = 'text/css';
            this._css.appendChild(ownerDocument.createTextNode(_getAnnouncerStyles()));
        }

        if (this._css.parentElement !== ownerDocument.head) {
            ownerDocument.head.appendChild(this._css);
        }
    }

    private _removeCSS(): void {
        if (this._css) {
            if (this._css.parentElement) {
                this._css.parentElement.removeChild(this._css);
            }

            delete this._css;
        }
    }

    private _shrinkHistory(): void {
        const ids = Object.keys(this._announcements);

        while (ids.length > this._props.historyLength) {
            const oldestAnnouncementId = ids.shift();

            if (oldestAnnouncementId) {
                this._removeAnnouncement(oldestAnnouncementId);
            }
        }
    }

    private _removeAnnouncement(announcementId: string): void {
        const announcement = this._announcements[announcementId];

        if (!this._win || !announcement) {
            return;
        }

        if (announcement.timer) {
            this._win.clearTimeout(announcement.timer);
            delete announcement.timer;
        }

        if (announcement.removeTimer) {
            this._win.clearTimeout(announcement.removeTimer);
            delete announcement.removeTimer;
        }

        if (announcement.node.parentElement) {
            announcement.node.parentElement.removeChild(announcement.node);
        }

        delete this._announcements[announcementId];
    }

    private _init(): void {
        if (!this._win || this._container) {
            return;
        }

        const doc = this._win.document;

        this._container = doc.createElement('div');
        this._container.setAttribute('role', 'region');
        this._container.setAttribute('aria-label', this._props.title);
        this._container.tabIndex = -1;

        this._title = doc.createElement('h2');
        this._title.setAttribute('aria-hidden', 'true');
        this._title.innerText = this._props.title;

        this._list = doc.createElement('ul');
        this._list.setAttribute('role', 'list');

        this._container.appendChild(this._title);
        this._container.appendChild(this._list);

        this._setupCSS();

        this._container.addEventListener('focusin', this._onFocusIn);
        this._container.addEventListener('focusout', this._onFocusOut);

        this._container.className = this._props.containerClassName || Announcer._containerClassName;

        const parent = this._props.parent || doc.body;
        parent.appendChild(this._container);
    }

    private _onFocusIn = () => {
        if (!this._win) {
            return;
        }

        if (this._focusOutTimer) {
            this._win.clearTimeout(this._focusOutTimer);
            delete this._focusOutTimer;
        }

        this._show();
    }

    private _onFocusOut = () => {
        if (!this._win) {
            return;
        }

        if (this._focusOutTimer) {
            this._win.clearTimeout(this._focusOutTimer);
        }

        this._focusOutTimer = this._win.setTimeout(() => {
            delete this._focusOutTimer;
            this._hide();
        }, 0);
    }

    private _show(): void {
        if (!this._win || !this._container) {
            return;
        }

        this._container.classList.add(Announcer._visibleClassName);
    }

    private _hide(): void {
        if (!this._win || !this._container) {
            return;
        }

        this._container.classList.remove(Announcer._visibleClassName);
    }
}

function _getAnnouncerStyles(): string {
    return `
.accessibility-announcer {
    height: 1px;
    left: -10px;
    max-height: 100%;
    max-width: 400px;
    opacity: 0;
    overflow: hidden;
    position: absolute;
    top: -10px;
    width: 1px;
    z-index: -1;
}

.accessibility-announcer-visible {
    border-radius: 10px;
    border: 1px solid #ccc;
    bottom: 10px;
    box-shadow: 0 0 6px rgba(0,0,0,.3);
    height: auto;
    left: auto;
    opacity: 1;
    overflow: auto;
    padding: 10px;
    right: 10px;
    top: auto;
    width: auto;
    z-index: 2147483647;
}

.accessibility-announcer h2 {
    margin: 0 0 6px 0;
}

.accessibility-announcer ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
}

.accessibility-announcer li {
    border-top: 1px solid #ccc;
    margin: 6px 0 0 0;
    padding-top: 6px;
}
`;
}
