import { detailGridModule } from '../types/detail-grid.interfaces';
import { DetailCellRenderer } from '../components';

const useDetailGridModule: () => detailGridModule = (): detailGridModule => ({
    DetailCellRenderer
});

export { useDetailGridModule as DetailGridModule };
