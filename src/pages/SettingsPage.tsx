import { useState, useEffect } from "react";
import {
  Stack,
  Title,
  TextInput,
  Select,
  Button,
  Paper,
  Text,
  Group,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { notifications } from "@mantine/notifications";
import { getAiSettings, saveAiSettings, getLanguage, setLanguage } from "../api";
import type { AiConfig } from "../types";

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
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAiSettings()
      .then((settings: AiConfig) => {
        setConfig(settings);
      })
      .catch(() => {
        // Use defaults
      })
      .finally(() => setLoading(false));

    getLanguage().then((savedLang) => {
      if (savedLang) {
        setLang(savedLang);
      }
    }).catch(() => {
      // Use current i18n language
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

  const handleLanguageChange = async (value: string | null) => {
    if (!value) return;
    setLang(value);
    await i18n.changeLanguage(value);
    setLanguage(value).catch(() => {});
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
    <Stack p="xl" maw={600}>
      <Title order={3}>{t("title")}</Title>

      <Paper withBorder p="md" mt="md">
        <Title order={5} mb="md">
          {t("aiSettings")}
        </Title>
        <Text size="sm" c="dimmed" mb="lg">
          {t("aiDescription")}
        </Text>

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
                model: v === "anthropic" ? "claude-sonnet-4-20250514" : "gpt-4o-mini",
              }));
            }}
          />

          <TextInput
            label={t("apiKey")}
            type="password"
            placeholder={
              isAnthropic ? "sk-ant-..." : "sk-..."
            }
            value={config.api_key}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConfig((c: AiConfig) => ({ ...c, api_key: e.currentTarget.value }))
            }
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConfig((c: AiConfig) => ({ ...c, base_url: e.currentTarget.value }))
            }
          />

          <TextInput
            label={t("model")}
            description={
              isAnthropic
                ? t("modelAnthropicDesc")
                : t("modelOpenaiDesc")
            }
            placeholder={isAnthropic ? "claude-sonnet-4-20250514" : "gpt-4o-mini"}
            value={config.model}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConfig((c: AiConfig) => ({ ...c, model: e.currentTarget.value }))
            }
          />

          <Button onClick={handleSave} loading={saving} mt="md">
            {tc("save")}
          </Button>
        </Stack>
      </Paper>

      <Paper withBorder p="md">
        <Title order={5} mb="md">
          {t("language")}
        </Title>
        <Text size="sm" c="dimmed" mb="lg">
          {t("languageDescription")}
        </Text>
        <Select
          data={[
            { value: "zh-CN", label: t("chinese") },
            { value: "en", label: t("english") },
          ]}
          value={lang}
          onChange={handleLanguageChange}
        />
      </Paper>

      <Paper withBorder p="md">
        <Title order={5} mb="md">
          {t("keyboardShortcuts")}
        </Title>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm">j / k</Text>
            <Text size="sm" c="dimmed">
              {t("navigateArticles")}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">s</Text>
            <Text size="sm" c="dimmed">
              {t("starUnstar")}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">m</Text>
            <Text size="sm" c="dimmed">
              {t("markReadUnread")}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">r</Text>
            <Text size="sm" c="dimmed">
              {t("refreshFeeds")}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">o</Text>
            <Text size="sm" c="dimmed">
              {t("openInBrowser")}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">Ctrl+,</Text>
            <Text size="sm" c="dimmed">
              {t("openSettings")}
            </Text>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}
