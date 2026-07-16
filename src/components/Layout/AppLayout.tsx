import { AppShell, Group, Title, ActionIcon, Tooltip } from "@mantine/core";
import { Outlet, useNavigate } from "react-router-dom";
import { useHotkeys } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { IconSettings, IconRss } from "@tabler/icons-react";
import { FeedList } from "../FeedList/FeedList";

export function AppLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation("layout");

  useHotkeys([["mod+,", () => navigate("/settings")]]);

  return (
    <AppShell
      navbar={{ width: 260, breakpoint: 0 }}
      header={{ height: 50 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <IconRss size={22} color="var(--mantine-color-orange-6)" />
            <Title order={4}>{t("appTitle")}</Title>
          </Group>
          <Tooltip label={t("settingsTooltip")}>
            <ActionIcon variant="subtle" onClick={() => navigate("/settings")}>
              <IconSettings size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <FeedList />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
