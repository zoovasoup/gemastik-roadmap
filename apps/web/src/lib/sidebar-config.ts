export type LearnerSidebarItemId = "dashboard" | "settings";
export type LearnerSidebarSectionId = "main" | "secondary";
export type LearnerSidebarIcon = "layout-dashboard" | "settings-2";

export type LearnerSidebarItem = {
	id: LearnerSidebarItemId;
	title: string;
	href: string;
	icon: LearnerSidebarIcon;
	section: LearnerSidebarSectionId;
	defaultVisible?: boolean;
	defaultPinned?: boolean;
};

export const learnerSidebarItems: LearnerSidebarItem[] = [
	{
		id: "dashboard",
		title: "Dashboard",
		href: "/dashboard",
		icon: "layout-dashboard",
		section: "main",
		defaultVisible: true,
		defaultPinned: true,
	},
	{
		id: "settings",
		title: "Settings",
		href: "/dashboard/settings",
		icon: "settings-2",
		section: "secondary",
		defaultVisible: true,
	},
];

export type SidebarPreferencesState = {
	hiddenItemIds: string[];
	pinnedItemIds: string[];
	itemOrder: string[];
	collapsedSections: string[];
};

export type ResolvedSidebarItem = {
	id: LearnerSidebarItemId;
	title: string;
	href: string;
	icon: LearnerSidebarIcon;
	isPinned: boolean;
	section: LearnerSidebarSectionId;
};

export type ResolvedSidebarData = {
	main: ResolvedSidebarItem[];
	secondary: ResolvedSidebarItem[];
	preferences: SidebarPreferencesState;
};
