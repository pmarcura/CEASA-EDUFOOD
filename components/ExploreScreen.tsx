
import React from 'react';
import { Compass } from 'lucide-react';

const ExploreScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-brand-text-secondary p-8">
      <Compass size={48} className="text-brand-primary mb-4" />
      <h2 className="text-2xl font-bold text-brand-text mb-2">Explorar</h2>
      <p>Em breve você poderá buscar pratos, receitas e perfis de outras famílias por aqui!</p>
    </div>
  );
};

export default ExploreScreen;
