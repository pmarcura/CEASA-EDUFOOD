import React from 'react';
import * as icons from 'lucide-react';

interface DynamicIconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
}

// Helper to convert strings to PascalCase for icon lookup, e.g., "shopping cart" -> "ShoppingCart"
const toPascalCase = (str: string): string => {
  if (!str) return '';
  // This regex finds non-alphanumeric characters and the character that follows,
  // then capitalizes the following character. Finally, it capitalizes the first letter of the whole string.
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)?/g, (match, chr) => chr ? chr.toUpperCase() : '')
    .replace(/^./, (match) => match.toUpperCase());
};

const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  // Guard against non-string or empty names
  if (!name || typeof name !== 'string') {
    return <icons.Package {...props} />;
  }
  
  const formattedName = toPascalCase(name);
  // Look up the icon in the lucide-react library, fall back to Package icon if not found.
  const IconComponent = (icons as any)[formattedName] || icons.Package;
  
  return <IconComponent {...props} />;
};

export default DynamicIcon;
