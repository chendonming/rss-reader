import { useState, useCallback } from "react";
import {
  Box,
  Text,
  Group,
  Stack,
  ScrollArea,
  Card,
  Badge,
  ActionIcon,
  Tooltip,
  Loader,
  Divider,
} from "@mantine/core";
import {
  IconStar,
  IconStarFilled,
  IconTrash,
  IconEyeOff,
} from "@tabler/icons-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useParams, useLocation } from "react-router-dom";
import { useHotkeys } from "@mantine/hooks";
import { getArticles, markAllRead, toggleStar, deleteFeed, refreshFeed, markRead, refreshAll } from "../api";
import type { Article } from "../types";
import { ArticleReader } from "../components/ArticleReader/ArticleReader";
import { notifications } from "@mantine/notifications";

export default function ArticleListPage() {
  const { t } = useTranslation("reader");
  const { t: tl } = useTranslation("layout");
  const { t: tc } = useTranslation("common");
  const { feedId } = useParams();
  const location = useLocation();
  const isStarred = location.pathname === "/starred";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["articles", feedId ?? "__all", isStarred],
    queryFn: () => getArticles(feedId, isStarred, 1, 100),
  });

  const articles: Article[] = data?.articles ?? [];
  const selectedArticle = articles.find((a: Article) => a.id === selectedId) ?? null;

  const toggleStarMutation = useMutation({
    mutationFn: (id: string) => toggleStar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => {
      if (!feedId) throw new Error("No feed selected");
      return markAllRead(feedId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      notifications.show({ title: tc("markedAllRead"), message: "" });
    },
  });

  const deleteFeedMutation = useMutation({
    mutationFn: () => {
      if (!feedId) throw new Error("No feed selected");
      return deleteFeed(feedId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      setSelectedId(null);
      notifications.show({
        title: tc("feedDeleted"),
        message: "",
        color: "orange",
      });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: () => (feedId ? refreshFeed(feedId) : refreshAll()),
    onSuccess: (count: number) => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      if (count > 0) {
        notifications.show({
          title: tc("refreshed"),
          message: tc("fetchedNew", { count }),
          color: "green",
        });
      }
    },
    onError: (e: Error) => {
      notifications.show({ title: tc("refreshFailed"), message: e.message, color: "red" });
    },
  });

  const navigateArticles = useCallback(
    (direction: -1 | 1) => {
      if (articles.length === 0) return;
      const currentIdx = selectedId
        ? articles.findIndex((a: Article) => a.id === selectedId)
        : -1;
      let newIdx = currentIdx + direction;
      if (newIdx < 0) newIdx = 0;
      if (newIdx >= articles.length) newIdx = articles.length - 1;
      if (newIdx !== currentIdx) {
        setSelectedId(articles[newIdx].id);
      }
    },
    [articles, selectedId]
  );

  useHotkeys([
    ["j", () => navigateArticles(1)],
    ["k", () => navigateArticles(-1)],
    [
      "s",
      () => {
        if (selectedId) toggleStarMutation.mutate(selectedId);
      },
    ],
    [
      "m",
      () => {
        if (selectedId) markReadMutation.mutate(selectedId);
      },
    ],
    ["r", () => refreshMutation.mutate()],
    [
      "o",
      () => {
        if (selectedArticle?.link) {
          window.open(selectedArticle.link, "_blank");
        }
      },
    ],
  ]);

  if (isError) {
    return (
      <Group justify="center" py="xl">
        <Text c="red">{tc("failedToLoadArticles")}</Text>
      </Group>
    );
  }

  return (
    <Group h="100%" gap={0} align="stretch" wrap="nowrap">
      {/* Article List */}
      <Box
        style={{
          width: 380,
          flexShrink: 0,
          borderRight: "1px solid var(--mantine-color-default-border)",
        }}
      >
        <Group px="md" py="sm" justify="space-between">
          <Text fw={600} size="sm">
            {isStarred
              ? t("starred")
              : `${t("articles", { count: data?.total ?? 0 })}`}
          </Text>
          <Group gap={4}>
            {feedId && (
              <>
                <Tooltip label={tl("markAllRead")}>
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    onClick={() => markAllReadMutation.mutate()}
                  >
                    <IconEyeOff size={14} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={tl("deleteFeed")}>
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    color="red"
                    onClick={() => deleteFeedMutation.mutate()}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Tooltip>
              </>
            )}
          </Group>
        </Group>
        <Divider />
        <ScrollArea h="calc(100vh - 100px)" type="hover">
          {isLoading && (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          )}
          <Stack gap={2} p="xs">
            {articles.map((article: Article) => (
              <Card
                key={article.id}
                padding="sm"
                withBorder
                style={{
                  cursor: "pointer",
                  opacity: article.is_read ? 0.65 : 1,
                  borderColor:
                    selectedId === article.id
                      ? "var(--mantine-color-blue-5)"
                      : undefined,
                }}
                onClick={() => {
                  setSelectedId(article.id);
                }}
              >
                <Group justify="space-between" wrap="nowrap" mb={4}>
                  <Text
                    size="sm"
                    fw={article.is_read ? 400 : 600}
                    lineClamp={2}
                    style={{ flex: 1 }}
                  >
                    {article.title}
                  </Text>
                  <ActionIcon
                    variant="subtle"
                    size="xs"
                    color="yellow"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      toggleStarMutation.mutate(article.id);
                    }}
                  >
                    {article.starred ? (
                      <IconStarFilled size={12} />
                    ) : (
                      <IconStar size={12} />
                    )}
                  </ActionIcon>
                </Group>
                <Group gap="xs">
                  {article.feed_title && (
                    <Badge size="xs" variant="light" color="gray">
                      {article.feed_title}
                    </Badge>
                  )}
                  {article.pub_date && (
                    <Text size="xs" c="dimmed">
                      {new Date(article.pub_date).toLocaleDateString()}
                    </Text>
                  )}
                </Group>
                {article.summary && (
                  <Text size="xs" c="dimmed" lineClamp={2} mt={4}>
                    {article.summary}
                  </Text>
                )}
              </Card>
            ))}
            {articles.length === 0 && !isLoading && (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                {t("noArticlesYet")}
              </Text>
            )}
          </Stack>
        </ScrollArea>
      </Box>

      {/* Article Reader */}
      <Box style={{ flex: 1, minWidth: 0 }}>
        {selectedArticle ? (
          <ArticleReader article={selectedArticle} />
        ) : (
          <Group justify="center" align="center" h="100%">
            <Text c="dimmed">{t("selectArticle")}</Text>
          </Group>
        )}
      </Box>
    </Group>
  );
}
