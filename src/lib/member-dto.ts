// Serializable member shape passed from server to client components.
// Kept free of Prisma imports so client bundles can use it.

export type MemberDTO = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  vegetarian: boolean;
  vegan: boolean;
  kosher: boolean;
  celiac: boolean;
  hasAllergy: boolean;
  allergyDetails: string | null;
  allergySevere: boolean;
  notes: string | null;
  consentAt: string;
  createdAt: string;
  updatedAt: string;
};

type MemberRow = Omit<MemberDTO, "consentAt" | "createdAt" | "updatedAt"> & {
  consentAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export function toDTO(m: MemberRow): MemberDTO {
  return {
    id: m.id,
    fullName: m.fullName,
    email: m.email,
    phone: m.phone,
    vegetarian: m.vegetarian,
    vegan: m.vegan,
    kosher: m.kosher,
    celiac: m.celiac,
    hasAllergy: m.hasAllergy,
    allergyDetails: m.allergyDetails,
    allergySevere: m.allergySevere,
    notes: m.notes,
    consentAt: m.consentAt.toISOString(),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

/** What the public endpoint echoes back to the submitter (their own data only). */
export type SavedSummary = Pick<
  MemberDTO,
  | "fullName"
  | "email"
  | "phone"
  | "vegetarian"
  | "vegan"
  | "kosher"
  | "celiac"
  | "hasAllergy"
  | "allergyDetails"
  | "allergySevere"
  | "notes"
>;

export function toSavedSummary(m: SavedSummary): SavedSummary {
  return {
    fullName: m.fullName,
    email: m.email,
    phone: m.phone,
    vegetarian: m.vegetarian,
    vegan: m.vegan,
    kosher: m.kosher,
    celiac: m.celiac,
    hasAllergy: m.hasAllergy,
    allergyDetails: m.allergyDetails,
    allergySevere: m.allergySevere,
    notes: m.notes,
  };
}
