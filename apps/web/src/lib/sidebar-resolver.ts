import {
	learnerSidebarItems,
	type ResolvedSidebarData,
	type SidebarPreferencesState,
} from "@/lib/sidebar-config";

const emptyPreferences: SidebarPreferencesState = {
	hiddenItemIds: [],
	pinnedItemIds: [],
	itemOrder: [],
	collapsedSections: [],
};

export function getDefaultSidebarPreferences(): SidebarPreferencesState {
	return emptyPreferences;
}

export function resolveLearnerSidebar(
	preferences?: Partial<SidebarPreferencesState> | null,
): ResolvedSidebarData {
	const mergedPreferences: SidebarPreferencesState = {
		hiddenItemIds: preferences?.hiddenItemIds ?? [],
		pinnedItemIds: preferences?.pinnedItemIds ?? [],
		itemOrder: preferences?.itemOrder ?? [],
		collapsedSections: preferences?.collapsedSections ?? [],
	};

	const visibleItems = learnerSidebarItems.filter((item) => {
		if (item.defaultVisible === false) {
			return false;
		}

		return !mergedPreferences.hiddenItemIds.includes(item.id);
	});

	const orderLookup = new Map(
		mergedPreferences.itemOrder.map((itemId, index) => [itemId, index] as const),
	);

	const sortedItems = [...visibleItems].sort((left, right) => {
		const leftOrder = orderLookup.get(left.id) ?? Number.MAX_SAFE_INTEGER;
		const rightOrder = orderLookup.get(right.id) ?? Number.MAX_SAFE_INTEGER;

		if (leftOrder !== rightOrder) {
			return leftOrder - rightOrder;
		}

		return learnerSidebarItems.findIndex((item) => item.id === left.id) - learnerSidebarItems.findIndex((item) => item.id === right.id);
	});

	const resolvedItems = sortedItems.map((item) => ({
		id: item.id,
		title: item.title,
		href: item.href,
		icon: item.icon,
		section: item.section,
		isPinned: mergedPreferences.pinnedItemIds.includes(item.id) || Boolean(item.defaultPinned),
	}));

	return {
		main: resolvedItems.filter((item) => item.section === "main"),
		secondary: resolvedItems.filter((item) => item.section === "secondary"),
		preferences: mergedPreferences,
	};
}
