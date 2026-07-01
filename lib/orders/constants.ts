export const OrderStatus = {
  Processing: "Σε Επεξεργασία",
  Confirmed: "Επιβεβαιώθηκε",
  ReadyForShipment: "Έτοιμο για Αποστολή",
} as const;

export const Priority = {
  Normal: "Κανονική",
  Urgent: "Επείγον",
} as const;

export type OrderStatusValue =
  (typeof OrderStatus)[keyof typeof OrderStatus];
