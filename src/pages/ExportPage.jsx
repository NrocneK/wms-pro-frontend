// src/pages/ExportPage.jsx
import { useState, useRef } from "react";
import { AlertModal, ConfirmModal } from "../components/ui";
import { useExportPacking } from "../hooks/useExportPacking";
import { useExportReview } from "../hooks/useExportReview";
import PickSlipModal from "../components/export/PickSlipModal";
import ExportReviewTable from "../components/export/ExportReviewTable";
import PackingAccordion from "../components/export/PackingAccordion";

export default function ExportPage({ onRefresh }) {
  const [pickSlip, setPickSlip] = useState(null);
  const [alertModal, setAlert] = useState(null);
  const [confirmModal, setConfirm] = useState(null);
  const fileRef = useRef();

  const showAlert = (message, type = "error", title) => setAlert({ message, type, title });
  const showConfirm = (message, onConfirm, opts = {}) => setConfirm({ message, onConfirm, ...opts });

  const packing = useExportPacking({ onRefresh, showAlert, showConfirm, setPickSlip });
  const review = useExportReview({ showAlert, setPickSlip, onDone: packing.loadPackingBatches });

  return (
    <div className="space-y-5">
      {alertModal && <AlertModal {...alertModal} onClose={() => setAlert(null)} />}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title} message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel} confirmColor={confirmModal.confirmColor}
          onConfirm={() => { setConfirm(null); confirmModal.onConfirm(); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      <ExportReviewTable review={review} fileRef={fileRef} />

      <PackingAccordion packing={packing} />

      {pickSlip && <PickSlipModal slip={pickSlip} onClose={() => setPickSlip(null)} />}
    </div>
  );
}