<script lang="ts">
	// 백업 환기 배너 — 데이터가 있는데 한 번도 백업 안 했거나 14일↑ 지났을 때 적극 유도.
	// (설정 화면의 "마지막 백업: N일 전" 표시보다 강한 넛지)
	import { db } from '$lib/data/db.svelte';
	import { daysSince } from '$lib/format';
	import { downloadBackup } from '$lib/export/backup';

	let dismissed = $state(false);
	$effect(() => {
		if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('backup-nudge-dismissed')) {
			dismissed = true;
		}
	});

	const days = $derived(daysSince(db.lastBackupAt, Date.now()));
	const never = $derived(db.lastBackupAt === null);
	const overdue = $derived(db.quotes.length > 0 && (never || (days !== null && days >= 14)));
	const show = $derived(overdue && !dismissed);

	function dismiss() {
		dismissed = true;
		try {
			sessionStorage.setItem('backup-nudge-dismissed', '1');
		} catch {
			/* ignore */
		}
	}
	function backupNow() {
		downloadBackup();
		dismiss();
	}
</script>

{#if show}
	<div class="border-b border-line bg-sunken px-4 py-2.5">
		<div class="mx-auto flex max-w-3xl items-center gap-3 text-[13px]">
			<span class="min-w-0 flex-1 text-text">
				{#if never}
					아직 백업한 적이 없어요. 기기 데이터가 지워지면 복구할 수 없습니다.
				{:else}
					백업한 지 {days}일 됐어요. 데이터를 안전하게 보관하세요.
				{/if}
			</span>
			<button class="shrink-0 font-semibold text-accent hover:underline" onclick={backupNow}>
				지금 백업
			</button>
			<button class="shrink-0 text-faint hover:text-muted" onclick={dismiss}>나중에</button>
		</div>
	</div>
{/if}
