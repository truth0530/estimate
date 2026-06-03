// 도메인 타입 — PLAN.md 4장 스키마와 1:1 대응.
// 로컬 어댑터와 Supabase 어댑터가 동일한 이 타입을 공유한다.

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'canceled';

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
	draft: '작성 중',
	sent: '발송',
	accepted: '승인',
	rejected: '반려',
	canceled: '취소'
};

export interface Company {
	id: string;
	business_number: string;
	name: string;
	ceo_name: string;
	address: string;
	phone: string;
	logo_data: string | null; // 로컬: dataURL / 운영: signed URL or dataURL
	stamp_data: string | null;
	bank_account: string;
	is_tax_free: boolean;
}

export interface Customer {
	id: string;
	name: string;
	business_number: string;
	ceo_name: string;
	address: string;
	contact: string;
	memo: string;
}

export interface Item {
	id: string;
	name: string;
	spec: string;
	unit: string;
	unit_price: number;
	category: string;
	active: boolean;
}

export interface QuoteLine {
	id: string;
	item_id: string | null; // 마스터 참조(이력용). 하드삭제 시 null
	item_name: string; // 발행 시점 스냅샷
	spec: string;
	unit: string;
	quantity: number;
	unit_price: number; // 발행 시점 단가 스냅샷
	amount: number; // floor(quantity * unit_price)
	sort_order: number;
}

export interface Quote {
	id: string;
	quote_number: string; // YYYYMM-NNN
	customer_id: string | null;
	issue_date: string; // YYYY-MM-DD
	valid_until: string | null;
	status: QuoteStatus;
	supply_amount: number;
	vat_amount: number;
	total_amount: number;
	notes: string;
	lines: QuoteLine[];
}
