import {
  NavLink,
  Stack,
  ActionIcon,
  Tooltip,
  Text,
  Badge,
  Group,
  Box,
  Loader,
} from "@mantine/core";
import {
  IconRss,
  IconStar,
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getFeeds, refreshAll } from "../../api";
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
      log.info("Refresh all completed: " + count + " new articles");
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

  const isActive = (path: string) => location.pathname === path;

  const totalUnread =
    feeds?.reduce((sum, f) => sum + f.unread_count, 0) ?? 0;

  return (
    <>
      <Stack h="100%" gap={0}>
        <Group px="sm" pb="xs" justify="space-between">
          <Text size="sm" c="dimmed" fw={500}>
            {t("feeds")}
          </Text>
          <Group gap={4}>
            <Tooltip label={t("refreshAll")}>
              <ActionIcon variant="subtle" size="sm" onClick={handleRefreshAll}>
                <IconRefresh size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t("addFeed")}>
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => setAddModalOpen(true)}
              >
                <IconPlus size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        <NavLink
          label={
            <Group gap="xs" wrap="nowrap">
              <Text size="sm">{t("allArticles")}</Text>
              {totalUnread > 0 && (
                <Badge size="xs" variant="filled" color="gray">
                  {totalUnread}
                </Badge>
              )}
            </Group>
          }
          leftSection={<IconRss size={16} />}
          active={isActive("/")}
          onClick={() => navigate("/")}
          styles={{ root: { borderRadius: "var(--mantine-radius-sm)" } }}
        />

        <NavLink
          label={t("starred")}
          leftSection={<IconStar size={16} />}
          active={isActive("/starred")}
          onClick={() => navigate("/starred")}
          styles={{ root: { borderRadius: "var(--mantine-radius-sm)" } }}
        />

        <Box
          style={{
            flex: 1,
            overflowY: "auto",
            marginTop: "var(--mantine-spacing-xs)",
          }}
        >
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
            <NavLink
              key={feed.id}
              label={
                <Group gap="xs" wrap="nowrap">
                  <Text size="sm" lineClamp={1}>
                    {feed.title}
                  </Text>
                  {feed.unread_count > 0 && (
                    <Badge size="xs" variant="light" color="blue">
                      {feed.unread_count}
                    </Badge>
                  )}
                </Group>
              }
              leftSection={<IconRss size={14} />}
              active={feed.id === feedId}
              onClick={() => navigate(`/feed/${feed.id}`)}
              styles={{ root: { borderRadius: "var(--mantine-radius-sm)" } }}
            />
          ))}
          {feeds?.length === 0 && !isLoading && (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              {t("noFeedsYet")}
            </Text>
          )}
        </Box>
      </Stack>

      <AddFeedModal
        opened={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </>
  );
}
