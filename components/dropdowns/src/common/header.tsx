import * as React from 'react';
import { renderTemplate } from './render-template';

interface HeaderProps {
    headerTemplate?: (() => React.ReactNode) | React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ headerTemplate }: HeaderProps) => {
    return <>{renderTemplate(headerTemplate)}</>;
};

export default React.memo(Header);
