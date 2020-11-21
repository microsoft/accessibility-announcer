/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface AnnouncerProps {
    title: string;
    historyLength: number;
    historyLifeTime: number;
    parent?: HTMLElement;
    containerClassName?: string;
    noStylesheet?: boolean;
}

export interface Announcer {
    setup(props?: Partial<AnnouncerProps>): void;
    announce(text: string, assertive?: boolean, className?: string): () => void;
    removeByClass(className: string): void;
    dispose(): void;
}
