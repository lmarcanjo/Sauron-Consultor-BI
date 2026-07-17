/**
 * Compatibilidade para chamadas antigas do fluxo de revisão em lote.
 * A importação oficial vive em SimpleSpreadsheetImporter.
 */
import React from "react";
import { SimpleSpreadsheetImporter } from "./SimpleSpreadsheetImporter";

interface BatchImportReviewProps {
  onImportCompleted: () => void;
  onCancel: () => void;
}

export const BatchImportReview: React.FC<BatchImportReviewProps> = ({
  onImportCompleted,
  onCancel,
}) => (
  <SimpleSpreadsheetImporter
    onImported={() => onImportCompleted()}
    onCancel={onCancel}
  />
);

export default BatchImportReview;
