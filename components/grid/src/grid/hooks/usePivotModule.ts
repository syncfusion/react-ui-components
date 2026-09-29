import { PivotView } from '../views/PivotView';
import { PivotModuleType } from '../types/pivot.interfaces';
/** Optional local pivot feature. Inject through Grid's modules prop. */
export const PivotModule: PivotModuleType = { View: PivotView };
