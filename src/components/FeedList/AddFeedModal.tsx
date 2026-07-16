import { useState } from "react";
import {
  Modal,
  TextInput,
  Button,
  Stack,
  Text,
} from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFeed } from "../../api";
import { notifications } from "@mantine/notifications";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function AddFeedModal({ opened, onClose }: Props) {
  const [url, setUrl] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => addFeed(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      notifications.show({
        title: "Feed added",
        message: "The feed has been added successfully.",
        color: "green",
      });
      setUrl("");
      onClose();
    },
    onError: (error: Error) => {
      notifications.show({
        title: "Error",
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
    <Modal opened={opened} onClose={onClose} title="Add Feed" centered>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            label="Feed URL"
            placeholder="https://example.com/rss"
            value={url}
            onChange={(e) => setUrl(e.currentTarget.value)}
            required
            autoFocus
            data-autofocus
          />
          <Text size="xs" c="dimmed">
            Supports RSS 2.0, RSS 1.0, and Atom feeds.
          </Text>
          <Button
            type="submit"
            loading={mutation.isPending}
            fullWidth
          >
            Add
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
