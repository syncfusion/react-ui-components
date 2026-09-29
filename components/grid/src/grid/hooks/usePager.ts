import { pagerModule } from '../types/page.interfaces';
import { PagerPanelBase } from '../views/PagerPanel';

const usePager: () => pagerModule = (): pagerModule => {
    return { PagerPanelBase };
};
export { usePager as PagerModule };
