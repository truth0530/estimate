// 로컬 데이터 어댑터 (localStorage 백업, Svelte 5 runes 반응형).
//
// 이 모듈은 Supabase 없이도 앱이 즉시 작동하도록 한다.
// 운영 전환 시 동일한 메서드 시그니처로 supabase.svelte.ts를 만들어
// 이 싱글턴을 교체하면 화면 코드는 그대로 둘 수 있다.
// (saveQuote = PLAN.md §4-7 save_quote RPC, nextQuoteNumber = §4-6 와 1:1 대응)

import type { Company, Customer, Item, Quote, QuoteLine, QuoteStatus } from '../types';
import { computeTotals, lineAmount } from '../money';

const KEY = 'estimate-db-v1';

interface Snapshot {
	company: Company | null;
	customers: Customer[];
	items: Item[];
	quotes: Quote[];
}

function uid(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
	return 'id-' + Math.floor(Math.random() * 1e9).toString(36);
}

function todayISO(): string {
	return new Date().toISOString().slice(0, 10);
}

function seed(): Snapshot {
	const company: Company = {
		id: uid(),
		business_number: '123-45-67890',
		name: '한빛엔지니어링',
		ceo_name: '김상현',
		address: '서울특별시 마포구 월드컵북로 12',
		phone: '02-1234-5678',
		logo_data: null,
		stamp_data: null,
		bank_account: '국민은행 123456-00-789012',
		is_tax_free: false
	};
	const customer: Customer = {
		id: uid(),
		name: '대원건설',
		business_number: '210-81-55667',
		ceo_name: '박정우',
		address: '경기도 성남시 분당구 판교로 200',
		contact: '031-700-1234',
		memo: ''
	};
	const items: Item[] = [
		{ id: uid(), name: '이형철근 SD400', spec: 'D13', unit: 'ton', unit_price: 980000, category: '철근', active: true },
		{ id: uid(), name: '레미콘', spec: '25-24-150', unit: 'm³', unit_price: 78000, category: '콘크리트', active: true },
		{ id: uid(), name: '시멘트', spec: '40kg', unit: '포', unit_price: 8500, category: '자재', active: true },
		{ id: uid(), name: '거푸집 합판', spec: '12T', unit: '장', unit_price: 21000, category: '가설', active: true }
	];
	return { company, customers: [customer], items, quotes: [] };
}

class Database {
	company = $state<Company | null>(null);
	customers = $state<Customer[]>([]);
	items = $state<Item[]>([]);
	quotes = $state<Quote[]>([]);
	ready = $state(false);

	constructor() {
		this.load();
	}

	private load() {
		if (typeof localStorage === 'undefined') return;
		const raw = localStorage.getItem(KEY);
		let snap: Snapshot;
		if (raw) {
			try {
				snap = JSON.parse(raw) as Snapshot;
			} catch {
				snap = seed();
			}
		} else {
			snap = seed();
		}
		this.company = snap.company;
		this.customers = snap.customers ?? [];
		this.items = snap.items ?? [];
		this.quotes = snap.quotes ?? [];
		this.ready = true;
		if (!raw) this.persist();
	}

	private persist() {
		if (typeof localStorage === 'undefined') return;
		const snap: Snapshot = {
			company: this.company,
			customers: this.customers,
			items: this.items,
			quotes: this.quotes
		};
		localStorage.setItem(KEY, JSON.stringify(snap));
	}

	/* ---------- 회사 정보 ---------- */
	saveCompany(c: Company) {
		this.company = { ...c, id: c.id || uid() };
		this.persist();
	}

	/* ---------- 거래처 ---------- */
	getCustomer(id: string | null) {
		return this.customers.find((c) => c.id === id) ?? null;
	}
	saveCustomer(c: Customer): string {
		const id = c.id || uid();
		const next = { ...c, id };
		const i = this.customers.findIndex((x) => x.id === id);
		if (i >= 0) this.customers[i] = next;
		else this.customers = [...this.customers, next];
		this.persist();
		return id;
	}
	removeCustomer(id: string) {
		this.customers = this.customers.filter((c) => c.id !== id);
		this.persist();
	}

	/* ---------- 품목 ---------- */
	get activeItems() {
		return this.items.filter((i) => i.active);
	}
	getItem(id: string | null) {
		return this.items.find((i) => i.id === id) ?? null;
	}
	saveItem(it: Item): string {
		const id = it.id || uid();
		const next = { ...it, id };
		const i = this.items.findIndex((x) => x.id === id);
		if (i >= 0) this.items[i] = next;
		else this.items = [...this.items, next];
		this.persist();
		return id;
	}
	/** 소프트 삭제 — PLAN.md §4-5 (과거 견적 스냅샷 보존) */
	softDeleteItem(id: string) {
		const i = this.items.findIndex((x) => x.id === id);
		if (i >= 0) {
			this.items[i] = { ...this.items[i], active: false };
			this.persist();
		}
	}

	/* ---------- 견적서 ---------- */
	getQuote(id: string | null) {
		return this.quotes.find((q) => q.id === id) ?? null;
	}

	/** 월별 채번 YYYYMM-NNN (로컬판 next_quote_number) */
	private nextQuoteNumber(issueDate: string): string {
		const ym = issueDate.slice(0, 7).replace('-', ''); // YYYYMM
		const seqs = this.quotes
			.filter((q) => q.quote_number.startsWith(ym + '-'))
			.map((q) => parseInt(q.quote_number.split('-')[1] ?? '0', 10))
			.filter((n) => !isNaN(n));
		const next = (seqs.length ? Math.max(...seqs) : 0) + 1;
		return `${ym}-${String(next).padStart(3, '0')}`;
	}

	/** 원자적 저장 (로컬판 save_quote): 채번 + 라인 스냅샷 + 합계 재계산 */
	saveQuote(input: {
		id?: string;
		quote_number?: string;
		customer_id: string | null;
		issue_date: string;
		valid_until: string | null;
		status: QuoteStatus;
		notes: string;
		lines: Array<Partial<QuoteLine>>;
	}): string {
		const isNew = !input.id;
		const id = input.id || uid();

		// 라인 정규화 + amount 재계산 (클라이언트 입력 불신)
		const lines: QuoteLine[] = input.lines
			.filter((l) => (l.item_name ?? '').trim() !== '')
			.map((l, idx) => {
				const quantity = Number(l.quantity) || 0;
				const unit_price = Number(l.unit_price) || 0;
				return {
					id: l.id || uid(),
					item_id: l.item_id ?? null,
					item_name: (l.item_name ?? '').trim(),
					spec: l.spec ?? '',
					unit: l.unit ?? '',
					quantity,
					unit_price,
					amount: lineAmount(quantity, unit_price),
					sort_order: idx
				};
			});

		const totals = computeTotals(lines, this.company?.is_tax_free ?? false);

		// 채번: 진짜 신규일 때만 (PLAN.md §4-7 가드)
		let quote_number = input.quote_number ?? '';
		if (!quote_number) {
			quote_number = isNew
				? this.nextQuoteNumber(input.issue_date)
				: (this.getQuote(id)?.quote_number ?? this.nextQuoteNumber(input.issue_date));
		}

		const quote: Quote = {
			id,
			quote_number,
			customer_id: input.customer_id,
			issue_date: input.issue_date,
			valid_until: input.valid_until,
			status: input.status,
			supply_amount: totals.supply,
			vat_amount: totals.vat,
			total_amount: totals.total,
			notes: input.notes,
			lines
		};

		const i = this.quotes.findIndex((q) => q.id === id);
		if (i >= 0) this.quotes[i] = quote;
		else this.quotes = [...this.quotes, quote];
		this.persist();
		return id;
	}

	updateStatus(id: string, status: QuoteStatus) {
		const i = this.quotes.findIndex((q) => q.id === id);
		if (i >= 0) {
			this.quotes[i] = { ...this.quotes[i], status };
			this.persist();
		}
	}

	removeQuote(id: string) {
		this.quotes = this.quotes.filter((q) => q.id !== id);
		this.persist();
	}

	/** 견적 목록: 발행일 desc */
	get quotesSorted() {
		return [...this.quotes].sort((a, b) =>
			b.issue_date.localeCompare(a.issue_date) || b.quote_number.localeCompare(a.quote_number)
		);
	}

	resetToSeed() {
		const snap = seed();
		this.company = snap.company;
		this.customers = snap.customers;
		this.items = snap.items;
		this.quotes = snap.quotes;
		this.persist();
	}

	helpers = { uid, todayISO };
}

export const db = new Database();
export { uid, todayISO };
