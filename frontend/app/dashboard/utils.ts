export const normalizeProfessionType = (professionType?: string | null) => {
  return professionType?.trim().toUpperCase() || "";
};

export const mapProfessionToSlug = (professionType?: string | null) => {
  switch (normalizeProfessionType(professionType)) {
    case "CONTRACTOR":
      return "contractor";
    case "ENGINEER":
      return "engineer";
    case "LAWYER":
      return "lawyer";
    case "ARCHITECT":
      return "architect";
    case "QS":
      return "qs";
    case "HARDWARE":
      return "hardware";
    default:
      return "professional";
  }
};