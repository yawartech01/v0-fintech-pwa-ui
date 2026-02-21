export interface User {
  id: string;
  uid: number;
  email: string;
  phone?: string;
  name: string;
  referral_code: string;
  leader_id?: string;
  upline_id?: string;
  is_banned: boolean;
  ban_reason?: string;
  banned_at?: Date;
  banned_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Wallet {
  id: string;
  user_id: string;
  available_usdt: number;
  locked_usdt: number;
  total_usdt: number;
  created_at: Date;
  updated_at: Date;
}

export interface Deposit {
  id: string;
  user_id: string;
  network: string;
  amount_usdt: number;
  tx_hash: string;
  from_address: string;
  to_address: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  required_confirmations: number;
  swept: boolean;
  swept_at?: Date;
  created_at: Date;
  confirmed_at?: Date;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  network: string;
  amount_usdt: number;
  fee_usdt: number;
  address: string;
  status: 'under_review' | 'approved' | 'sent' | 'completed' | 'rejected';
  tx_hash?: string;
  rejection_reason?: string;
  created_at: Date;
  reviewed_at?: Date;
  reviewed_by?: string;
  completed_at?: Date;
}

export interface BankAccount {
  id: string;
  user_id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  label?: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SellAd {
  id: string;
  user_id: string;
  bank_account_id: string;
  amount_total_usdt: number;
  amount_remaining_usdt: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  payment_receipt?: string;
  payment_receipt_uploaded_at?: Date;
  payment_receipt_uploaded_by?: string;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

export interface PlatformSettings {
  key: string;
  value: string;
  updated_at: Date;
  updated_by?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  admin_id?: string;
  user_id?: string;
  details?: any;
  ip_address?: string;
  created_at: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
  uid: number;
  isAdmin?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
