import * as React from 'react';
import { renderTemplate } from './render-template';
import { JSX } from 'react';

interface NoRecordsProps {
    noRecordsTemplate?: (() => React.ReactNode) | React.ReactNode;
    defaultText?: string;
}

const NoRecords: React.FC<NoRecordsProps> = ({ noRecordsTemplate, defaultText }: NoRecordsProps) => {
    const fallback: JSX.Element = (
        <div className="sf-content sf-dd-base sf-dd-nodata">
            {defaultText}
        </div>
    );
    const rendered: React.ReactNode = renderTemplate(noRecordsTemplate);
    return <>{rendered ?? fallback}</>;
};

export default React.memo(NoRecords);
