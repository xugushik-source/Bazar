-- Owner 06.11: step-by-step weighing in the supplier bot keeps its answers in the dialog.
ALTER TABLE tg_dialogs ADD COLUMN state TEXT;
