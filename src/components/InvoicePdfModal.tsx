import React from 'react';
import { Invoice } from '../types';
import { PrintableDocumentModal } from './PrintableDocumentModal';

interface InvoicePdfModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  return (
    <PrintableDocumentModal
      isOpen={isOpen && !!invoice}
      onClose={onClose}
      documentType="invoice"
      invoice={invoice}
    />
  );
};
