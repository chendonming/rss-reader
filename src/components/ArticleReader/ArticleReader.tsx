import { useState, useMemo, useEffect } from "react";
import "../../styles/article.css";
import {
  Box,
  ActionIcon,
  Tooltip,
  Button,
  Divider,
} from "@mantine/core";
import {
  IconStar,
  IconStarFilled,
  IconExternalLink,
  IconLanguage,
  IconRobot,
  IconEye,
  IconEyeOff,
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

  useEffect(() => {
    getTranslationLayout().then((layout) => {
      if (layout === "replace" || layout === "side-by-side") {
        setLayoutMode(layout);
      }
    });
  }, []);

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

  const renderArticleMeta = () => (
    <div className="rd-reader-meta">
      {article.feed_title && (
        <span>{article.feed_title}</span>
      )}
      {article.author && (
        <>
          <span className="rd-reader-meta-sep">·</span>
          <span>{article.author}</span>
        </>
      )}
      {article.pub_date && (
        <>
          <span className="rd-reader-meta-sep">·</span>
          <span>
            {new Date(article.pub_date).toLocaleDateString(i18n.language, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </>
      )}
    </div>
  );

  const renderSummary = () =>
    showSummary && summaryText ? (
      <div className="rd-ai-panel">
        <div className="rd-ai-panel-header">
          <IconRobot size={14} />
          <span>{t("aiSummary")}</span>
        </div>
        <Box className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {summaryText}
          </ReactMarkdown>
        </Box>
      </div>
    ) : null;

  const renderOriginalContent = () => (
    <Box
      className="article-content"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );

  const renderTranslationPanel = () => (
    <>
      <div className="rd-ai-panel-header" style={{ marginBottom: 12 }}>
        <IconLanguage size={14} />
        <span>{t("chineseTranslation")}</span>
      </div>
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
        <div style={{ display: "flex", gap: 0, flex: 1 }}>
          <Box style={{ flex: 1, minWidth: 0 }} pr="md">
            <h1 className="rd-reader-title">{article.title}</h1>
            {renderArticleMeta()}
            {renderSummary()}
            {article.content ? renderOriginalContent() : null}
          </Box>
          <Divider orientation="vertical" />
          <Box style={{ flex: 1, minWidth: 0 }} pl="md">
            <h1
              className="rd-reader-title"
              style={{ color: "var(--rd-text-secondary)" }}
            >
              {t("chineseTranslation")}
            </h1>
            {renderTranslationPanel()}
          </Box>
        </div>
      );
    }

    return (
      <div className="rd-reader-body">
        <h1 className="rd-reader-title">{article.title}</h1>
        {renderArticleMeta()}
        {renderSummary()}
        {layoutMode === "replace" && showTranslation && translationText
          ? renderTranslationPanel()
          : article.content
            ? renderOriginalContent()
            : null}
      </div>
    );
  };

  return (
    <div className="rd-reader">
      {/* Toolbar */}
      <div className="rd-reader-toolbar">
        <div className="rd-reader-toolbar-group">
          <Tooltip label={article.is_read ? t("markUnread") : t("markRead")}>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => markReadMutation.mutate()}
            >
              {article.is_read ? (
                <IconEyeOff size={15} />
              ) : (
                <IconEye size={15} />
              )}
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
                <IconStarFilled size={15} />
              ) : (
                <IconStar size={15} />
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
                <IconExternalLink size={15} />
              </ActionIcon>
            </Tooltip>
          )}
        </div>

        <div className="rd-reader-toolbar-group">
          <Button
            variant="light"
            size="compact-sm"
            leftSection={<IconLanguage size={13} />}
            onClick={handleTranslateClick}
            loading={translateMutation.isPending}
          >
            {showTranslation ? t("hideTranslation") : t("translate")}
          </Button>
          {showTranslation && translationText && (
            <Tooltip label={t("reTranslate")}>
              <ActionIcon
                variant="light"
                size="sm"
                onClick={() => translateMutation.mutate({ force: true })}
                loading={translateMutation.isPending}
              >
                <IconRefresh size={13} />
              </ActionIcon>
            </Tooltip>
          )}
          <Button
            variant="light"
            size="compact-sm"
            leftSection={<IconRobot size={13} />}
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
        </div>
      </div>

      {/* Content */}
      <div className="rd-reader-scroll">
        <div className="rd-reader-content">{renderContentArea()}</div>
      </div>
    </div>
  );
}
