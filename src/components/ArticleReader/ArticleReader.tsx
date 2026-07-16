import { useState, useMemo, useEffect } from "react";
import "../../styles/article.css";
import {
  Box,
  Text,
  Group,
  Stack,
  ScrollArea,
  ActionIcon,
  Tooltip,
  Button,
  Paper,
  Divider,
  Title,
  Menu,
} from "@mantine/core";
import {
  IconStar,
  IconStarFilled,
  IconExternalLink,
  IconLanguage,
  IconRobot,
  IconEye,
  IconEyeOff,
  IconChevronDown,
  IconRefresh,
} from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  markRead,
  toggleStar,
  translateArticle,
  summarizeArticle,
  getTranslationLayout,
  setTranslationLayout,
} from "../../api";
import type { Article, TranslationLayout } from "../../types";
import { notifications } from "@mantine/notifications";
import { log } from "../../utils/logger";

interface Props {
  article: Article;
}

export function ArticleReader({ article }: Props) {
  const { t, i18n } = useTranslation("reader");
  const { t: tc } = useTranslation("common");
  const [showTranslation, setShowTranslation] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [translationText, setTranslationText] = useState<string | null>(
    article.translation ?? null
  );
  const [summaryText, setSummaryText] = useState<string | null>(
    article.summary_ai ?? null
  );
  const [layoutMode, setLayoutMode] = useState<TranslationLayout>("replace");
  const queryClient = useQueryClient();

  // Load persisted layout preference
  useEffect(() => {
    getTranslationLayout().then((layout) => {
      if (layout === "replace" || layout === "side-by-side") {
        setLayoutMode(layout);
      }
    });
  }, []);

  // Reset translation/summary state when switching articles
  useEffect(() => {
    setTranslationText(article.translation ?? null);
    setSummaryText(article.summary_ai ?? null);
    setShowTranslation(false);
    setShowSummary(false);
  }, [article.id]);

  const sanitizedContent = useMemo(() => {
    if (!article.content) return "";
    return DOMPurify.sanitize(article.content, {
      ADD_ATTR: ["target"],
    });
  }, [article.content]);

  const markReadMutation = useMutation({
    mutationFn: () => markRead(article.id),
    onMutate: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });

  const toggleStarMutation = useMutation({
    mutationFn: () => toggleStar(article.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });

  const translateMutation = useMutation({
    mutationFn: (opts?: { force?: boolean }) =>
      translateArticle(article.id, opts?.force),
    onSuccess: (data) => {
      setTranslationText(data);
      setShowTranslation(true);
    },
    onError: (e: Error) => {
      log.error("Translation failed for article {}:", article.id, e);
      notifications.show({
        title: tc("translationFailed"),
        message: e.message,
        color: "red",
      });
    },
  });

  const summarizeMutation = useMutation({
    mutationFn: () => summarizeArticle(article.id),
    onSuccess: (data) => {
      setSummaryText(data);
      setShowSummary(true);
    },
    onError: (e: Error) => {
      log.error("Summary failed for article {}:", article.id, e);
      notifications.show({
        title: tc("summaryFailed"),
        message: e.message,
        color: "red",
      });
    },
  });

  const handleOpenInBrowser = () => {
    if (article.link) {
      window.open(article.link, "_blank");
    }
  };

  const handleTranslateClick = () => {
    if (translationText) {
      setShowTranslation(!showTranslation);
    } else {
      translateMutation.mutate(undefined);
    }
  };

  const handleLayoutChange = (layout: TranslationLayout) => {
    setLayoutMode(layout);
    setTranslationLayout(layout);
  };

  const renderArticleMeta = () => (
    <Group gap="xs" mb="lg">
      {article.feed_title && (
        <Text size="sm" c="dimmed">
          {article.feed_title}
        </Text>
      )}
      {article.author && (
        <>
          <Text size="sm" c="dimmed">·</Text>
          <Text size="sm" c="dimmed">{article.author}</Text>
        </>
      )}
      {article.pub_date && (
        <>
          <Text size="sm" c="dimmed">·</Text>
          <Text size="sm" c="dimmed">
            {new Date(article.pub_date).toLocaleDateString(i18n.language, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </>
      )}
    </Group>
  );

  const renderSummary = () =>
    showSummary && summaryText ? (
      <Paper p="md" mb="md" withBorder bg="var(--mantine-color-blue-0)">
        <Group gap="xs" mb="xs">
          <IconRobot size={16} />
          <Text fw={600} size="sm">{t("aiSummary")}</Text>
        </Group>
        <Box className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {summaryText}
          </ReactMarkdown>
        </Box>
      </Paper>
    ) : null;

  const renderOriginalContent = () => (
    <Box
      className="article-content"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );

  const renderTranslationPanel = () => (
    <>
      <Group gap="xs" mb="xs">
        <IconLanguage size={16} />
        <Text fw={600} size="sm">{t("chineseTranslation")}</Text>
      </Group>
      <Box className="markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {translationText}
        </ReactMarkdown>
      </Box>
    </>
  );

  const renderContentArea = () => {
    if (layoutMode === "side-by-side" && showTranslation && translationText) {
      return (
        <Group wrap="nowrap" align="flex-start" gap={0} style={{ flex: 1 }}>
          <Box style={{ flex: 1, minWidth: 0 }} pr="md">
            <Title order={2} mb="xs">
              {article.title}
            </Title>
            {renderArticleMeta()}
            {renderSummary()}
            {article.content ? (
              renderOriginalContent()
            ) : null}
          </Box>
          <Divider orientation="vertical" />
          <Box style={{ flex: 1, minWidth: 0 }} pl="md">
            <Title order={2} mb="xs" c="dimmed">
              {t("chineseTranslation")}
            </Title>
            {renderTranslationPanel()}
          </Box>
        </Group>
      );
    }

    return (
      <Box maw={800}>
        <Title order={2} mb="xs">
          {article.title}
        </Title>
        {renderArticleMeta()}
        {renderSummary()}
        {layoutMode === "replace" && showTranslation && translationText ? (
          renderTranslationPanel()
        ) : article.content ? (
          renderOriginalContent()
        ) : null}
      </Box>
    );
  };

  return (
    <Stack h="100%" gap={0}>
      {/* Action Bar */}
      <Paper px="md" py="sm" radius={0}>
        <Group justify="space-between">
          <Group gap={4}>
            <Tooltip label={article.is_read ? t("markUnread") : t("markRead")}>
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => markReadMutation.mutate()}
              >
                {article.is_read ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t("toggleStar")}>
              <ActionIcon
                variant="subtle"
                size="sm"
                color="yellow"
                onClick={() => toggleStarMutation.mutate()}
              >
                {article.starred ? (
                  <IconStarFilled size={16} />
                ) : (
                  <IconStar size={16} />
                )}
              </ActionIcon>
            </Tooltip>
            {article.link && (
              <Tooltip label={t("openInBrowser")}>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={handleOpenInBrowser}
                >
                  <IconExternalLink size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>

          <Group gap={4}>
            <Menu>
              <Menu.Target>
                <Button
                  variant="light"
                  size="compact-sm"
                  leftSection={<IconLanguage size={14} />}
                  rightSection={<IconChevronDown size={14} />}
                  onClick={handleTranslateClick}
                  loading={translateMutation.isPending}
                >
                  {showTranslation ? t("hideTranslation") : t("translate")}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconLanguage size={14} />}
                  onClick={() => handleLayoutChange("replace")}
                  {...(layoutMode === "replace" ? { bg: "var(--mantine-color-blue-0)" } : {})}
                >
                  {t("replaceMode")}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconLanguage size={14} />}
                  onClick={() => handleLayoutChange("side-by-side")}
                  {...(layoutMode === "side-by-side" ? { bg: "var(--mantine-color-blue-0)" } : {})}
                >
                  {t("sideBySide")}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconRefresh size={14} />}
                  onClick={() => translateMutation.mutate({ force: true })}
                >
                  {t("reTranslate")}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <Button
              variant="light"
              size="compact-sm"
              leftSection={<IconRobot size={14} />}
              onClick={() => {
                if (summaryText) {
                  setShowSummary(!showSummary);
                } else {
                  summarizeMutation.mutate();
                }
              }}
              loading={summarizeMutation.isPending}
            >
              {showSummary ? t("hideSummary") : t("summarize")}
            </Button>
          </Group>
        </Group>
      </Paper>

      <Divider />

      {/* Article Content */}
      <ScrollArea style={{ flex: 1 }} px="xl" py="md">
        {renderContentArea()}
      </ScrollArea>
    </Stack>
  );
}
