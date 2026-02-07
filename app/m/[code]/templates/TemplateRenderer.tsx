'use client';

import { PublicMenuData, getLayout } from './types';
import { StandardTemplate } from './StandardTemplate';
import { PremiumMenuTemplate } from './PremiumMenuTemplate';
import { MinimalMenuTemplate } from './MinimalMenuTemplate';
import { ClassicMenuTemplate } from './ClassicMenuTemplate';

interface TemplateRendererProps {
  menuData: PublicMenuData;
}

export function TemplateRenderer({ menuData }: TemplateRendererProps) {
  const layout = getLayout(menuData.template.settings);

  switch (layout) {
    case 'premium':
      return <PremiumMenuTemplate menuData={menuData} />;
    case 'minimal':
      return <MinimalMenuTemplate menuData={menuData} />;
    case 'classic':
      return <ClassicMenuTemplate menuData={menuData} />;
    case 'standard':
    default:
      return <StandardTemplate menuData={menuData} />;
  }
}
