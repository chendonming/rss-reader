import { useState, useEffect } from "react";
import {
  Stack,
  TextInput,
  Select,
  Button,
  Text,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { notifications } from "@mantine/notifications";
import {
  getAiSettings,
  saveAiSettings,
  testAiConnection,
  getLanguage,
  setLanguage,
  getTranslationLayout,
  setTranslationLayout,
} from "../api";
import type { AiConfig, TranslationLayout } from "../types";
import { log } from "../utils/logger";

export default function SettingsPage() {
  const { t } = useTranslation("settings");
  const { t: tc } = useTranslation("common");
  const [config, setConfig] = useState<AiConfig>({
    provider: "openai",
    api_key: "",
    base_url: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  });
  const [lang, setLang] = useState(i18n.language);
  const [layoutMode, setLayoutMode] = useState<TranslationLayout>("replace");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    getAiSettings()
      .then((settings: AiConfig) => {
        setConfig(settings);
      })
      .catch((e) => {
        log.warn("getAiSettings failed, using defaults:", e);
      })
      .finally(() => setLoading(false));

    getLanguage()
      .then((savedLang) => {
        if (savedLang) {
          setLang(savedLang);
        }
      })
      .catch((e) => {
        log.warn("getLanguage failed, using current i18n language:", e);
      });

    getTranslationLayout()
      .then((layout) => {
        if (layout === "replace" || layout === "side-by-side") {
          setLayoutMode(layout);
        }
      })
      .catch((e) => {
        log.warn("getTranslationLayout failed, using default:", e);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAiSettings(config);
      notifications.show({
        title: tc("saved"),
        message: tc("aiSettingsSaved"),
        color: "green",
      });
    } catch (e) {
      notifications.show({
        title: tc("error"),
        message: String(e),
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      await testAiConnection(config);
      notifications.show({
        title: tc("saved"),
        message: t("connectionSuccess"),
        color: "green",
      });
    } catch (e) {
      notifications.show({
        title: t("connectionFailed"),
        message: String(e),
        color: "red",
        autoClose: false,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleLanguageChange = async (value: string | null) => {
    if (!value) return;
    setLang(value);
    await i18n.changeLanguage(value);
    setLanguage(value).catch((e) => log.warn("setLanguage failed:", e));
  };

  const handleLayoutChange = (value: string | null) => {
    if (!value) return;
    const layout = value as TranslationLayout;
    setLayoutMode(layout);
    setTranslationLayout(layout).catch((e) =>
      log.warn("setTranslationLayout failed:", e)
    );
  };

  if (loading) {
    return (
      <Stack p="xl" align="center">
        <Text c="dimmed">{tc("loading")}</Text>
      </Stack>
    );
  }

  const isAnthropic = config.provider === "anthropic";

  return (
    <div className="rd-settings">
      <h1 className="rd-settings-title">{t("title")}</h1>

      <div className="rd-settings-section">
        <div className="rd-settings-section-title">{t("aiSettings")}</div>
        <div className="rd-settings-section-desc">{t("aiDescription")}</div>

        <Stack>
          <Select
            label={t("aiProvider")}
            data={[
              { value: "openai", label: t("openai") },
              { value: "anthropic", label: t("anthropic") },
            ]}
            value={config.provider}
            onChange={(v: string | null) => {
              if (!v) return;
              setConfig((c: AiConfig) => ({
                ...c,
                provider: v,
                base_url:
                  v === "anthropic"
                    ? "https://api.anthropic.com"
                    : "https://api.openai.com/v1",
                model:
                  v === "anthropic"
                    ? "claude-sonnet-4-20250514"
                    : "gpt-4o-mini",
              }));
            }}
          />

          <TextInput
            label={t("apiKey")}
            type="password"
            placeholder={isAnthropic ? "sk-ant-..." : "sk-..."}
            value={config.api_key}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const v = e.currentTarget.value;
              setConfig((c: AiConfig) => ({ ...c, api_key: v }));
            }}
          />

          <TextInput
            label={t("baseUrl")}
            description={
              isAnthropic
                ? t("baseUrlAnthropicDesc")
                : t("baseUrlOpenaiDesc")
            }
            placeholder={
              isAnthropic
                ? "https://api.anthropic.com"
                : "https://api.openai.com/v1"
            }
            value={config.base_url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const v = e.currentTarget.value;
              setConfig((c: AiConfig) => ({ ...c, base_url: v }));
            }}
          />

          <TextInput
            label={t("model")}
            description={
              isAnthropic
                ? t("modelAnthropicDesc")
                : t("modelOpenaiDesc")
            }
            placeholder={
              isAnthropic ? "claude-sonnet-4-20250514" : "gpt-4o-mini"
            }
            value={config.model}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const v = e.currentTarget.value;
              setConfig((c: AiConfig) => ({ ...c, model: v }));
            }}
          />

          <Button onClick={handleTestConnection} loading={testing} variant="light" mt="xs">
            {testing ? t("testingConnection") : t("testConnection")}
          </Button>

          <Button onClick={handleSave} loading={saving} mt="md">
            {tc("save")}
          </Button>
        </Stack>
      </div>

      <div className="rd-settings-section">
        <div className="rd-settings-section-title">{t("language")}</div>
        <div className="rd-settings-section-desc">
          {t("languageDescription")}
        </div>
        <Select
          data={[
            { value: "zh-CN", label: t("chinese") },
            { value: "en", label: t("english") },
          ]}
          value={lang}
          onChange={handleLanguageChange}
        />
      </div>

      <div className="rd-settings-section">
        <div className="rd-settings-section-title">
          {t("translationLayout")}
        </div>
        <div className="rd-settings-section-desc">
          {t("translationLayoutDesc")}
        </div>
        <Select
          data={[
            { value: "replace", label: t("replaceMode") },
            { value: "side-by-side", label: t("sideBySide") },
          ]}
          value={layoutMode}
          onChange={handleLayoutChange}
        />
      </div>

      <div className="rd-settings-section">
        <div className="rd-settings-section-title">
          {t("keyboardShortcuts")}
        </div>
        <div className="rd-settings-shortcuts">
          <div className="rd-settings-shortcut-row">
            <span>j / k</span>
            <kbd>{t("navigateArticles")}</kbd>
          </div>
          <div className="rd-settings-shortcut-row">
            <span>s</span>
            <kbd>{t("starUnstar")}</kbd>
          </div>
          <div className="rd-settings-shortcut-row">
            <span>m</span>
            <kbd>{t("markReadUnread")}</kbd>
          </div>
          <div className="rd-settings-shortcut-row">
            <span>r</span>
            <kbd>{t("refreshFeeds")}</kbd>
          </div>
          <div className="rd-settings-shortcut-row">
            <span>o</span>
            <kbd>{t("openInBrowser")}</kbd>
          </div>
          <div className="rd-settings-shortcut-row">
            <span>Ctrl+,</span>
            <kbd>{t("openSettings")}</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
