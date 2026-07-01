export function getCustomerTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case "hospital":
      return "Νοσοκομείο";
    case "hotel":
      return "Ξενοδοχείο";
    case "walk-in":
      return "Walk-in";
    default:
      return "Πελάτης";
  }
}

export function getCustomerTypeBadgeClass(type: string | null | undefined): string {
  switch (type) {
    case "hospital":
      return "bg-kartex-blue/20 text-blue-300";
    case "hotel":
      return "bg-purple-500/20 text-purple-300";
    case "walk-in":
      return "bg-white/10 text-white/70";
    default:
      return "bg-white/10 text-white/60";
  }
}
