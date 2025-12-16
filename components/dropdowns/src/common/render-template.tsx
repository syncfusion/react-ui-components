import * as React from 'react';

export const renderTemplate: (template: (() => React.ReactNode) | React.ReactNode, defaultContent?: React.ReactNode)
=> React.ReactNode = (
    template: (() => React.ReactNode) | React.ReactNode,
    defaultContent?: React.ReactNode
): React.ReactNode => {
    if (template === null) {
        return null;
    }
    if (React.isValidElement(template)) {
        return template;
    }
    if (typeof template === 'function') {
        return template();
    }
    return defaultContent ?? null;
};
