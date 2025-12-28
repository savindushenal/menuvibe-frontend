import { FranchiseInfo, LocationInfo, MenuItem as BaseMenuItem } from '../premium/types';

export interface BaristaTemplateProps {
  franchise: FranchiseInfo;
  location: LocationInfo;
  menuItems: BaseMenuItem[];
}

export interface BaristaMenuItem extends BaseMenuItem {
  rating?: number;
  reviews?: number;
}
