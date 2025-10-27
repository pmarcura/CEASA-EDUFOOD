
import React from 'react';
import * as icons from 'lucide-react';

interface DynamicIconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  // Capitalize first letter for component name convention
  const iconName = name.charAt(0).toUpperCase() + name.slice(1);
  const IconComponent = (icons as any)[iconName] || (icons as any)[name] || icons.Package;
  
  return <IconComponent {...props} />;
};

export default DynamicIcon;
