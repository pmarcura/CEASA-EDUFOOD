
import React from 'react';
import { Ticket } from 'lucide-react';

const OffersScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-brand-text-secondary p-8">
      <Ticket size={48} className="text-brand-primary mb-4" />
      <h2 className="text-2xl font-bold text-brand-text mb-2">Ofertas</h2>
      <p>Em breve você encontrará cupons e descontos especiais em mercados e restaurantes saudáveis parceiros!</p>
    </div>
  );
};

export default OffersScreen;
