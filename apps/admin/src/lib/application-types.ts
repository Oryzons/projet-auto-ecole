export type TheoryCourseInfo = {
  status: "attended" | "absent" | "registered" | "none";
  title: string | null;
  startsAt: string | null;
  attendedAt: string | null;
};

export type ApplicationDetail = {
  theoryCourse?: TheoryCourseInfo;
  id: string;
  status: string;
  permitType: string;
  partnerRate: boolean;
  partnerCompany?: string | null;
  discountCode?: string | null;
  discountKind?: string | null;
  discountValue?: number | null;
  totalAmount: number | null;
  updatedAt: string;
  createdAt: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    profilePhotoUrl?: string | null;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    dateOfBirth?: string | null;
    oedippNumber?: string | null;
  };
  payments: {
    id: string;
    status: string;
    amount: number;
    method?: string | null;
    installmentCount?: number | null;
    installmentIndex?: number | null;
    paidAt: string | null;
    createdAt: string;
  }[];
  documents: {
    id: string;
    type: string;
    status: string;
    fileName: string;
    rejectionReason: string | null;
    createdAt: string;
  }[];
};
