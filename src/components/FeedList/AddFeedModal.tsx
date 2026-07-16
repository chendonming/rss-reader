import { useState } from "react";
import {
  Modal,
  TextInput,
  Button,
  Stack,
  Text,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFeed } from "../../api";
import { notifications } from "@mantine/notifications";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function AddFeedModal({ opened, onClose }: Props) {
  const { t } = useTranslation("layout");
  const { t: tc } = useTranslation("common");
  const [url, setUrl] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => addFeed(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      notifications.show({
        title: tc("feedAdded"),
        message: tc("feedAddedDesc"),
        color: "green",
      });
      setUrl("");
      onClose();
    },
    onError: (error: Error) => {
      notifications.show({
        title: tc("error"),
        message: error.message,
        color: "red",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      mutation.mutate();
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t("addFeedTitle")} centered>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            label={t("feedUrl")}
            placeholder={t("feedUrlPlaceholder")}
            value={url}
            onChange={(e) => setUrl(e.currentTarget.value)}
            required
            autoFocus
            data-autofocus
          />
          <Text size="xs" c="dimmed">
            {t("feedFormats")}
          </Text>
          <Button
            type="submit"
            loading={mutation.isPending}
            fullWidth
          >
            {tc("add")}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
