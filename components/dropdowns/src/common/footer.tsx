import * as React from 'react';

import { renderTemplate } from './render-template';

interface FooterProps {
    footerTemplate?: (() => React.ReactNode) | React.ReactNode;
}

const Footer: React.FC<FooterProps> = ({ footerTemplate }: FooterProps) => {
    return <>{renderTemplate(footerTemplate)}</>;
};

export default React.memo(Footer);
