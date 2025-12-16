import * as React from 'react';
import { renderTemplate } from './render-template';
import { JSX } from 'react';

interface ErrorProps {
    errorTemplate?: (() => React.ReactNode) | React.ReactNode;
    defaultText?: string;
}

const ErrorMessage: React.FC<ErrorProps> = ({ errorTemplate, defaultText }: ErrorProps) => {
    const fallback: JSX.Element = (
        <div className="sf-content sf-dd-base sf-dd-nodata">
            {defaultText}
        </div>
    );

    const rendered: React.ReactNode = renderTemplate(errorTemplate);
    return <>{rendered ?? fallback}</>;
};

export default React.memo(ErrorMessage);
