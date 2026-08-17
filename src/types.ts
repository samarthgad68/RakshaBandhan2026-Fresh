export type TemplateThemeId = 
  | 'template-1'
  | 'template-2'
  | 'template-3'
  | 'template-4'
  | 'template-5'
  | 'template-6'
  | 'template-7'
  | 'template-8'
  | 'template-9'
  | 'template-10'
  | 'template-11'
  | 'template-12'
  | 'template-13';

export interface VideoTemplate {
  id: TemplateThemeId;
  name: string;
  badge: string;
  videoPath: string;
  // Specifications for video layout (1080x1920 base)
  videoWidth: number;
  videoHeight: number;
  photoX: number;
  photoY: number;
  photoWidth: number;
  photoHeight: number;
  nameX: number;
  nameY: number;
  nameWidth: number;
  nameHeight: number;
  textColor: string;
  accentColor: string;
}

export interface GreetingFormData {
  templateId: TemplateThemeId;
  photo: string; // Base64 or Object URL of single uploaded photo
  name: string;  // Single user name
}

export interface PaymentInfo {
  isPaid: boolean;
  paymentId: string;
  upiRef: string;
  amount: number;
  paidAt: string | null;
  paymentToken?: string;
}

