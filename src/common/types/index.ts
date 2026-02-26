export interface IdentifyRequest {
  email?: string | null;
  phoneNumber?: string | null;
}

export interface ConsolidatedContact {
  primaryContatctId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

export interface IdentifyResponse {
  contact: ConsolidatedContact;
}
