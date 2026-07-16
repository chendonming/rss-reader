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
import { notifications } from "@mantine/notifications";
import { getAiSettings, saveAiSettings } from "../api";
import type { AiConfig } from "../types";

export default function SettingsPage() {
  const [config, setConfig] = useState<AiConfig>({
    provider: "openai",
    api_key: "",
    base_url: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  });
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
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAiSettings(config);
      notifications.show({
        title: "Saved",
        message: "AI settings saved successfully.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        title: "Error",
        message: String(e),
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Stack p="xl" align="center">
        <Text c="dimmed">Loading...</Text>
      </Stack>
    );
  }

  const isAnthropic = config.provider === "anthropic";

  return (
    <Stack p="xl" maw={600}>
      <Title order={3}>Settings</Title>

      <Paper withBorder p="md" mt="md">
        <Title order={5} mb="md">
          AI Settings
        </Title>
        <Text size="sm" c="dimmed" mb="lg">
          Configure AI providers for article translation and summarization.
        </Text>

        <Stack>
          <Select
            label="AI Provider"
            data={[
              { value: "openai", label: "OpenAI Compatible" },
              { value: "anthropic", label: "Anthropic" },
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
            label="API Key"
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
            label="Base URL"
            description={
              isAnthropic
                ? "Anthropic API base URL"
                : "OpenAI-compatible API base URL (e.g., https://api.openai.com/v1)"
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
            label="Model"
            description={
              isAnthropic
                ? "e.g., claude-sonnet-4-20250514, claude-haiku-3-5-20241022"
                : "e.g., gpt-4o-mini, gpt-4o, deepseek-chat"
            }
            placeholder={isAnthropic ? "claude-sonnet-4-20250514" : "gpt-4o-mini"}
            value={config.model}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConfig((c: AiConfig) => ({ ...c, model: e.currentTarget.value }))
            }
          />

          <Button onClick={handleSave} loading={saving} mt="md">
            Save Settings
          </Button>
        </Stack>
      </Paper>

      <Paper withBorder p="md">
        <Title order={5} mb="md">
          Keyboard Shortcuts
        </Title>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm">j / k</Text>
            <Text size="sm" c="dimmed">
              Navigate articles up/down
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">s</Text>
            <Text size="sm" c="dimmed">
              Star / unstar article
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">m</Text>
            <Text size="sm" c="dimmed">
              Mark read / unread
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">r</Text>
            <Text size="sm" c="dimmed">
              Refresh feeds
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">o</Text>
            <Text size="sm" c="dimmed">
              Open in browser
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">Ctrl+,</Text>
            <Text size="sm" c="dimmed">
              Open settings
            </Text>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}
