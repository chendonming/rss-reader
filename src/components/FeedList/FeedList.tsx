import {
  ActionIcon,
  Tooltip,
  Text,
  Loader,
  Group,
  Modal,
  Button,
  Stack,
} from "@mantine/core";
import {
  IconRss,
  IconStar,
  IconPlus,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getFeeds, deleteFeed, refreshAll } from "../../api";
import type { Feed } from "../../types";
import { AddFeedModal } from "./AddFeedModal";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { log } from "../../utils/logger";

export function FeedList() {
  const { t } = useTranslation("layout");
  const { t: tc } = useTranslation("common");
  const navigate = useNavigate();
  const location = useLocation();
  const { feedId } = useParams();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteConfirmFeed, setDeleteConfirmFeed] = useState<Feed | null>(null);
  const queryClient = useQueryClient();

  const {
    data: feeds,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["feeds"],
    queryFn: getFeeds,
  });

  const handleRefreshAll = async () => {
    log.info("Refreshing all feeds...");
    try {
      const count = await refreshAll();
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      if (count > 0) {
        notifications.show({
          title: tc("refreshed"),
          message: tc("fetchedNew", { count }),
          color: "green",
        });
      } else {
        notifications.show({
          title: tc("upToDate"),
          message: tc("noNewArticles"),
        });
      }
    } catch (e) {
      log.error("Refresh all failed:", e);
      notifications.show({
        title: tc("error"),
        message: String(e),
        color: "red",
      });
    }
  };

  const handleDeleteFeed = async (feed: Feed) => {
    try {
      await deleteFeed(feed.id);
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      notifications.show({
        title: tc("feedDeleted"),
        message: "",
        color: "green",
      });
      if (feedId === feed.id) {
        navigate("/");
      }
    } catch (e) {
      log.error("Delete feed failed:", e);
      notifications.show({
        title: tc("error"),
        message: String(e),
        color: "red",
      });
    } finally {
      setDeleteConfirmFeed(null);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const totalUnread =
    feeds?.reduce((sum, f) => sum + f.unread_count, 0) ?? 0;

  return (
    <>
      <div className="rd-sidebar">
        <div className="rd-sidebar-nav">
          <div
            className={"rd-nav-item" + (isActive("/") ? " active" : "")}
            onClick={() => navigate("/")}
          >
            <IconRss className="rd-nav-icon" />
            <span className="rd-nav-label">{t("allArticles")}</span>
            {totalUnread > 0 && (
              <span className="rd-nav-count">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>

          <div
            className={"rd-nav-item" + (isActive("/starred") ? " active" : "")}
            onClick={() => navigate("/starred")}
          >
            <IconStar className="rd-nav-icon" />
            <span className="rd-nav-label">{t("starred")}</span>
          </div>
        </div>

        <div className="rd-sidebar-divider" />

        <div className="rd-sidebar-section-header">
          <span className="rd-sidebar-section-label">{t("feeds")}</span>
          <span className="rd-sidebar-section-actions">
            <Tooltip label={t("refreshAll")}>
              <ActionIcon variant="subtle" size="xs" onClick={handleRefreshAll}>
                <IconRefresh size={12} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t("addFeed")}>
              <ActionIcon
                variant="subtle"
                size="xs"
                onClick={() => setAddModalOpen(true)}
              >
                <IconPlus size={12} />
              </ActionIcon>
            </Tooltip>
          </span>
        </div>

        <div className="rd-sidebar-feeds">
          {isLoading && (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          )}
          {isError && (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              {t("failedToLoadFeeds")}
            </Text>
          )}
          {feeds?.map((feed: Feed) => (
            <div
              key={feed.id}
              className={
                "rd-nav-item" +
                (feed.id === feedId ? " active" : "") +
                (feed.unread_count > 0 ? " has-unread" : "")
              }
              onClick={() => navigate(`/feed/${feed.id}`)}
            >
              <IconRss className="rd-nav-icon" />
              <span className="rd-nav-label">{feed.title}</span>
              <Tooltip label={t("deleteFeed")}>
                <ActionIcon
                  variant="subtle"
                  size="xs"
                  className="rd-nav-delete"
                  color="gray"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmFeed(feed);
                  }}
                >
                  <IconTrash size={12} />
                </ActionIcon>
              </Tooltip>
              {feed.unread_count > 0 && (
                <span className="rd-nav-count">
                  {feed.unread_count > 99 ? "99+" : feed.unread_count}
                </span>
              )}
            </div>
          ))}
          {feeds?.length === 0 && !isLoading && (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              {t("noFeedsYet")}
            </Text>
          )}
        </div>
      </div>

      <AddFeedModal
        opened={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />

      <Modal
        opened={!!deleteConfirmFeed}
        onClose={() => setDeleteConfirmFeed(null)}
        title={t("deleteFeed")}
        centered
      >
        <Stack>
          <Text size="sm">
            {t("confirmDelete", { title: deleteConfirmFeed?.title ?? "" })}
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setDeleteConfirmFeed(null)}
            >
              {tc("cancel")}
            </Button>
            <Button
              color="red"
              onClick={() => deleteConfirmFeed && handleDeleteFeed(deleteConfirmFeed)}
            >
              {t("deleteFeed")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
