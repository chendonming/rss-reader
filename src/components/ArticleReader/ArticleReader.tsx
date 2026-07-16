import { useState, useMemo } from "react";
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
} from "@mantine/core";
import {
  IconStar,
  IconStarFilled,
  IconExternalLink,
  IconLanguage,
  IconRobot,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import {
  markRead,
  toggleStar,
  translateArticle,
  summarizeArticle,
} from "../../api";
import type { Article } from "../../types";
import { notifications } from "@mantine/notifications";

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
  const queryClient = useQueryClient();

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
    mutationFn: () => translateArticle(article.id),
    onSuccess: (data) => {
      setTranslationText(data);
      setShowTranslation(true);
    },
    onError: (e: Error) => {
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
            <Button
              variant="light"
              size="compact-sm"
              leftSection={<IconLanguage size={14} />}
              onClick={() => {
                if (translationText) {
                  setShowTranslation(!showTranslation);
                } else {
                  translateMutation.mutate();
                }
              }}
              loading={translateMutation.isPending}
            >
              {showTranslation ? t("hideTranslation") : t("translate")}
            </Button>
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
        <Box maw={800}>
          <Title order={2} mb="xs">
            {article.title}
          </Title>
          <Group gap="xs" mb="lg">
            {article.feed_title && (
              <Text size="sm" c="dimmed">
                {article.feed_title}
              </Text>
            )}
            {article.author && (
              <>
                <Text size="sm" c="dimmed">
                  ·
                </Text>
                <Text size="sm" c="dimmed">
                  {article.author}
                </Text>
              </>
            )}
            {article.pub_date && (
              <>
                <Text size="sm" c="dimmed">
                  ·
                </Text>
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

          {/* AI Summary */}
          {showSummary && summaryText && (
            <Paper p="md" mb="md" withBorder bg="var(--mantine-color-blue-0)">
              <Group gap="xs" mb="xs">
                <IconRobot size={16} />
                <Text fw={600} size="sm">
                  {t("aiSummary")}
                </Text>
              </Group>
              <Text size="sm">{summaryText}</Text>
            </Paper>
          )}

          {/* Original Content */}
          <Box
            className="article-content"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          {/* Translation */}
          {showTranslation && translationText && (
            <>
              <Divider my="lg" label={t("translation")} labelPosition="center" />
              <Paper p="md" withBorder bg="var(--mantine-color-gray-0)">
                <Group gap="xs" mb="xs">
                  <IconLanguage size={16} />
                  <Text fw={600} size="sm">
                    {t("chineseTranslation")}
                  </Text>
                </Group>
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {translationText}
                </Text>
              </Paper>
            </>
          )}
        </Box>
      </ScrollArea>
    </Stack>
  );
}
