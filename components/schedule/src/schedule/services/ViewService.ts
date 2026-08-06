import { ReactNode, Children, isValidElement, ReactElement } from 'react';
import { View } from '../types/enums';
import { ViewsInfo } from '../types/internal-interface';
import { ViewSpecificProps } from '../types/schedule-types';

/**
 * ViewService provides methods for managing views within the Schedule component.
 */
export class ViewService {
    /**
     * Process child views to extract view information
     *
     * @param {ReactNode} children - Children components
     * @param {function(string): string} [getString] - Optional localization getter for display names
     * @returns {ViewsInfo[]} Array of view information
     */
    static getViewsInfo(children: ReactNode, getString?: (key: string) => string): ViewsInfo[] {
        const viewsInfo: ViewsInfo[] = [];
        const uniqueNames: Set<string> = new Set<string>();

        Children.forEach(children, (child: ReactNode) => {
            if (isValidElement(child)) {
                const type: { displayName?: string } = child.type as { displayName?: string };
                const childProps: ViewSpecificProps = child.props as ViewSpecificProps || {};
                let viewType: View | null = null;

                switch (type.displayName) {
                case 'DayView':
                    viewType = 'Day';
                    break;
                case 'WeekView':
                    viewType = 'Week';
                    break;
                case 'WorkWeekView':
                    viewType = 'WorkWeek';
                    break;
                case 'MonthView':
                    viewType = 'Month';
                    break;
                default:
                    break;
                }
                if (viewType) {
                    const viewName: string = childProps.name || childProps.displayName || viewType;
                    if (!uniqueNames.has(viewName)) {
                        uniqueNames.add(viewName);
                        viewsInfo.push({
                            viewType,
                            name: viewName,
                            displayName: childProps.displayName || getString(viewType.toLowerCase()),
                            interval: childProps.interval || 1,
                            component: child as ReactElement
                        });
                    }
                }
            }
        });

        return viewsInfo;
    }

    /**
     * Find view information by name or type
     *
     * @param {ViewsInfo[]} viewsInfo - Array of view information
     * @param {string} viewNameOrType - View name or type to search for
     * @returns {ViewsInfo | undefined} View information if found
     */
    static findViewByNameOrType(viewsInfo: ViewsInfo[], viewNameOrType: string): ViewsInfo | undefined {
        const componentByName: ViewsInfo | undefined = viewsInfo.find(
            (comp: ViewsInfo) => comp.name === viewNameOrType
        );
        if (componentByName) {
            return componentByName;
        }
        const viewType: View | null = viewNameOrType as View;
        return viewsInfo.find((comp: ViewsInfo) => comp.viewType === viewType) || null;
    }

    /**
     * Get the default view information
     *
     * @param {ViewsInfo[]} viewsInfo - Array of view information
     * @returns {ViewsInfo | undefined} Default view information
     */
    static getDefaultView(viewsInfo: ViewsInfo[]): ViewsInfo | undefined {
        return viewsInfo.length > 0 ? viewsInfo[0] : undefined;
    }
}
