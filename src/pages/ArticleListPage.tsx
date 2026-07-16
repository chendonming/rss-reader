import { useState, useCallback, useMemo } from "react";
import {
  Text,
  Group,
  ActionIcon,
  Tooltip,
  Loader,
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
import {
  getArticles,
  markAllRead,
  toggleStar,
  deleteFeed,
  refreshFeed,
  markRead,
  refreshAll,
} from "../api";
import type { Article } from "../types";
import { ArticleReader } from "../components/ArticleReader/ArticleReader";
import { notifications } from "@mantine/notifications";
import { log } from "../utils/logger";

function formatDateLabel(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isThisYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(isThisYear ? {} : { year: "numeric" }),
  });
}

function groupByDate(
  articles: Article[],
  locale: string
): Array<{ key: string; label: string; articles: Article[] }> {
  const groups = new Map<string, Article[]>();

  for (const article of articles) {
    const key = article.pub_date
      ? new Date(article.pub_date).toDateString()
      : "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(article);
  }

  return Array.from(groups.entries())
    .sort(([aKey, aArticles], [bKey, bArticles]) => {
      if (aKey === "unknown") return 1;
      if (bKey === "unknown") return -1;
      const aTime = new Date(aArticles[0].pub_date!).getTime();
      const bTime = new Date(bArticles[0].pub_date!).getTime();
      return bTime - aTime;
    })
    .map(([key, articles]) => ({
      key,
      label:
        key === "unknown"
          ? ""
          : formatDateLabel(articles[0].pub_date!, locale),
      articles,
    }));
}

export default function ArticleListPage() {
  const { t } = useTranslation("reader");
  const { t: tl } = useTranslation("layout");
  const { t: tc } = useTranslation("common");
  const { i18n } = useTranslation();
  const { feedId } = useParams();
  const location = useLocation();
  const isStarred = location.pathname === "/starred";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["articles", feedId ?? "__all", isStarred],
    queryFn: () => {
      log.info(
        "Loading articles: feed=" +
          (feedId ?? "__all") +
          ", starred=" +
          isStarred
      );
      return getArticles(feedId, isStarred, 1, 100);
    },
  });

  const articles: Article[] = data?.articles ?? [];
  const selectedArticle = articles.find(
    (a: Article) => a.id === selectedId
  ) ?? null;

  const dateGroups = useMemo(
    () => groupByDate(articles, i18n.language),
    [articles, i18n.language]
  );

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
      if (!feedId) {
        log.warn("markAllRead called but no feed selected");
        throw new Error("No feed selected");
      }
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
      if (!feedId) {
        log.warn("deleteFeed called but no feed selected");
        throw new Error("No feed selected");
      }
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
      log.error("Refresh failed:", e.message);
      notifications.show({
        title: tc("refreshFailed"),
        message: e.message,
        color: "red",
      });
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

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleStarMutation.mutate(id);
  };

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
      <div className="rd-article-list">
        <div className="rd-article-list-header">
          <span className="rd-article-list-title">
            {isStarred
              ? t("starred")
              : t("articles", { count: data?.total ?? 0 })}
          </span>
          <span className="rd-article-list-actions">
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
          </span>
        </div>

        <div className="rd-article-scroll">
          {isLoading && (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          )}
          {dateGroups.map((group) => (
            <div key={group.key}>
              <div className="rd-date-divider">
                <span className="rd-date-divider-label">{group.label}</span>
                <span className="rd-date-divider-line" />
              </div>
              {group.articles.map((article: Article) => (
                <div
                  key={article.id}
                  className={
                    "rd-article-item" +
                    (selectedId === article.id ? " selected" : "") +
                    (article.is_read ? " read" : "")
                  }
                  onClick={() => {
                    setSelectedId(article.id);
                  }}
                >
                  <div className="rd-article-item-top">
                    <span className="rd-unread-dot" />
                    <span className="rd-article-item-title">
                      {article.title}
                    </span>
                    <span
                      className={
                        "rd-star-btn" +
                        (article.starred ? " starred" : "")
                      }
                      onClick={(e) => handleToggleStar(e, article.id)}
                    >
                      {article.starred ? (
                        <IconStarFilled size={12} />
                      ) : (
                        <IconStar size={12} />
                      )}
                    </span>
                  </div>
                  <div className="rd-article-item-meta">
                    {article.feed_title && (
                      <span className="rd-article-item-source">
                        {article.feed_title}
                      </span>
                    )}
                    {article.feed_title && article.pub_date && (
                      <span>·</span>
                    )}
                    {article.pub_date && (
                      <span>
                        {new Date(article.pub_date).toLocaleDateString(
                          i18n.language,
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                    )}
                  </div>
                  {article.summary && (
                    <div className="rd-article-item-summary">
                      {article.summary}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          {articles.length === 0 && !isLoading && (
            <div className="rd-empty">
              <div className="rd-empty-text">{t("noArticlesYet")}</div>
            </div>
          )}
        </div>
      </div>

      {/* Article Reader */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {selectedArticle ? (
          <ArticleReader article={selectedArticle} />
        ) : (
          <div className="rd-empty">
            <div className="rd-empty-text">{t("selectArticle")}</div>
          </div>
        )}
      </div>
    </Group>
  );
}
