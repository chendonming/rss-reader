import { Outlet, useNavigate } from "react-router-dom";
import { useHotkeys } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { ActionIcon, Tooltip } from "@mantine/core";
import { IconSettings, IconRss } from "@tabler/icons-react";
import { FeedList } from "../FeedList/FeedList";

export function AppLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation("layout");

  useHotkeys([["mod+,", () => navigate("/settings")]]);

  return (
    <div className="rd-shell">
      <header className="rd-header">
        <div className="rd-header-title">
          <IconRss className="rd-header-logo" />
          <span>{t("appTitle")}</span>
        </div>
        <Tooltip label={t("settingsTooltip")}>
          <ActionIcon size="sm" onClick={() => navigate("/settings")}>
            <IconSettings size={16} />
          </ActionIcon>
        </Tooltip>
      </header>
      <div className="rd-body">
        <nav className="rd-sidebar-panel">
          <FeedList />
        </nav>
        <main className="rd-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
